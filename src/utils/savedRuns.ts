import type { DatasetConfig, ForgeRunArtifacts, StrategyId } from '../types/backtest';
import type { BacktestParams, PortfolioSettings } from '../context/backtestReducer';

const STORAGE_KEY = 'strategy-forge-run-history';
const MAX_RUNS = 25;

export interface ForgeSnapshot {
    strategyId: StrategyId;
    params: BacktestParams;
    portfolio: PortfolioSettings;
    dataset: DatasetConfig;
    /** Omitted on rows saved before this existed; hydrate then restores config only. */
    runOutput?: ForgeRunArtifacts | null;
}

export interface SavedRunRow {
    id: string;
    savedAt: string;
    strategyId: StrategyId;
    strategyLabel: string;
    symbol: string;
    interval: string;
    dataSource: string;
    returnPct: string;
    runSource: 'api' | 'mock';
    snapshot: ForgeSnapshot;
}

function readRaw(): SavedRunRow[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed) ? (parsed as SavedRunRow[]) : [];
    } catch {
        return [];
    }
}

export function loadSavedRuns(): SavedRunRow[] {
    return readRaw();
}

export function appendSavedRun(row: Omit<SavedRunRow, 'id'>): SavedRunRow {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const next: SavedRunRow = { ...row, id };
    const prev = readRaw();
    const merged = [next, ...prev].slice(0, MAX_RUNS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return next;
}
