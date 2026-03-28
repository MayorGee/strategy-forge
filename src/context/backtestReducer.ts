import type {
    DatasetConfig,
    DisplayMetric,
    EquityChartPoint,
    ExecutionLogRow,
    StrategyId,
    StreamPreviewRow,
} from '../types/backtest';

export interface BacktestParams {
    fastPeriod: number;
    slowPeriod: number;
    rsiPeriod: number;
    rsiOverbought: number;
    rsiOversold: number;
}

/** Global assumptions (Parameters page + future API payload). */
export interface PortfolioSettings {
    initialCapital: number;
    /** Round-trip fee as a percent, e.g. 0.1 => 0.1%. */
    feeRoundTripPct: number;
    slippageBps: number;
}

export interface BacktestState {
    strategyId: StrategyId;
    params: BacktestParams;
    portfolio: PortfolioSettings;
    dataset: DatasetConfig;
    /** Parsed CSV preview rows; cleared when switching to exchange bars. */
    csvPreviewRows: StreamPreviewRow[] | null;
    runStatus: 'idle' | 'running' | 'done';
    /** Populated after a successful run (mock or API). */
    displayMetrics: DisplayMetric[] | null;
    equitySeries: EquityChartPoint[] | null;
    executionLog: ExecutionLogRow[] | null;
}

export type BacktestAction =
    | { type: 'SET_STRATEGY'; strategyId: StrategyId }
    | { type: 'SET_PARAM'; key: keyof BacktestParams; value: number }
    | { type: 'SET_PORTFOLIO'; partial: Partial<PortfolioSettings> }
    | { type: 'SET_DATASET'; partial: Partial<DatasetConfig> }
    | { type: 'SET_CSV_PREVIEW'; rows: StreamPreviewRow[] | null }
    | { type: 'RUN_START' }
    | {
          type: 'RUN_SUCCESS';
          metrics: DisplayMetric[];
          equity: EquityChartPoint[];
          executions: ExecutionLogRow[];
      }
    | { type: 'RUN_FAIL' };

export const defaultBacktestParams: BacktestParams = {
    fastPeriod: 20,
    slowPeriod: 50,
    rsiPeriod: 14,
    rsiOverbought: 70,
    rsiOversold: 30,
};

export const defaultPortfolioSettings: PortfolioSettings = {
    initialCapital: 10_000,
    feeRoundTripPct: 0.1,
    slippageBps: 2,
};

export const initialDataset: DatasetConfig = {
    symbol: 'BTC/USDT',
    startDate: '01/01/2023',
    endDate: '12/31/2023',
    interval: '1h',
    exchange: 'Binance',
    dataSource: 'exchange',
    csvFileLabel: null,
};

export const initialBacktestState: BacktestState = {
    strategyId: 'sma_crossover',
    params: { ...defaultBacktestParams },
    portfolio: { ...defaultPortfolioSettings },
    dataset: { ...initialDataset },
    csvPreviewRows: null,
    runStatus: 'idle',
    displayMetrics: null,
    equitySeries: null,
    executionLog: null,
};

export function backtestReducer(state: BacktestState, action: BacktestAction): BacktestState {
    switch (action.type) {
        case 'SET_STRATEGY':
            return { ...state, strategyId: action.strategyId };
        case 'SET_PARAM':
            return {
                ...state,
                params: { ...state.params, [action.key]: action.value },
            };
        case 'SET_PORTFOLIO':
            return {
                ...state,
                portfolio: { ...state.portfolio, ...action.partial },
            };
        case 'SET_DATASET': {
            const nextDataset = { ...state.dataset, ...action.partial };
            const leaveCsv = action.partial.dataSource !== 'exchange';
            return {
                ...state,
                dataset: nextDataset,
                csvPreviewRows: leaveCsv ? state.csvPreviewRows : null,
            };
        }
        case 'SET_CSV_PREVIEW':
            return { ...state, csvPreviewRows: action.rows };
        case 'RUN_START':
            return { ...state, runStatus: 'running' };
        case 'RUN_SUCCESS':
            return {
                ...state,
                runStatus: 'done',
                displayMetrics: action.metrics,
                equitySeries: action.equity,
                executionLog: action.executions,
            };
        case 'RUN_FAIL':
            return { ...state, runStatus: 'idle' };
        default:
            return state;
    }
}
