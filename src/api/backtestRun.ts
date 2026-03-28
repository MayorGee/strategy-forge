import type { BacktestState } from '../context/backtestReducer';
import type { DisplayMetric, EquityChartPoint, ExecutionLogRow } from '../types/backtest';

export interface BacktestApiPayload {
    strategyId: BacktestState['strategyId'];
    params: BacktestState['params'];
    portfolio: BacktestState['portfolio'];
    dataset: BacktestState['dataset'];
}

export function buildBacktestRequestBody(state: BacktestState): BacktestApiPayload {
    return {
        strategyId: state.strategyId,
        params: state.params,
        portfolio: state.portfolio,
        dataset: state.dataset,
    };
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
