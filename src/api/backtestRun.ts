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

async function parseHttpErrorMessage(res: Response): Promise<string> {
    try {
        const j: unknown = await res.json();
        if (!j || typeof j !== 'object') {
            return res.statusText || `HTTP ${res.status}`;
        }
        const detail = (j as { detail?: unknown }).detail;
        if (typeof detail === 'string') return detail;
        if (Array.isArray(detail)) {
            const parts = detail
                .map((x) =>
                    x && typeof x === 'object' && 'msg' in x && typeof (x as { msg: unknown }).msg === 'string'
                        ? (x as { msg: string }).msg
                        : null,
                )
                .filter(Boolean);
            if (parts.length) return parts.join('; ');
        }
        return res.statusText || `HTTP ${res.status}`;
    } catch {
        return res.statusText || `HTTP ${res.status}`;
    }
}

export type FetchBacktestResult =
    | {
          ok: true;
          data: {
              metrics: DisplayMetric[];
              equity: EquityChartPoint[];
              executions: ExecutionLogRow[];
          };
      }
    | { ok: false; status: number; message: string };

/**
 * POST /backtest. Returns structured success or HTTP error message for UI.
 */
export async function fetchBacktestFromApi(baseUrl: string, state: BacktestState): Promise<FetchBacktestResult> {
    const url = `${baseUrl.replace(/\/+$/, '')}/backtest`;

    let res: Response;
    try {
        res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildBacktestRequestBody(state)),
        });
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'Network error';
        return { ok: false, status: 0, message: msg };
    }

    if (!res.ok) {
        const message = await parseHttpErrorMessage(res);
        return { ok: false, status: res.status, message };
    }

    const data: unknown = await res.json();

    if (!isBacktestApiResult(data)) {
        return { ok: false, status: res.status, message: 'Invalid response shape from API' };
    }

    return { ok: true, data };
}
