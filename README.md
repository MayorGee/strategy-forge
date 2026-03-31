# Strategy Forge

React + TypeScript UI for configuring backtests, plus a **FastAPI** service that resolves OHLCV (Binance spot or CSV from the client) and runs a **long-only** Python engine (buy & hold, SMA crossover, RSI).

## Prerequisites

- Node.js 20+ (for the Vite app)
- Python 3.11+ with `pip`

## Frontend

```bash
npm install
npm run dev
```

Dev server defaults to `http://127.0.0.1:5173`. In **Settings**, set the API base URL to your running backend (e.g. `http://127.0.0.1:8888`).

## API

From the `api` directory:

```bash
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8888
```

- OpenAPI docs: `http://127.0.0.1:8888/docs`
- Health: `GET /health`

CORS allows the Vite dev origins (`localhost` / `127.0.0.1` on port 5173). Add your production origin to `CORSMiddleware` in `api/main.py` when you deploy.

## Tests

With dependencies installed (`api/requirements.txt`):

```bash
cd api
python -m pytest tests -q
```

The suite covers the backtest engine (strategies, validation) and HTTP routes (`/health`, CSV `POST /backtest`) without calling Binance.

## Data notes

- **Asset selection** uses server-side Binance spot klines for supported symbols.
- **Forex and metals** (e.g. EURUSD, XAUUSD): use **CSV upload** in the UI; the API accepts the same OHLCV shape as exchange-backed bars.

## Vite template

The front end started from the official Vite + React + TS template. See [Vite docs](https://vitejs.dev/) and [React](https://react.dev/) for tooling details.
