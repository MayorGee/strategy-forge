/** Table preview row (formatted strings for display). */
export interface StreamPreviewRow {
    timestamp: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
}

/** OHLCV row (CSV or API normalized). */
export interface OhlcvBar {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

export type StrategyId = 'buy_hold' | 'sma_crossover' | 'rsi';

/** Exchange API vs uploaded OHLCV. */
export type DataSourceMode = 'exchange' | 'csv';

/** Dataset selection shown in the run context line and sent to the API later. */
export interface DatasetConfig {
    symbol: string;
    startDate: string;
    endDate: string;
    interval: string;
    exchange: string;
    dataSource: DataSourceMode;
    /** File name when `dataSource === 'csv'`. */
    csvFileLabel: string | null;
}

export interface StrategyParams {
    strategy: StrategyId;
    /** Strategy-specific keys filled in per strategy UI */
    [key: string]: string | number | boolean | undefined;
}

export interface Trade {
    id: string;
    side: 'buy' | 'sell';
    time: string;
    price: number;
    size: number;
    pnl?: number;
}

export interface EquityPoint {
    time: string;
    equity: number;
    drawdownPct?: number;
}

export interface PerformanceMetrics {
    totalReturnPct: number | null;
    sharpeRatio: number | null;
    maxDrawdownPct: number | null;
    winRatePct: number | null;
    profitFactor: number | null;
    totalTrades: number;
}

export interface BacktestResult {
    metrics: PerformanceMetrics;
    equityCurve: EquityPoint[];
    trades: Trade[];
}

/** KPI tiles in the dashboard (formatted strings). */
export type MetricTone = 'default' | 'profit' | 'loss' | 'accent';

export interface DisplayMetric {
    label: string;
    value: string;
    tone?: MetricTone;
    emphasized?: boolean;
}

export interface StrategyUiState {
    strategy: string;
    fastPeriod: number;
    slowPeriod: number;
}

/** Equity chart point (month labels + drawdown % for tooltip). */
export interface EquityChartPoint {
    date: string;
    equity: number;
    drawdown: number;
}

/** Recent execution log row (tablet / results table). */
export type ExecutionSide = 'long' | 'short';
export type ExecutionOutcome = 'profit' | 'loss';

export interface ExecutionLogRow {
    id: string;
    asset: string;
    side: ExecutionSide;
    entryPrice: number;
    exitPrice: number;
    pnlUsd: number;
    status: ExecutionOutcome;
}

/** Stored with a history row so Open in Forge can replay the same dashboard results. */
export interface ForgeRunArtifacts {
    runSource: 'api' | 'mock';
    runNotice: string | null;
    metrics: DisplayMetric[];
    equity: EquityChartPoint[];
    executions: ExecutionLogRow[];
}
