"""
Strategy Forge API — entry point.

Chunk 1: health + CORS.
Chunk 2: POST /backtest — Pydantic-validated body, stub response (dashboardMock parity).
Chunk 3: Resolve OHLCV — Binance public klines (exchange) or `bars` from client (CSV); same schema.
Chunk 4: Engine — long-only backtest (buy & hold, SMA crossover, RSI) on resolved bars.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from bars_pipeline import resolve_bars
from engine import run_backtest_engine
from schemas import BacktestRequest, BacktestResponse

# --- The app instance ---------------------------------------------------------
app = FastAPI(
    title="Strategy Forge API",
    description="Backtest engine and analysis endpoints for the Strategy Forge UI.",
    version="0.1.0",
)

# --- CORS (browser security) --------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Routes -------------------------------------------------------------------
@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    """
    Simple liveness check. No database, no auth — just proves the process is up.

    Frontend can later: fetch(`${apiBase}/health`) before enabling "real" runs.
    """
    return {"status": "ok"}


@app.post(
    "/backtest",
    response_model=BacktestResponse,
    response_model_by_alias=True,
    tags=["backtest"],
)
def run_backtest(body: BacktestRequest) -> BacktestResponse:
    """
    Resolve bars, then run the portfolio engine (costs + strategy).

    Raises 422 if bars cannot be loaded or parameters are invalid for the series length.
    """
    try:
        bars = resolve_bars(body)
        return run_backtest_engine(body, bars)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


# --- Running locally ----------------------------------------------------------
#
# Project default port is 8888:
#   uvicorn main:app --reload --host 127.0.0.1 --port 8888
#
# Docs: http://127.0.0.1:8888/docs  — set API base in the UI Settings to http://127.0.0.1:8888
#
# If the port is busy or blocked, pick another (e.g. 8010) and match Settings + CORS if needed.
# Check a port:  netstat -ano | findstr :8888


# .\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8888
