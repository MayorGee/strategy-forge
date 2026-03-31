import { ChevronDown } from 'lucide-react';
import { STRATEGY_OPTIONS } from '../../data/strategies';
import { useBacktest } from '../../context/BacktestContext';
import type { StrategyId } from '../../types/backtest';
import styles from './strategy-logic.module.scss';

function parsePositiveInt(raw: string, fallback: number): number {
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1) return fallback;
    return n;
}

export function StrategyLogic() {
    const { state, setStrategyId, setParam } = useBacktest();
    const { strategyId, params } = state;

    const meta = STRATEGY_OPTIONS.find((s) => s.id === strategyId);

    if (strategyId === 'sma_crossover' || strategyId === 'ema_crossover') {
        return (
            <div className={styles.panel}>
                <div className={styles.smaGrid}>
                    <div className={styles.smaStratGroup}>
                        <label className={`${styles.label} ${styles.smaCellStratLabel}`} htmlFor="strategy-logic-select">
                            Strategy logic
                        </label>
                        <div className={`${styles.selectWrap} ${styles.smaCellStratSelect}`}>
                            <select
                                id="strategy-logic-select"
                                className={styles.select}
                                value={strategyId}
                                onChange={(e) => setStrategyId(e.target.value as StrategyId)}
                            >
                                {STRATEGY_OPTIONS.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className={styles.chevron} aria-hidden strokeWidth={2} />
                        </div>
                        {meta && (
                            <p className={`${styles.strategyMeta} ${styles.smaCellStratMeta}`}>{meta.shortDescription}</p>
                        )}
                    </div>

                    <div className={styles.smaFastGroup}>
                        <label className={`${styles.label} ${styles.smaCellFastLabel}`} htmlFor="param-fast">
                            Fast period
                        </label>
                        <input
                            id="param-fast"
                            type="number"
                            min={1}
                            className={`${styles.input} ${styles.smaCellFastInput}`}
                            value={params.fastPeriod}
                            onChange={(e) =>
                                setParam('fastPeriod', parsePositiveInt(e.target.value, params.fastPeriod))
                            }
                        />
                    </div>

                    <div className={styles.smaSlowGroup}>
                        <label className={`${styles.label} ${styles.smaCellSlowLabel}`} htmlFor="param-slow">
                            Slow period
                        </label>
                        <input
                            id="param-slow"
                            type="number"
                            min={1}
                            className={`${styles.input} ${styles.smaCellSlowInput}`}
                            value={params.slowPeriod}
                            onChange={(e) =>
                                setParam('slowPeriod', parsePositiveInt(e.target.value, params.slowPeriod))
                            }
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.panel}>
            <div
                className={`${styles.row} ${strategyId === 'rsi' ? styles.rowRsi : ''} ${
                    strategyId === 'buy_hold' ? styles.rowBuyHold : ''
                }`}
            >
                <div className={styles.strategyCol}>
                    <label className={styles.label} htmlFor="strategy-logic-select">
                        Strategy logic
                    </label>
                    <div className={styles.selectWrap}>
                        <select
                            id="strategy-logic-select"
                            className={styles.select}
                            value={strategyId}
                            onChange={(e) => setStrategyId(e.target.value as StrategyId)}
                        >
                            {STRATEGY_OPTIONS.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className={styles.chevron} aria-hidden strokeWidth={2} />
                    </div>
                    {meta && <p className={styles.strategyMeta}>{meta.shortDescription}</p>}
                </div>

                {strategyId === 'rsi' && (
                    <>
                        <div className={styles.paramCol}>
                            <label className={styles.label} htmlFor="param-rsi-period">
                                RSI period
                            </label>
                            <input
                                id="param-rsi-period"
                                type="number"
                                min={2}
                                className={styles.input}
                                value={params.rsiPeriod}
                                onChange={(e) =>
                                    setParam('rsiPeriod', parsePositiveInt(e.target.value, params.rsiPeriod))
                                }
                            />
                        </div>
                        <div className={styles.paramCol}>
                            <label className={styles.label} htmlFor="param-rsi-ob">
                                Overbought
                            </label>
                            <input
                                id="param-rsi-ob"
                                type="number"
                                min={51}
                                max={99}
                                className={styles.input}
                                value={params.rsiOverbought}
                                onChange={(e) => {
                                    const v = parsePositiveInt(e.target.value, params.rsiOverbought);
                                    setParam('rsiOverbought', Math.min(99, Math.max(51, v)));
                                }}
                            />
                        </div>
                        <div className={styles.paramCol}>
                            <label className={styles.label} htmlFor="param-rsi-os">
                                Oversold
                            </label>
                            <input
                                id="param-rsi-os"
                                type="number"
                                min={1}
                                max={49}
                                className={styles.input}
                                value={params.rsiOversold}
                                onChange={(e) => {
                                    const v = parsePositiveInt(e.target.value, params.rsiOversold);
                                    setParam('rsiOversold', Math.min(49, Math.max(1, v)));
                                }}
                            />
                        </div>
                    </>
                )}

                {strategyId === 'buy_hold' && (
                    <p className={styles.hintInline}>
                        No tunable parameters — baseline buy at the first bar and hold through the window.
                    </p>
                )}
            </div>
        </div>
    );
}
