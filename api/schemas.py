"""
Request / response shapes for the backtest API.

Pydantic models are like TypeScript interfaces + runtime validation: if the JSON
body is wrong (wrong type, missing field), FastAPI returns 422 with details.

We use snake_case in Python field names but tell Pydantic to accept and emit
camelCase JSON (same as your React / TypeScript objects) via alias_generator.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base: JSON keys match frontend (camelCase)."""

    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=to_camel,
        ser_json_exclude_none=True,
    )


# --- What the browser sends (mirrors BacktestState pieces) --------------------


class BacktestParams(CamelModel):
    fast_period: int = Field(ge=1)
    slow_period: int = Field(ge=1)
    rsi_period: int = Field(ge=2)
    rsi_overbought: int = Field(ge=51, le=99)
    rsi_oversold: int = Field(ge=1, le=49)


class PortfolioSettings(CamelModel):
    initial_capital: float = Field(ge=0)
    fee_round_trip_pct: float = Field(ge=0)
    slippage_bps: float = Field(ge=0)


class DatasetConfig(CamelModel):
    symbol: str
    start_date: str
    end_date: str
    interval: str
    exchange: str
    data_source: Literal["exchange", "csv"]
    csv_file_label: str | None = None


class OhlcvBar(CamelModel):
    """
    Canonical bar after normalization — same schema for Binance klines and client CSV.

    - `time`: ISO-8601 UTC (e.g. 2023-01-01T00:00:00Z) for exchange-backed bars;
      CSV uploads may use the source timestamp string until we normalize in the client.
    """

    time: str
    open: float
    high: float
    low: float
    close: float
    volume: float = 0.0


class BacktestRequest(CamelModel):
    strategy_id: Literal["buy_hold", "sma_crossover", "rsi"]
    params: BacktestParams
    portfolio: PortfolioSettings
    dataset: DatasetConfig
    # Exchange mode: omit (server fetches). CSV mode: required non-empty list from the UI.
    bars: list[OhlcvBar] | None = None


# --- What the API returns (mirrors RUN_SUCCESS payload) ---------------------


class DisplayMetric(CamelModel):
    label: str
    value: str
    tone: Literal["default", "profit", "loss", "accent"] | None = None
    emphasized: bool | None = None


class EquityChartPoint(CamelModel):
    date: str
    equity: float
    drawdown: float


class ExecutionLogRow(CamelModel):
    id: str
    asset: str
    side: Literal["long", "short"]
    entry_price: float
    exit_price: float
    pnl_usd: float
    status: Literal["profit", "loss"]


class BacktestResponse(CamelModel):
    metrics: list[DisplayMetric]
    equity: list[EquityChartPoint]
    executions: list[ExecutionLogRow]
