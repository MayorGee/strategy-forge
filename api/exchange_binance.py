"""
Binance **public** spot klines → canonical `OhlcvBar` list.

No API key: `GET /api/v3/klines` only needs symbol, interval, time window.
This is the reference shape; CSV uploads should map to the same OhlcvBar fields.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import HTTPException

from schemas import OhlcvBar

BINANCE_SPOT = "https://api.binance.com/api/v3/klines"
MAX_KLINES_PER_REQUEST = 1000
# Safety cap after pagination (MVP — avoids accidental huge downloads).
MAX_BARS_PER_RUN = 20_000


def ui_symbol_to_binance_pair(symbol: str) -> str:
    """`BTC/USDT` → `BTCUSDT` (Binance query param)."""
    cleaned = "".join(c for c in symbol.upper().strip() if c.isalnum())
    if not cleaned:
        raise HTTPException(status_code=422, detail="Invalid empty symbol")
    return cleaned


def parse_ui_date_range_ms(start: str, end: str) -> tuple[int, int]:
    """
    UI dates are `MM/DD/YYYY` (see DataInput). Interpret as UTC day bounds:
    start = 00:00:00, end = end-of-day.
    """
    try:
        s = datetime.strptime(start.strip(), "%m/%d/%Y").replace(tzinfo=timezone.utc)
        e = datetime.strptime(end.strip(), "%m/%d/%Y").replace(tzinfo=timezone.utc)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail="startDate/endDate must be MM/DD/YYYY",
        ) from exc
    if e < s:
        raise HTTPException(status_code=422, detail="endDate must be on or after startDate")
    end_ms = int(e.replace(hour=23, minute=59, second=59, microsecond=999_000).timestamp() * 1000)
    start_ms = int(s.timestamp() * 1000)
    return start_ms, end_ms


def _row_to_bar(row: list[Any]) -> OhlcvBar:
    open_ms = int(row[0])
    t = (
        datetime.fromtimestamp(open_ms / 1000.0, tz=timezone.utc)
        .isoformat()
        .replace("+00:00", "Z")
    )
    return OhlcvBar(
        time=t,
        open=float(row[1]),
        high=float(row[2]),
        low=float(row[3]),
        close=float(row[4]),
        volume=float(row[5]),
    )


def fetch_binance_spot_bars(symbol: str, interval: str, start_ms: int, end_ms: int) -> list[OhlcvBar]:
    pair = ui_symbol_to_binance_pair(symbol)
    interval = interval.strip()
    if not interval:
        raise HTTPException(status_code=422, detail="interval is required")

    out: list[OhlcvBar] = []
    cursor = start_ms

    try:
        with httpx.Client(timeout=45.0) as client:
            while cursor <= end_ms and len(out) < MAX_BARS_PER_RUN:
                r = client.get(
                    BINANCE_SPOT,
                    params={
                        "symbol": pair,
                        "interval": interval,
                        "startTime": cursor,
                        "endTime": end_ms,
                        "limit": MAX_KLINES_PER_REQUEST,
                    },
                )
                if r.status_code != 200:
                    raise HTTPException(
                        status_code=502,
                        detail=f"Binance klines error ({r.status_code}): {r.text[:300]}",
                    )
                chunk: list[list[Any]] = r.json()
                if not chunk:
                    break
                for raw in chunk:
                    if int(raw[0]) > end_ms:
                        continue
                    out.append(_row_to_bar(raw))
                    if len(out) >= MAX_BARS_PER_RUN:
                        break
                cursor = int(chunk[-1][0]) + 1
                if len(chunk) < MAX_KLINES_PER_REQUEST or len(out) >= MAX_BARS_PER_RUN:
                    break
    except HTTPException:
        raise
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=f"Could not reach Binance: {exc}") from exc

    # De-dupe / sort by open time (pagination edge cases)
    seen: set[str] = set()
    deduped: list[OhlcvBar] = []
    for b in sorted(out, key=lambda x: x.time):
        if b.time in seen:
            continue
        seen.add(b.time)
        deduped.append(b)

    if len(deduped) > MAX_BARS_PER_RUN:
        raise HTTPException(
            status_code=413,
            detail=f"Too many bars (>{MAX_BARS_PER_RUN}) for this MVP — narrow the date range or use a coarser interval.",
        )
    return deduped
