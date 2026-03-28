"""
Strategy Forge API — entry point (chunk 1: health + wiring only).

Think of this file like `src/main.tsx` for the backend:
- We create an "app" object (FastAPI).
- We register routes (URL → Python function).
- Uvicorn (later) is the dev server that listens on a port, like Vite for the UI.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


# --- Running locally ----------------------------------------------------------
#
# Project default port is 8888:
#   uvicorn main:app --reload --host 127.0.0.1 --port 8888
#
# Docs: http://127.0.0.1:8888/docs  — set API base in the UI Settings to http://127.0.0.1:8888
#
# If the port is busy or blocked, pick another (e.g. 8010) and match Settings + CORS if needed.
# Check a port:  netstat -ano | findstr :8888
