import { PageShell } from '../../components/PageShell';
import styles from './documentation-view.module.scss';

export function DocumentationView() {
    return (
        <PageShell
            title="Documentation"
            subtitle="In-app reference for how Strategy Forge works today."
        >
            <div className={styles.doc}>
                <section className={styles.block}>
                    <h2 className={styles.blockTitle}>What this app does</h2>
                    <p className={styles.p}>
                        Strategy Forge is a <strong>backtest shell</strong>: you choose market data (spot OHLCV from{' '}
                        <strong>Binance</strong> or <strong>Bybit</strong>, or an uploaded <strong>CSV</strong>), a
                        strategy and parameters, an optional out-of-sample split, then <strong>Run backtest</strong>.
                        Results include KPI tiles, an equity curve, and an execution log. The UI calls your{' '}
                        <strong>FastAPI</strong> service when a base URL is set; if the API is missing or errors, it
                        falls back to demo output and explains why in the run banner.
                    </p>
                </section>

                <section className={styles.block}>
                    <h2 className={styles.blockTitle}>Defaults and limits</h2>
                    <ul className={styles.list}>
                        <li>
                            <strong>New session dates:</strong> the Forge defaults to{' '}
                            <code className={styles.inlineCode}>01/01/2023</code> through{' '}
                            <code className={styles.inlineCode}>12/31/2025</code> until you change them.
                        </li>
                        <li>
                            <strong>Exchange bar cap:</strong> each server fetch is limited (currently up to{' '}
                            <strong>20,000</strong> candles). Very long ranges on small intervals may require a shorter
                            window or a larger bar size.
                        </li>
                    </ul>
                </section>

                <section className={styles.block}>
                    <h2 className={styles.blockTitle}>Backtest flow</h2>
                    <ol className={styles.ol}>
                        <li>
                            <strong>Settings:</strong> set the API base URL (e.g.{' '}
                            <code className={styles.inlineCode}>http://127.0.0.1:8888</code>
                            ) so runs hit your Python engine.
                        </li>
                        <li>
                            <strong>Data:</strong> under <strong>Asset selection</strong>, pick <strong>Binance</strong>{' '}
                            or <strong>Bybit</strong>, symbol, interval (5m–1d), and date range (
                            <code className={styles.inlineCode}>MM/DD/YYYY</code>, UTC day bounds). The server downloads{' '}
                            public <strong>spot</strong> klines—no API keys. For assets not on those venues (forex,
                            metals, custom series), use <strong>CSV upload</strong> with broker or platform OHLCV.
                        </li>
                        <li>
                            <strong>Same strategy, different venues:</strong> OHLC is exchange-specific. Expect small
                            differences in metrics between Binance and Bybit for the same symbol and range; large gaps
                            usually mean a configuration or data-range issue.
                        </li>
                        <li>
                            <strong>OHLCV preview:</strong> CSV mode shows parsed rows from your file. Exchange mode
                            shows a sample table only; real candles are fetched at run time on the server.
                        </li>
                        <li>
                            <strong>Strategies:</strong> four engines—Buy &amp; hold, SMA crossover, EMA crossover, RSI.
                            The <strong>Strategies</strong> page splits <strong>Core strategies</strong> and{' '}
                            <strong>Templates</strong> (preset parameter bundles on those engines).
                        </li>
                        <li>
                            <strong>OOS start (optional):</strong> if you set an out-of-sample date (
                            <code className={styles.inlineCode}>MM/DD/YYYY</code>, UTC), the API adds a second block of
                            KPIs prefixed with <strong>OOS ·</strong> for bars from that day onward. The equity chart
                            stays full-sample.
                        </li>
                        <li>
                            <strong>History:</strong> completed runs are saved in this browser (local storage). The{' '}
                            <strong>Data feed</strong> column shows <strong>Binance · spot</strong>,{' '}
                            <strong>Bybit · spot</strong>, or <strong>CSV ·</strong> filename. Whether the KPIs came from
                            the API or the demo mock is clear from the run banner after you open a row in Forge. Open a
                            row to restore that configuration and saved results when available.
                        </li>
                    </ol>
                </section>

                <section className={styles.block}>
                    <h2 className={styles.blockTitle}>API (FastAPI)</h2>
                    <ul className={styles.list}>
                        <li>
                            <code className={styles.inlineCode}>GET /health</code> — liveness.
                        </li>
                        <li>
                            <code className={styles.inlineCode}>POST /backtest</code> — body matches the Forge state:
                            strategy, parameters, portfolio, <code className={styles.inlineCode}>dataset</code>{' '}
                            (including <code className={styles.inlineCode}>exchange</code> and{' '}
                            <code className={styles.inlineCode}>dataSource</code>), optional{' '}
                            <code className={styles.inlineCode}>bars</code> for CSV mode. Exchange mode pulls spot klines
                            from Binance or Bybit according to <code className={styles.inlineCode}>dataset.exchange</code>
                            . Supported strategy IDs include buy &amp; hold, SMA crossover, EMA crossover, and RSI;
                            engine is <strong>long-only</strong> (spot-style).
                        </li>
                        <li>
                            CORS in development allows the Vite dev origin; for production deployment, add your live
                            front-end origin to <code className={styles.inlineCode}>CORSMiddleware</code> in{' '}
                            <code className={styles.inlineCode}>api/main.py</code>.
                        </li>
                    </ul>
                    <p className={styles.p}>
                        See the project <code className={styles.inlineCode}>README.md</code> for install, production
                        build, <code className={styles.inlineCode}>uvicorn</code>, deployment notes, and tests.
                    </p>
                </section>

                <section className={styles.block}>
                    <h2 className={styles.blockTitle}>Deployment (summary)</h2>
                    <ol className={styles.ol}>
                        <li>
                            Build the UI: <code className={styles.inlineCode}>npm run build</code> and host the{' '}
                            <code className={styles.inlineCode}>dist/</code> output.
                        </li>
                        <li>
                            Run the API on a reachable URL; users enter that URL under <strong>Settings</strong> in the
                            app (unless you inject it at build time yourself).
                        </li>
                        <li>
                            Update API <strong>CORS</strong> allowlist to include your deployed site origin (not just port{' '}
                            5173).
                        </li>
                    </ol>
                </section>

                <section className={styles.block}>
                    <h2 className={styles.blockTitle}>CSV format</h2>
                    <p className={styles.p}>Expect a header row with OHLCV columns, e.g.:</p>
                    <code className={styles.code}>timestamp,open,high,low,close,volume</code>
                    <p className={styles.p}>Preview parsing must succeed before a CSV run is sent to the API.</p>
                </section>

                <section className={styles.block}>
                    <h2 className={styles.blockTitle}>Walk-forward and other sidebar tools</h2>
                    <p className={styles.p}>
                        The <strong>Walk-forward</strong> page holds form controls only; it does not execute a rolling
                        backtest on the server yet. <strong>Monte Carlo</strong> and <strong>Genetic optimizer</strong>{' '}
                        open brief placeholder screens with no API integration.
                    </p>
                </section>
            </div>
        </PageShell>
    );
}
