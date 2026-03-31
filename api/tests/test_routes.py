from __future__ import annotations

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health_ok() -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_backtest_csv_buy_hold_json() -> None:
    """Full stack up to engine using CSV path (no Binance)."""
    body = {
        "strategyId": "buy_hold",
        "params": {
            "fastPeriod": 20,
            "slowPeriod": 50,
            "rsiPeriod": 14,
            "rsiOverbought": 70,
            "rsiOversold": 30,
        },
        "portfolio": {
            "initialCapital": 10000,
            "feeRoundTripPct": 0,
            "slippageBps": 0,
        },
        "dataset": {
            "symbol": "TEST",
            "startDate": "01/01/2024",
            "endDate": "01/10/2024",
            "interval": "1d",
            "exchange": "Binance",
            "dataSource": "csv",
            "csvFileLabel": "test.csv",
        },
        "bars": [
            {
                "time": "2024-01-01T00:00:00Z",
                "open": 100,
                "high": 100,
                "low": 100,
                "close": 100,
                "volume": 1,
            },
            {
                "time": "2024-01-02T00:00:00Z",
                "open": 100,
                "high": 100,
                "low": 100,
                "close": 100,
                "volume": 1,
            },
        ],
    }
    r = client.post("/backtest", json=body)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "metrics" in data and "equity" in data and "executions" in data
    assert len(data["executions"]) == 1


def test_backtest_csv_requires_bars() -> None:
    body = {
        "strategyId": "buy_hold",
        "params": {
            "fastPeriod": 20,
            "slowPeriod": 50,
            "rsiPeriod": 14,
            "rsiOverbought": 70,
            "rsiOversold": 30,
        },
        "portfolio": {
            "initialCapital": 10000,
            "feeRoundTripPct": 0.1,
            "slippageBps": 2,
        },
        "dataset": {
            "symbol": "X",
            "startDate": "01/01/2024",
            "endDate": "01/10/2024",
            "interval": "1d",
            "exchange": "Binance",
            "dataSource": "csv",
            "csvFileLabel": None,
        },
    }
    r = client.post("/backtest", json=body)
    assert r.status_code == 422
