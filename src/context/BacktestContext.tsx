import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useReducer,
    type ReactNode,
} from 'react';
import { readStoredApiBase } from '../api/apiBase';
import { fetchBacktestFromApi } from '../api/backtestRun';
import { MOCK_EQUITY_DATA, MOCK_EXECUTION_LOG, MOCK_METRICS } from '../data/dashboardMock';
import { strategyLabel } from '../data/strategies';
import type { DatasetConfig, StrategyId, StreamPreviewRow } from '../types/backtest';
import { appendSavedRun, type ForgeSnapshot } from '../utils/savedRuns';
import {
    backtestReducer,
    initialBacktestState,
    type BacktestAction,
    type BacktestParams,
    type BacktestState,
    type PortfolioSettings,
} from './backtestReducer';

interface BacktestContextValue {
    state: BacktestState;
    dispatch: React.Dispatch<BacktestAction>;
    setStrategyId: (id: StrategyId) => void;
    setParam: (key: keyof BacktestParams, value: number) => void;
    setPortfolio: (partial: Partial<PortfolioSettings>) => void;
    setDataset: (partial: Partial<DatasetConfig>) => void;
    setCsvPreview: (rows: StreamPreviewRow[] | null) => void;
    hydrateForge: (snapshot: ForgeSnapshot) => void;
    runBacktest: () => Promise<void>;
}

const BacktestContext = createContext<BacktestContextValue | null>(null);

function buildSnapshot(state: BacktestState): ForgeSnapshot {
    return {
        strategyId: state.strategyId,
        params: { ...state.params },
        portfolio: { ...state.portfolio },
        dataset: { ...state.dataset },
    };
}

function recordRun(
    state: BacktestState,
    runSource: 'api' | 'mock',
    metrics: typeof MOCK_METRICS,
) {
    const returnPct = metrics[0]?.value ?? '—';
    appendSavedRun({
        savedAt: new Date().toISOString(),
        strategyId: state.strategyId,
        strategyLabel: strategyLabel(state.strategyId),
        symbol: state.dataset.dataSource === 'csv' ? (state.dataset.csvFileLabel ?? 'CSV') : state.dataset.symbol,
        interval: state.dataset.dataSource === 'exchange' ? state.dataset.interval : '—',
        dataSource: state.dataset.dataSource,
        returnPct,
        runSource,
        snapshot: buildSnapshot(state),
    });
}

export function BacktestProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(backtestReducer, initialBacktestState);

    const setStrategyId = useCallback((strategyId: StrategyId) => {
        dispatch({ type: 'SET_STRATEGY', strategyId });
    }, []);

    const setParam = useCallback((key: keyof BacktestParams, value: number) => {
        dispatch({ type: 'SET_PARAM', key, value });
    }, []);

    const setPortfolio = useCallback((partial: Partial<PortfolioSettings>) => {
        dispatch({ type: 'SET_PORTFOLIO', partial });
    }, []);

    const setDataset = useCallback((partial: Partial<DatasetConfig>) => {
        dispatch({ type: 'SET_DATASET', partial });
    }, []);

    const setCsvPreview = useCallback((rows: StreamPreviewRow[] | null) => {
        dispatch({ type: 'SET_CSV_PREVIEW', rows });
    }, []);

    const hydrateForge = useCallback((snapshot: ForgeSnapshot) => {
        dispatch({ type: 'HYDRATE_FORGE', snapshot });
    }, []);

    const runBacktest = useCallback(async () => {
        dispatch({ type: 'RUN_START' });
        const apiBase = readStoredApiBase();

        if (apiBase) {
            const outcome = await fetchBacktestFromApi(apiBase, state);
            if (outcome.ok) {
                dispatch({
                    type: 'RUN_SUCCESS',
                    metrics: outcome.data.metrics,
                    equity: outcome.data.equity,
                    executions: outcome.data.executions,
                    runSource: 'api',
                    runNotice: null,
                });
                recordRun(state, 'api', outcome.data.metrics);
                return;
            }
            const errLine =
                outcome.status === 0
                    ? outcome.message
                    : `${outcome.status}: ${outcome.message}`;
            console.warn('[Strategy Forge] API backtest failed, using mock', errLine);
            await new Promise((r) => setTimeout(r, 480));
            dispatch({
                type: 'RUN_SUCCESS',
                metrics: MOCK_METRICS,
                equity: MOCK_EQUITY_DATA,
                executions: MOCK_EXECUTION_LOG,
                runSource: 'mock',
                runNotice: `Could not use API (${errLine}). Showing built-in demo results instead.`,
            });
            recordRun(state, 'mock', MOCK_METRICS);
            return;
        }

        await new Promise((r) => setTimeout(r, 480));
        dispatch({
            type: 'RUN_SUCCESS',
            metrics: MOCK_METRICS,
            equity: MOCK_EQUITY_DATA,
            executions: MOCK_EXECUTION_LOG,
            runSource: 'mock',
            runNotice:
                'No API base URL in Settings — showing built-in demo results. Add your FastAPI URL to run the Python engine.',
        });
        recordRun(state, 'mock', MOCK_METRICS);
    }, [state]);

    const value = useMemo(
        () => ({
            state,
            dispatch,
            setStrategyId,
            setParam,
            setPortfolio,
            setDataset,
            setCsvPreview,
            hydrateForge,
            runBacktest,
        }),
        [
            state,
            setStrategyId,
            setParam,
            setPortfolio,
            setDataset,
            setCsvPreview,
            hydrateForge,
            runBacktest,
        ],
    );

    return <BacktestContext.Provider value={value}>{children}</BacktestContext.Provider>;
}

export function useBacktest(): BacktestContextValue {
    const ctx = useContext(BacktestContext);
    if (!ctx) {
        throw new Error('useBacktest must be used within BacktestProvider');
    }
    return ctx;
}
