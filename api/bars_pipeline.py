"""
Turn a `BacktestRequest` into a single `list[OhlcvBar]`.

- **exchange** + Binance: server downloads klines (canonical bars).
- **csv**: client must send `bars` (same schema); validates non-empty.

One list type feeds the engine next — loaders differ, the pipeline does not.
"""

from fastapi import HTTPException

from exchange_binance import fetch_binance_spot_bars, parse_ui_date_range_ms
from schemas import BacktestRequest, OhlcvBar


def resolve_bars(body: BacktestRequest) -> list[OhlcvBar]:
    src = body.dataset.data_source
    if src == "csv":
        if not body.bars:
            raise HTTPException(
                status_code=422,
                detail="CSV mode requires `bars`: upload a file in the UI so the client can send parsed OHLCV.",
            )
        return body.bars

    # exchange
    ex = (body.dataset.exchange or "").strip().lower()
    if ex != "binance":
        raise HTTPException(
            status_code=501,
            detail=f"Server-side fetch for '{body.dataset.exchange}' is not implemented yet. "
            "Choose Binance (crypto) or use CSV upload.",
        )
    start_ms, end_ms = parse_ui_date_range_ms(body.dataset.start_date, body.dataset.end_date)
    bars = fetch_binance_spot_bars(
        body.dataset.symbol,
        body.dataset.interval,
        start_ms,
        end_ms,
    )
    if not bars:
        raise HTTPException(
            status_code=422,
            detail="No candles returned — check symbol exists on Binance spot, interval, and dates "
            "(asset may not have traded in that window).",
        )
    return bars
