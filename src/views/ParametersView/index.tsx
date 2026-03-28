import { type ChangeEvent } from 'react';
import { PageShell } from '../../components/PageShell';
import { useBacktest } from '../../context/BacktestContext';
import type { PortfolioSettings } from '../../context/backtestReducer';
import styles from './parameters-view.module.scss';

function patchPortfolioField<K extends keyof PortfolioSettings>(
    key: K,
    raw: string,
): Partial<PortfolioSettings> | null {
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    if (key === 'initialCapital' && n < 0) return { initialCapital: 0 };
    if (key === 'feeRoundTripPct' && n < 0) return { feeRoundTripPct: 0 };
    if (key === 'slippageBps' && n < 0) return { slippageBps: 0 };
    return { [key]: n } as Partial<PortfolioSettings>;
}

export function ParametersView() {
    const {
        state: { portfolio },
        setPortfolio,
    } = useBacktest();

    const onNumber =
        (key: keyof PortfolioSettings) => (e: ChangeEvent<HTMLInputElement>) => {
            const patch = patchPortfolioField(key, e.target.value);
            if (patch) setPortfolio(patch);
        };

    return (
        <PageShell
            title="Parameters"
            subtitle="Global backtest assumptions: capital, costs, and friction. These values stay in app state, show on the Dashboard run banner, and will map directly to the FastAPI payload."
        >
            <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                <div className={styles.panel}>
                    <h2 className={styles.panelTitle}>Portfolio & costs</h2>
                    <div className={styles.grid2}>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="param-capital">
                                Initial capital ($)
                            </label>
                            <input
                                id="param-capital"
                                type="number"
                                min={0}
                                step={100}
                                className={styles.input}
                                value={portfolio.initialCapital}
                                onChange={onNumber('initialCapital')}
                                autoComplete="off"
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="param-fee">
                                Fee (round-trip %)
                            </label>
                            <input
                                id="param-fee"
                                type="number"
                                min={0}
                                step={0.01}
                                className={styles.input}
                                value={portfolio.feeRoundTripPct}
                                onChange={onNumber('feeRoundTripPct')}
                                autoComplete="off"
                            />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="param-slip">
                                Slippage (basis points)
                            </label>
                            <input
                                id="param-slip"
                                type="number"
                                min={0}
                                step={0.5}
                                className={styles.input}
                                value={portfolio.slippageBps}
                                onChange={onNumber('slippageBps')}
                                autoComplete="off"
                            />
                        </div>
                    </div>
                    <p className={styles.hint}>
                        Strategy-specific inputs (e.g. SMA periods) stay on the Dashboard strategy bar. Per-instrument
                        overrides can move here later.
                    </p>
                </div>
            </form>
        </PageShell>
    );
}
