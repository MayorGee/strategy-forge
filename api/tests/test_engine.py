from __future__ import annotations

from typing import Literal

import pytest

from engine import run_backtest_engine
from schemas import (
    BacktestParams,
    BacktestRequest,
    DatasetConfig,
    OhlcvBar,
    PortfolioSettings,
)


def _req(
    strategy_id: Literal["buy_hold", "sma_crossover", "rsi"] = "buy_hold",
    *,
    fast: int = 5,
    slow: int = 10,
    rsi_p: int = 14,
    rsi_ob: int = 70,
    rsi_os: int = 30,
    initial: float = 10_000.0,
    fee_rt: float = 0.0,
    slip_bps: float = 0.0,
) -> BacktestRequest:
    return BacktestRequest(
        strategy_id=strategy_id,
        params=BacktestParams(
            fast_period=fast,
            slow_period=slow,
            rsi_period=rsi_p,
            rsi_overbought=rsi_ob,
            rsi_oversold=rsi_os,
        ),
        portfolio=PortfolioSettings(
            initial_capital=initial,
            fee_round_trip_pct=fee_rt,
            slippage_bps=slip_bps,
        ),
        dataset=DatasetConfig(
            symbol="TEST",
            start_date="01/01/2024",
            end_date="01/31/2024",
            interval="1d",
            exchange="Binance",
            data_source="exchange",
            csv_file_label=None,
        ),
        bars=None,
    )


def _flat_bars(n: int, price: float = 100.0) -> list[OhlcvBar]:
    return [
        OhlcvBar(
            time=f"2024-01-{i + 1:02d}T00:00:00Z",
            open=price,
            high=price,
            low=price,
            close=price,
            volume=1.0,
        )
        for i in range(n)
    ]


def test_buy_hold_needs_two_bars() -> None:
    with pytest.raises(ValueError, match="at least two bars"):
        run_backtest_engine(_req(), _flat_bars(1))


def test_buy_hold_flat_no_friction_one_round_trip() -> None:
    bars = _flat_bars(5)
    out = run_backtest_engine(_req(fee_rt=0, slip_bps=0), bars)
    assert len(out.executions) == 1
    assert out.executions[0].side == "long"
    assert out.metrics[-1].label == "Total Trades"
    assert out.metrics[-1].value == "1"


def test_sma_slow_must_exceed_fast() -> None:
    bars = _flat_bars(20)
    with pytest.raises(ValueError, match="Slow period must be greater"):
        run_backtest_engine(_req("sma_crossover", fast=10, slow=10), bars)


def test_sma_runs_with_enough_bars() -> None:
    # Ramp so slow SMA eventually below price and fast tracks higher
    closes = [100.0 + i * 2.0 for i in range(30)]
    bars = [
        OhlcvBar(
            time=f"2024-01-{i + 1:02d}T00:00:00Z",
            open=c,
            high=c,
            low=c,
            close=c,
            volume=1.0,
        )
        for i, c in enumerate(closes)
    ]
    out = run_backtest_engine(_req("sma_crossover", fast=3, slow=5), bars)
    assert len(out.metrics) >= 1
    assert len(out.equity) >= 2


def test_rsi_not_enough_bars() -> None:
    """Engine guard when series is shorter than RSI warmup needs."""
    bars = _flat_bars(5)
    with pytest.raises(ValueError, match="Not enough bars for RSI"):
        run_backtest_engine(_req("rsi"), bars)


def test_zero_initial_capital_rejected() -> None:
    r = _req()
    zero = r.model_copy(
        update={
            "portfolio": r.portfolio.model_copy(update={"initial_capital": 0}),
        },
    )
    with pytest.raises(ValueError, match="Initial capital"):
        run_backtest_engine(zero, _flat_bars(3))
