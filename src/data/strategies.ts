import type { StrategyId } from '../types/backtest';

export interface StrategyOption {
    id: StrategyId;
    label: string;
    shortDescription: string;
}

export const STRATEGY_OPTIONS: StrategyOption[] = [
    { id: 'sma_crossover', label: 'SMA Crossover', shortDescription: 'Fast / slow simple moving average cross' },
    {
        id: 'ema_crossover',
        label: 'EMA Crossover',
        shortDescription: 'Fast / slow exponential moving average cross',
    },
    { id: 'rsi', label: 'RSI', shortDescription: 'Relative strength oversold / overbought' },
    { id: 'buy_hold', label: 'Buy & Hold', shortDescription: 'Enter at start, exit at end' },
];

export function strategyLabel(id: StrategyId): string {
    return STRATEGY_OPTIONS.find((s) => s.id === id)?.label ?? id;
}
