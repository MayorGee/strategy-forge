# Strategy Forge

React + TypeScript UI for configuring backtests, plus a **FastAPI** service that resolves OHLCV and runs a **long-only** Python engine on the same bar schema everywhere (exchange or CSV).

## What you get

- **Data:** **Binance** or **Bybit** public **spot** klines (server-side, no exchange keys), or **CSV upload** for other markets.
- **Strategies:** Buy & hold, **SMA** crossover, **EMA** crossover, **RSI**; the UI also lists **templates** (preset parameters on those engines).
- **Results:** KPI tiles, equity curve, execution log; optional **out-of-sample** metrics (`OOS · …`) when you set an OOS start date (UTC, `MM/DD/YYYY`).
- **History:** Runs stored in the browser (local storage), including **data feed** (venue or CSV file name).

Default date range in the UI for new sessions: **01/01/2023** – **12/31/2025** (adjust in Data). Server-side exchange pulls are capped at **20,000** bars per run—use a narrower window or a coarser interval if you hit that limit.

## Prerequisites

- Node.js 20+ (Vite app)
- Python 3.11+ with `pip`

## Frontend (development)

```bash
npm install
npm run dev
```

Dev server defaults to `http://127.0.0.1:5173`. In **Settings**, set the API base URL to your running backend (e.g. `http://127.0.0.1:8888`).

### Production build

```bash
npm run build
```

Output is in `dist/`. Serve those static files from your host (or object storage + CDN). Users must set the API URL in **Settings** to wherever the FastAPI app is exposed (same site or cross-origin, provided CORS allows it).

## API (development)

From the `api` directory:

```bash
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8888
```

- OpenAPI docs: `http://127.0.0.1:8888/docs`
- Health: `GET /health`

### Deploying the API

- Run with a production ASGI server (e.g. `uvicorn` behind a reverse proxy, or your platform’s Python hosting).
- **CORS:** `api/main.py` currently allows the Vite dev origins (`localhost` / `127.0.0.1` on port **5173**). **Add your production front-end origin** (scheme + host + port) to `allow_origins` before going live, or requests from the browser will fail.

## Tests

With dependencies installed (`api/requirements.txt`):

```bash
cd api
python -m pytest tests -q
```

The suite exercises the backtest engine, bar splitting, exchange helpers (mocked where applicable), and HTTP routes (`/health`, `POST /backtest`) without relying on live exchange calls for correctness.

## Data notes

- **Intervals** for exchange mode match the UI (e.g. 5m–1d, depending on venue); dates are interpreted as **UTC day bounds**.
- **Forex / metals / custom series:** use **CSV** with OHLCV columns; the API expects the same canonical bar shape as exchange-backed data.
- **OOS:** Equity chart stays full-sample; OOS KPIs use bars from the OOS start onward (see API logic in `bar_split.py` / engine).

## Vite template

The front end started from the official Vite + React + TypeScript template. See [Vite](https://vitejs.dev/) and [React](https://react.dev/) for tooling details.
