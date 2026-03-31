import type { BacktestParams } from '../context/backtestReducer';
import type { StrategyId } from '../types/backtest';

export interface BuiltInStrategyCard {
    kind: 'builtin';
    strategyId: StrategyId;
}

export interface TemplateStrategyCard {
    kind: 'template';
    id: string;
    name: string;
    description: string;
    strategyId: StrategyId;
    /** Applied in Forge together with `strategyId` (merged onto current params). */
    presetParams: Partial<BacktestParams>;
    tags: string[];
}

const BUILTIN_META: Record<StrategyId, { blurb: string; tags: string[] }> = {
    sma_crossover: { blurb: 'Classic trend following via moving-average cross.', tags: ['Trend', 'Classic'] },
    ema_crossover: { blurb: 'Trend following with responsive exponential MAs (more weight on recent prices).', tags: ['Trend', 'Responsive'] },
    rsi: { blurb: 'Mean-reversion signals from relative strength extremes.', tags: ['Mean reversion', 'Oscillator'] },
    buy_hold: { blurb: 'Baseline long-only exposure over the full window.', tags: ['Baseline'] },
};

export function builtInCards(): (BuiltInStrategyCard & { name: string; description: string; tags: string[] })[] {
    const order: StrategyId[] = ['sma_crossover', 'ema_crossover', 'rsi', 'buy_hold'];
    const labels: Record<StrategyId, string> = {
        sma_crossover: 'SMA Crossover',
        ema_crossover: 'EMA Crossover',
        rsi: 'RSI',
        buy_hold: 'Buy & Hold',
    };
    return order.map((strategyId) => ({
        kind: 'builtin' as const,
        strategyId,
        name: labels[strategyId],
        description: BUILTIN_META[strategyId].blurb,
        tags: BUILTIN_META[strategyId].tags,
    }));
}

export const STRATEGY_TEMPLATES: TemplateStrategyCard[] = [
    {
        kind: 'template',
        id: 'mean-rev-alpha',
        name: 'Mean reversion alpha',
        description:
            'Tighter RSI bands for shorter-term fades: period 14, oversold 28, overbought 72. Same RSI engine—different defaults.',
        strategyId: 'rsi',
        presetParams: { rsiPeriod: 14, rsiOversold: 28, rsiOverbought: 72 },
        tags: ['Template', 'RSI'],
    },
    {
        kind: 'template',
        id: 'trend-draft',
        name: 'Trend draft (fast SMA)',
        description: 'Faster SMA pair (12 / 26) tuned for liquid spot-style trends.',
        strategyId: 'sma_crossover',
        presetParams: { fastPeriod: 12, slowPeriod: 26 },
        tags: ['Template', 'Trend'],
    },
    {
        kind: 'template',
        id: 'swing-sma',
        name: 'Swing SMA (8 / 21)',
        description: 'Common swing structure: 8 vs 21 simple moving averages.',
        strategyId: 'sma_crossover',
        presetParams: { fastPeriod: 8, slowPeriod: 21 },
        tags: ['Template', 'Swing'],
    },
    {
        kind: 'template',
        id: 'position-sma',
        name: 'Position trend SMA (20 / 50)',
        description: 'Slower SMA pair for multi-week positioning on daily+ timeframes.',
        strategyId: 'sma_crossover',
        presetParams: { fastPeriod: 20, slowPeriod: 50 },
        tags: ['Template', 'Trend'],
    },
    {
        kind: 'template',
        id: 'golden-cross',
        name: 'Golden cross SMA (50 / 200)',
        description: 'Classic very slow pair—needs long histories (often daily years of data).',
        strategyId: 'sma_crossover',
        presetParams: { fastPeriod: 50, slowPeriod: 200 },
        tags: ['Template', 'Trend'],
    },
    {
        kind: 'template',
        id: 'ema-macd-style',
        name: 'EMA trend (12 / 26)',
        description: 'Standard fast/slow EMA pair (MACD-style lengths) on the EMA crossover engine.',
        strategyId: 'ema_crossover',
        presetParams: { fastPeriod: 12, slowPeriod: 26 },
        tags: ['Template', 'EMA'],
    },
    {
        kind: 'template',
        id: 'ema-swing',
        name: 'EMA swing (8 / 21)',
        description: 'Responsive EMAs for shorter swings.',
        strategyId: 'ema_crossover',
        presetParams: { fastPeriod: 8, slowPeriod: 21 },
        tags: ['Template', 'EMA'],
    },
    {
        kind: 'template',
        id: 'rsi-conservative',
        name: 'RSI classic bands',
        description: 'Traditional textbook thresholds: oversold 30, overbought 70, period 14.',
        strategyId: 'rsi',
        presetParams: { rsiPeriod: 14, rsiOversold: 30, rsiOverbought: 70 },
        tags: ['Template', 'RSI'],
    },
    {
        kind: 'template',
        id: 'rsi-wide',
        name: 'RSI wide bands',
        description: 'Fewer trades: exit strength / enter weakness only at 25 / 75.',
        strategyId: 'rsi',
        presetParams: { rsiPeriod: 14, rsiOversold: 25, rsiOverbought: 75 },
        tags: ['Template', 'RSI'],
    },
    {
        kind: 'template',
        id: 'spot-benchmark',
        name: 'Spot benchmark',
        description: 'Full-sample buy & hold for comparing signal engines against raw long exposure.',
        strategyId: 'buy_hold',
        presetParams: {},
        tags: ['Template', 'Baseline'],
    },
];

/** Union of a built-in card row and a template card (e.g. Strategies page rendering). */
export type StrategyLibraryRow =
    | (ReturnType<typeof builtInCards>[number] & { kind: 'builtin' })
    | TemplateStrategyCard;

function formatPresetSummary(card: TemplateStrategyCard): string {
    const p = card.presetParams;
    if (card.strategyId === 'sma_crossover' || card.strategyId === 'ema_crossover') {
        return `Forge preset: fast ${p.fastPeriod ?? '—'}, slow ${p.slowPeriod ?? '—'}`;
    }
    if (card.strategyId === 'rsi') {
        return `Forge preset: period ${p.rsiPeriod ?? '—'}, OB ${p.rsiOverbought ?? '—'}, OS ${p.rsiOversold ?? '—'}`;
    }
    if (card.strategyId === 'buy_hold') {
        return 'Forge preset: full-window long (no tunable params)';
    }
    return '';
}

export function templatePresetSummary(card: TemplateStrategyCard): string {
    return formatPresetSummary(card);
}
