import { useBacktest } from '../../context/BacktestContext';
import type { BacktestState } from '../../context/backtestReducer';
import { intervalLabel } from '../../data/marketOptions';
import { strategyLabel } from '../../data/strategies';
import styles from './run-context-banner.module.scss';

const usd0 = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
});

function formatRunWhen(status: BacktestState['runStatus'], source: BacktestState['runSource']) {
    if (status !== 'done' || !source) return null;
    if (source === 'api') return 'Last run: Python engine (FastAPI).';
    return 'Last run: built-in demo data (see note below).';
}

export function RunContextBanner() {
    const { state } = useBacktest();
    const { strategyId, dataset, portfolio, runStatus, runSource, runNotice, restoredFromHistory } = state;
    const strat = strategyLabel(strategyId);

    const primary =
        dataset.dataSource === 'csv' ? (
            <>
                <span>{strat}</span>
                <span className={styles.sep}>·</span>
                <span>CSV upload</span>
                {dataset.csvFileLabel && (
                    <>
                        <span className={styles.sep}>·</span>
                        <span>{dataset.csvFileLabel}</span>
                    </>
                )}
            </>
        ) : (
            <>
                <span>{strat}</span>
                <span className={styles.sep}>·</span>
                <span>{dataset.symbol}</span>
                <span className={styles.sep}>·</span>
                <span>{intervalLabel(dataset.interval)}</span>
                <span className={styles.sep}>·</span>
                <span>{dataset.exchange}</span>
                <span className={styles.sep}>·</span>
                <span>
                    {dataset.startDate} – {dataset.endDate}
                </span>
            </>
        );

    const runLine = formatRunWhen(runStatus, runSource);

    return (
        <div className={styles.banner} role="status" aria-label="Active backtest context">
            <p className={styles.line}>{primary}</p>
            <span className={styles.meta}>
                {usd0.format(portfolio.initialCapital)} initial · {portfolio.feeRoundTripPct}% RT fee ·{' '}
                {portfolio.slippageBps} bps slip.
            </span>
            {restoredFromHistory ? (
                <span className={styles.historyLabel}>Restored from history</span>
            ) : null}
            {runLine ? <span className={styles.runSource}>{runLine}</span> : null}
            {runNotice ? (
                <p className={styles.notice} role="note">
                    {runNotice}
                </p>
            ) : null}
        </div>
    );
}
