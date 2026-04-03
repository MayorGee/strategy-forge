import type {
    DatasetConfig,
    DisplayMetric,
    EquityChartPoint,
    ExecutionLogRow,
    ForgeRunArtifacts,
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
    /** How the last completed run produced results. */
    runSource: 'api' | 'mock' | null;
    /** Extra note: mock reason, API error summary, or intentional mock when no base URL. */
    runNotice: string | null;
    /** Populated after a successful run (mock or API). */
    displayMetrics: DisplayMetric[] | null;
    equitySeries: EquityChartPoint[] | null;
    executionLog: ExecutionLogRow[] | null;
    /** True after Open in Forge from History; cleared when a new run starts or completes. */
    restoredFromHistory: boolean;
}

export type BacktestAction =
    | { type: 'SET_STRATEGY'; strategyId: StrategyId }
    | {
          type: 'APPLY_STRATEGY_PRESET';
          strategyId: StrategyId;
          params: Partial<BacktestParams>;
      }
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
          runSource: 'api' | 'mock';
          runNotice: string | null;
      }
    | {
          type: 'HYDRATE_FORGE';
          snapshot: {
              strategyId: StrategyId;
              params: BacktestParams;
              portfolio: PortfolioSettings;
              dataset: DatasetConfig;
              runOutput?: ForgeRunArtifacts | null;
          };
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
    endDate: '12/31/2025',
    interval: '1h',
    exchange: 'Binance',
    dataSource: 'exchange',
    csvFileLabel: null,
    oosStartDate: null,
};

export const initialBacktestState: BacktestState = {
    strategyId: 'sma_crossover',
    params: { ...defaultBacktestParams },
    portfolio: { ...defaultPortfolioSettings },
    dataset: { ...initialDataset },
    csvPreviewRows: null,
    runStatus: 'idle',
    runSource: null,
    runNotice: null,
    displayMetrics: null,
    equitySeries: null,
    executionLog: null,
    restoredFromHistory: false,
};

export function backtestReducer(state: BacktestState, action: BacktestAction): BacktestState {
    switch (action.type) {
        case 'SET_STRATEGY':
            return { ...state, strategyId: action.strategyId };
        case 'APPLY_STRATEGY_PRESET':
            return {
                ...state,
                strategyId: action.strategyId,
                params: { ...state.params, ...action.params },
            };
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
            return { ...state, runStatus: 'running', runNotice: null, restoredFromHistory: false };
        case 'RUN_SUCCESS':
            return {
                ...state,
                runStatus: 'done',
                runSource: action.runSource,
                runNotice: action.runNotice,
                displayMetrics: action.metrics,
                equitySeries: action.equity,
                executionLog: action.executions,
                restoredFromHistory: false,
            };
        case 'HYDRATE_FORGE': {
            const { snapshot } = action;
            const out = snapshot.runOutput;
            const datasetMerged: DatasetConfig = { ...initialDataset, ...snapshot.dataset };
            const base = {
                ...state,
                strategyId: snapshot.strategyId,
                params: { ...snapshot.params },
                portfolio: { ...snapshot.portfolio },
                dataset: datasetMerged,
                csvPreviewRows: null,
            };
            if (!out) {
                return {
                    ...base,
                    runStatus: 'idle',
                    runSource: null,
                    runNotice: null,
                    displayMetrics: null,
                    equitySeries: null,
                    executionLog: null,
                    restoredFromHistory: true,
                };
            }
            return {
                ...base,
                runStatus: 'done',
                runSource: out.runSource,
                runNotice: out.runNotice,
                displayMetrics: out.metrics.map((m) => ({ ...m })),
                equitySeries: out.equity.map((p) => ({ ...p })),
                executionLog: out.executions.map((e) => ({ ...e })),
                restoredFromHistory: true,
            };
        }
        case 'RUN_FAIL':
            return { ...state, runStatus: 'idle', restoredFromHistory: false };
        default:
            return state;
    }
}
