"""
Stub backtest output — same numbers as src/data/dashboardMock.ts.

Later this module is replaced (or calls a real engine) while schemas stay stable.
"""

from schemas import DisplayMetric, EquityChartPoint, ExecutionLogRow

MOCK_METRICS: list[DisplayMetric] = [
    DisplayMetric(label="Total Return", value="+124.5%", tone="profit", emphasized=True),
    DisplayMetric(label="Sharpe Ratio", value="2.41", tone="profit", emphasized=True),
    DisplayMetric(label="Max Drawdown", value="-12.3%", tone="loss"),
    DisplayMetric(label="Win Rate", value="68.2%"),
    DisplayMetric(label="Profit Factor", value="1.88", tone="accent", emphasized=True),
    DisplayMetric(label="Total Trades", value="1,248"),
]

MOCK_EQUITY: list[EquityChartPoint] = [
    EquityChartPoint(date="Jan", equity=10000, drawdown=0),
    EquityChartPoint(date="Feb", equity=10500, drawdown=-1.2),
    EquityChartPoint(date="Mar", equity=10800, drawdown=-0.8),
    EquityChartPoint(date="Apr", equity=11200, drawdown=-1.5),
    EquityChartPoint(date="May", equity=11800, drawdown=-2.1),
    EquityChartPoint(date="Jun", equity=12400, drawdown=-1.8),
    EquityChartPoint(date="Jul", equity=12200, drawdown=-2.5),
    EquityChartPoint(date="Aug", equity=13000, drawdown=-1.2),
    EquityChartPoint(date="Sep", equity=13500, drawdown=-0.9),
    EquityChartPoint(date="Oct", equity=14100, drawdown=-1.1),
    EquityChartPoint(date="Nov", equity=14240, drawdown=-2.1),
    EquityChartPoint(date="Dec", equity=15000, drawdown=-0.5),
]

MOCK_EXECUTIONS: list[ExecutionLogRow] = [
    ExecutionLogRow(
        id="1",
        asset="BTC/USDT",
        side="long",
        entry_price=42124.5,
        exit_price=42880.0,
        pnl_usd=1562.2,
        status="profit",
    ),
    ExecutionLogRow(
        id="2",
        asset="BTC/USDT",
        side="short",
        entry_price=43210.0,
        exit_price=43555.0,
        pnl_usd=-335.0,
        status="loss",
    ),
    ExecutionLogRow(
        id="3",
        asset="BTC/USDT",
        side="long",
        entry_price=41800.25,
        exit_price=42450.75,
        pnl_usd=2425.1,
        status="profit",
    ),
]
