import type { BacktestState } from '../context/backtestReducer';
import type { DisplayMetric, EquityChartPoint, ExecutionLogRow, OhlcvBar } from '../types/backtest';
import { streamPreviewToOhlcvBars } from '../utils/streamPreviewToOhlcvBars';

export interface BacktestApiPayload {
    strategyId: BacktestState['strategyId'];
    params: BacktestState['params'];
    portfolio: BacktestState['portfolio'];
    dataset: BacktestState['dataset'];
    /** Set when `dataset.dataSource === 'csv'` so the API can run one bar pipeline. */
    bars?: OhlcvBar[];
}

export function buildBacktestRequestBody(state: BacktestState): BacktestApiPayload {
    const payload: BacktestApiPayload = {
        strategyId: state.strategyId,
        params: state.params,
        portfolio: state.portfolio,
        dataset: state.dataset,
    };
    if (state.dataset.dataSource === 'csv' && state.csvPreviewRows?.length) {
        const bars = streamPreviewToOhlcvBars(state.csvPreviewRows);
        if (bars.length > 0) {
            payload.bars = bars;
        }
    }
    return payload;
}

function isBacktestApiResult(data: unknown): data is {
    metrics: DisplayMetric[];
    equity: EquityChartPoint[];
    executions: ExecutionLogRow[];
} {
    if (!data || typeof data !== 'object') return false;
    const o = data as Record<string, unknown>;
    return Array.isArray(o.metrics) && Array.isArray(o.equity) && Array.isArray(o.executions);
}

/**
 * POST /backtest. Returns null if HTTP or JSON shape is not usable (caller falls back to mock).
 */
export async function fetchBacktestFromApi(
    baseUrl: string,
    state: BacktestState,
): Promise<{ metrics: DisplayMetric[]; equity: EquityChartPoint[]; executions: ExecutionLogRow[] } | null> {
    const url = `${baseUrl.replace(/\/+$/, '')}/backtest`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBacktestRequestBody(state)),
    });

    if (!res.ok) {
        return null;
    }

    const data: unknown = await res.json();

    if (!isBacktestApiResult(data)) {
        return null;
    }
    
    return data;
}
