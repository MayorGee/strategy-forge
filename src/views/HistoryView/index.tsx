import { PageShell } from '../../components/PageShell';
import { useBacktest } from '../../context/BacktestContext';
import type { AppView } from '../../types/navigation';
import type { ForgeSnapshot } from '../../utils/savedRuns';
import { loadSavedRuns } from '../../utils/savedRuns';
import styles from './history-view.module.scss';

function formatSavedAt(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/** Venue + mode: matches dashboard context (Binance/Bybit spot or CSV file). */
function formatDataFeed(snapshot: ForgeSnapshot): string {
    const d = snapshot.dataset;
    if (d.dataSource === 'csv') {
        return d.csvFileLabel ? `CSV · ${d.csvFileLabel}` : 'CSV upload';
    }
    const venue = d.exchange?.trim() || 'Exchange';
    return `${venue} · spot`;
}

interface HistoryViewProps {
    onNavigate: (view: AppView) => void;
}

export function HistoryView({ onNavigate }: HistoryViewProps) {
    const { hydrateForge } = useBacktest();
    const runs = loadSavedRuns();

    return (
        <PageShell
            title="History"
            subtitle="Runs from this browser (local). The data feed column shows where OHLCV came from (exchange spot or CSV). Open in Forge restores that setup and saved results when available; older rows may restore settings only—re-run to refresh charts. Re-upload CSV when the feed was a file."
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
                                        Data feed
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
                                        <td className={styles.td}>{formatDataFeed(r.snapshot)}</td>
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
