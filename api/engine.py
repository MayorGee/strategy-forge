"""
Long-only backtest: each bar we may hold cash or full position in the asset.

Costs: slippage on fill; half of round-trip fee on entry notional, half on exit.
"""

from __future__ import annotations

import math

from schemas import (
    BacktestRequest,
    BacktestResponse,
    DisplayMetric,
    EquityChartPoint,
    ExecutionLogRow,
    OhlcvBar,
)

MAX_EQUITY_POINTS = 450


def _rolling_sma(closes: list[float], w: int) -> list[float]:
    n = len(closes)
    out = [math.nan] * n
    if w <= 0 or n < w:
        return out
    s = sum(closes[:w])
    out[w - 1] = s / w
    for i in range(w, n):
        s += closes[i] - closes[i - w]
        out[i] = s / w
    return out


def _rsi_wilder(closes: list[float], period: int) -> list[float]:
    n = len(closes)
    out = [math.nan] * n
    if n < period + 1:
        return out
    gains: list[float] = []
    losses: list[float] = []
    for i in range(1, n):
        d = closes[i] - closes[i - 1]
        gains.append(max(d, 0.0))
        losses.append(max(-d, 0.0))

    ag = sum(gains[:period]) / period
    al = sum(losses[:period]) / period

    def rsi_of(ag_: float, al_: float) -> float:
        if al_ == 0 and ag_ == 0:
            return 50.0
        if al_ == 0:
            return 100.0
        rs = ag_ / al_
        return 100.0 - (100.0 / (1.0 + rs))

    out[period] = rsi_of(ag, al)
    for i in range(period + 1, n):
        gi = gains[i - 1]
        li = losses[i - 1]
        ag = ((period - 1) * ag + gi) / period
        al = ((period - 1) * al + li) / period
        out[i] = rsi_of(ag, al)
    return out


def _fmt_pct(x: float, d: int = 1) -> str:
    sign = "+" if x > 0 else ""
    return f"{sign}{x:.{d}f}%"


def _downsample_indices(n: int, max_pts: int) -> list[int]:
    if n <= max_pts:
        return list(range(n))
    step = (n - 1) / (max_pts - 1)
    return [min(int(round(i * step)), n - 1) for i in range(max_pts)]


def _drawdown_pct(equity: list[float]) -> list[float]:
    peak = equity[0] if equity else 0.0
    dd: list[float] = []
    for e in equity:
        peak = max(peak, e)
        dd.append(0.0 if peak <= 0 else (e - peak) / peak * 100.0)
    return dd


def _sharpe_rough(rets: list[float]) -> float | None:
    if len(rets) < 4:
        return None
    m = sum(rets) / len(rets)
    v = sum((r - m) ** 2 for r in rets) / (len(rets) - 1)
    if v <= 1e-18:
        return None
    return (m / math.sqrt(v)) * math.sqrt(min(len(rets), 252))


def _simulate(
    closes: list[float],
    times: list[str],
    asset: str,
    initial: float,
    slip: float,
    fee_half: float,
    want_long: list[bool],
) -> tuple[list[float], list[ExecutionLogRow]]:
    """want_long[i] = target position is long (100%) after processing bar i."""
    n = len(closes)
    cash = initial
    shares = 0.0
    entry_px = 0.0
    entry_shares = 0.0
    entry_fee = 0.0
    execs: list[ExecutionLogRow] = []
    n_id = 0
    eq: list[float] = []

    def mark() -> float:
        return cash + shares * closes[i]

    def buy(i: int) -> None:
        nonlocal cash, shares, entry_px, entry_shares, entry_fee
        if shares > 0 or cash <= 0:
            return
        raw = closes[i]
        fill = raw * (1.0 + slip)
        fee = cash * fee_half
        invest = cash - fee
        if fill <= 0 or invest <= 0:
            return
        sh = invest / fill
        entry_px = fill
        entry_shares = sh
        entry_fee = fee
        shares = sh
        cash = 0.0

    def sell(i: int) -> None:
        nonlocal cash, shares, entry_px, entry_shares, entry_fee, n_id
        if shares <= 0:
            return
        raw = closes[i]
        fill = raw * (1.0 - slip)
        proceeds_gross = shares * fill
        fee = proceeds_gross * fee_half
        exit_proceeds = proceeds_gross - fee
        entry_cost = entry_px * entry_shares + entry_fee
        realized = exit_proceeds - entry_cost
        n_id += 1
        execs.append(
            ExecutionLogRow(
                id=str(n_id),
                asset=asset,
                side="long",
                entry_price=round(entry_px, 2),
                exit_price=round(fill, 2),
                pnl_usd=round(realized, 2),
                status="profit" if realized >= 0 else "loss",
            ),
        )
        cash = exit_proceeds
        shares = 0.0
        entry_shares = 0.0
        entry_fee = 0.0

    for i in range(n):
        target = want_long[i]
        if target and shares == 0:
            buy(i)
        elif not target and shares > 0:
            sell(i)
        eq.append(mark())

    if shares > 0:
        sell(n - 1)

    return eq, execs


def _build_want_long_buy_hold(n: int) -> list[bool]:
    return [True] * n


def _build_want_long_sma(
    closes: list[float], fast_p: int, slow_p: int
) -> list[bool]:
    sma_f = _rolling_sma(closes, fast_p)
    sma_s = _rolling_sma(closes, slow_p)
    return [
        not math.isnan(sma_f[i])
        and not math.isnan(sma_s[i])
        and sma_f[i] >= sma_s[i]
        for i in range(len(closes))
    ]


def _build_want_long_rsi(
    closes: list[float], period: int, ob: int, os: int
) -> list[bool]:
    rsi = _rsi_wilder(closes, period)
    n = len(closes)
    pos = False
    want: list[bool] = []
    for i in range(n):
        r = rsi[i]
        if math.isnan(r):
            want.append(pos)
            continue
        if not pos and r < os:
            pos = True
        elif pos and r > ob:
            pos = False
        want.append(pos)
    return want


def run_backtest_engine(body: BacktestRequest, bars: list[OhlcvBar]) -> BacktestResponse:
    cap0 = body.portfolio.initial_capital
    if cap0 <= 0:
        raise ValueError("Initial capital must be greater than zero")

    slip = body.portfolio.slippage_bps / 10_000.0
    fee_half = (body.portfolio.fee_round_trip_pct / 100.0) / 2.0
    asset = body.dataset.symbol.strip() or "—"
    times = [b.time for b in bars]
    closes = [float(b.close) for b in bars]
    n = len(closes)

    if n < 2:
        raise ValueError("Need at least two bars to backtest")

    strat = body.strategy_id
    if strat == "buy_hold":
        want = _build_want_long_buy_hold(n)
    elif strat == "sma_crossover":
        fp, sp = body.params.fast_period, body.params.slow_period
        if sp <= fp:
            raise ValueError("Slow period must be greater than fast period")
        if n < sp + 1:
            raise ValueError("Not enough bars for these SMA periods")
        want = _build_want_long_sma(closes, fp, sp)
    elif strat == "rsi":
        p, ob, os_ = body.params.rsi_period, body.params.rsi_overbought, body.params.rsi_oversold
        if os_ >= ob:
            raise ValueError("RSI oversold must be below overbought")
        if n < p + 5:
            raise ValueError("Not enough bars for RSI parameters")
        want = _build_want_long_rsi(closes, p, ob, os_)
    else:
        raise ValueError(f"Unknown strategy {strat!r}")

    equity_full, executions = _simulate(closes, times, asset, cap0, slip, fee_half, want)
    final_eq = equity_full[-1]
    total_ret = (final_eq - cap0) / cap0 * 100.0 if cap0 > 0 else 0.0
    dd = _drawdown_pct(equity_full)
    max_dd = min(dd) if dd else 0.0

    rets = [
        (equity_full[i] - equity_full[i - 1]) / equity_full[i - 1]
        for i in range(1, len(equity_full))
        if equity_full[i - 1] > 0
    ]
    sharpe = _sharpe_rough(rets)
    wins = sum(1 for e in executions if e.status == "profit")
    losses = sum(1 for e in executions if e.status == "loss")
    closed = wins + losses
    win_rate = (wins / closed * 100.0) if closed else 0.0
    gp = sum(e.pnl_usd for e in executions if e.pnl_usd > 0)
    gl = abs(sum(e.pnl_usd for e in executions if e.pnl_usd < 0))
    pf = (gp / gl) if gl > 1e-9 else None

    idxs = _downsample_indices(n, MAX_EQUITY_POINTS)
    equity_out = [
        EquityChartPoint(
            date=times[j][:10] if len(times[j]) >= 10 else times[j],
            equity=round(equity_full[j], 2),
            drawdown=round(dd[j], 2),
        )
        for j in idxs
    ]

    metrics: list[DisplayMetric] = [
        DisplayMetric(
            label="Total Return",
            value=_fmt_pct(total_ret),
            tone="profit" if total_ret >= 0 else "loss",
            emphasized=True,
        ),
        DisplayMetric(
            label="Sharpe Ratio",
            value=f"{sharpe:.2f}" if sharpe is not None else "—",
            tone="accent" if sharpe and sharpe > 1 else None,
            emphasized=sharpe is not None and sharpe > 1,
        ),
        DisplayMetric(label="Max Drawdown", value=_fmt_pct(max_dd, 1), tone="loss"),
        DisplayMetric(label="Win Rate", value=_fmt_pct(win_rate, 1)),
        DisplayMetric(
            label="Profit Factor",
            value=f"{pf:.2f}" if pf is not None else "—",
            tone="accent",
            emphasized=pf is not None and pf > 1,
        ),
        DisplayMetric(label="Total Trades", value=str(closed)),
    ]

    return BacktestResponse(metrics=metrics, equity=equity_out, executions=executions)
