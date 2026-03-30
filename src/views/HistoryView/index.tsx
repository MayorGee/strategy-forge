import { useMemo } from 'react';
import { PageShell } from '../../components/PageShell';
import { useBacktest } from '../../context/BacktestContext';
import type { AppView } from '../../types/navigation';
import { loadSavedRuns } from '../../utils/savedRuns';
import styles from './history-view.module.scss';

function formatSavedAt(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function engineLabel(runSource: 'api' | 'mock'): string {
    return runSource === 'api' ? 'Python engine' : 'Demo mock';
}

function dataKind(label: string): string {
    return label === 'csv' ? 'CSV' : 'Exchange';
}

interface HistoryViewProps {
    onNavigate: (view: AppView) => void;
}

export function HistoryView({ onNavigate }: HistoryViewProps) {
    const { hydrateForge } = useBacktest();
    const runs = useMemo(() => loadSavedRuns(), []);

    return (
        <PageShell
            title="History"
            subtitle="Runs from this browser (local). Open in Forge restores strategy, parameters, portfolio, and dataset—re-upload CSV or re-fetch exchange data if needed, then run again."
        >
            <div className={styles.panel}>
                {runs.length === 0 ? (
                    <p className={styles.empty}>No saved runs yet. Run a backtest on the Forge to add one.</p>
                ) : (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.th} scope="col">
                                        When
                                    </th>
                                    <th className={styles.th} scope="col">
                                        Source
                                    </th>
                                    <th className={styles.th} scope="col">
                                        Data
                                    </th>
                                    <th className={styles.th} scope="col">
                                        Symbol
                                    </th>
                                    <th className={styles.th} scope="col">
                                        Strategy
                                    </th>
                                    <th className={styles.th} scope="col">
                                        Interval
                                    </th>
                                    <th className={styles.th} scope="col">
                                        Return
                                    </th>
                                    <th className={styles.th} scope="col">
                                        <span className={styles.muted}>Open</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {runs.map((r) => (
                                    <tr key={r.id}>
                                        <td className={`${styles.td} ${styles.mono}`}>{formatSavedAt(r.savedAt)}</td>
                                        <td className={styles.td}>{engineLabel(r.runSource)}</td>
                                        <td className={styles.td}>{dataKind(r.dataSource)}</td>
                                        <td className={styles.td}>{r.symbol}</td>
                                        <td className={styles.td}>{r.strategyLabel}</td>
                                        <td className={styles.td}>{r.interval}</td>
                                        <td className={styles.td}>{r.returnPct}</td>
                                        <td className={styles.td}>
                                            <button
                                                type="button"
                                                className={styles.linkBtn}
                                                onClick={() => {
                                                    hydrateForge(r.snapshot);
                                                    onNavigate('dashboard');
                                                }}
                                            >
                                                Open in Forge
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </PageShell>
    );
}
