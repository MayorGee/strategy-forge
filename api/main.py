"""
Strategy Forge API — entry point.

Chunk 1: health + CORS.
Chunk 2: POST /backtest — Pydantic-validated body, stub response (dashboardMock parity).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mock_results import MOCK_EQUITY, MOCK_EXECUTIONS, MOCK_METRICS
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
    Run a backtest (stub).

    Body matches what the UI already holds: strategy, params, portfolio, dataset.
    Values are accepted and validated but not used yet; response matches
    src/data/dashboardMock.ts so the React app can wire fetch() without type changes.
    """
    _ = body  # noqa: F841 — engine will use this in a later chunk
    return BacktestResponse(metrics=MOCK_METRICS, equity=MOCK_EQUITY, executions=MOCK_EXECUTIONS)


# --- Running locally ----------------------------------------------------------
#
# Project default port is 8888:
#   uvicorn main:app --reload --host 127.0.0.1 --port 8888
#
# Docs: http://127.0.0.1:8888/docs  — set API base in the UI Settings to http://127.0.0.1:8888
#
# If the port is busy or blocked, pick another (e.g. 8010) and match Settings + CORS if needed.
# Check a port:  netstat -ano | findstr :8888
