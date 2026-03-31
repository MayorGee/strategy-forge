import { useEffect, useId, useState } from 'react';
import { Calendar, ChevronDown, Upload } from 'lucide-react';
import { useBacktest } from '../../context/BacktestContext';
import { EXCHANGE_OPTIONS, INTERVAL_OPTIONS } from '../../data/marketOptions';
import { parseCsvPreview } from '../../utils/parseCsvPreview';
import styles from './data-input.module.scss';

export type DataInputTab = 'asset-selection' | 'csv-upload';

export function DataInput() {
    const { setDataset, setCsvPreview, state } = useBacktest();
    const fileInputId = useId();
    const ds0 = state.dataset;
    const [activeTab, setActiveTab] = useState<DataInputTab>(() =>
        ds0.dataSource === 'csv' ? 'csv-upload' : 'asset-selection',
    );
    const [symbol, setSymbol] = useState(() => ds0.symbol);
    const [startDate, setStartDate] = useState(() => ds0.startDate);
    const [endDate, setEndDate] = useState(() => ds0.endDate);
    const [interval, setInterval] = useState(() => ds0.interval);
    const [exchange, setExchange] = useState(() => ds0.exchange);
    const [csvFileName, setCsvFileName] = useState<string | null>(() => ds0.csvFileLabel);
    const [csvError, setCsvError] = useState<string | null>(null);

    useEffect(() => {
        setSymbol(ds0.symbol);
        setStartDate(ds0.startDate);
        setEndDate(ds0.endDate);
        setInterval(ds0.interval);
        setExchange(ds0.exchange);
        setActiveTab(ds0.dataSource === 'csv' ? 'csv-upload' : 'asset-selection');
        if (ds0.dataSource === 'csv' && ds0.csvFileLabel) {
            setCsvFileName(ds0.csvFileLabel);
        } else if (ds0.dataSource === 'exchange') {
            setCsvFileName(null);
        }
    }, [
        ds0.symbol,
        ds0.startDate,
        ds0.endDate,
        ds0.interval,
        ds0.exchange,
        ds0.dataSource,
        ds0.csvFileLabel,
    ]);

    useEffect(() => {
        if (activeTab === 'asset-selection') {
            setDataset({
                symbol,
                startDate,
                endDate,
                interval,
                exchange,
                dataSource: 'exchange',
                csvFileLabel: null,
            });
        }
    }, [symbol, startDate, endDate, interval, exchange, activeTab, setDataset]);

    const selectTab = (tab: DataInputTab) => {
        if (tab === 'asset-selection' && activeTab !== 'asset-selection') {
            setCsvFileName(null);
            setCsvError(null);
            setDataset({ dataSource: 'exchange', csvFileLabel: null });
        }
        if (tab === 'csv-upload') {
            setDataset({ dataSource: 'csv' });
        }
        setActiveTab(tab);
    };

    const handleCsvFile = (file: File | null) => {
        setCsvError(null);
        if (!file) return;
        setCsvPreview(null);
        setCsvFileName(file.name);
        setDataset({ dataSource: 'csv', csvFileLabel: file.name });
        const reader = new FileReader();
        reader.onload = () => {
            const text = typeof reader.result === 'string' ? reader.result : '';
            const { rows, error } = parseCsvPreview(text);
            if (error) {
                setCsvError(error);
                return;
            }
            setCsvPreview(rows);
        };
        reader.onerror = () => setCsvError('Could not read file.');
        reader.readAsText(file);
    };

    return (
        <div className={styles.panel}>
            <div className={styles.tabs} role="tablist" aria-label="Data source">
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'asset-selection'}
                    className={`${styles.tab} ${activeTab === 'asset-selection' ? styles.tabActive : ''}`}
                    onClick={() => selectTab('asset-selection')}
                >
                    <span className={styles.tabLabel}>Asset Selection</span>
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'csv-upload'}
                    className={`${styles.tab} ${activeTab === 'csv-upload' ? styles.tabActive : ''}`}
                    onClick={() => selectTab('csv-upload')}
                >
                    <span className={styles.tabLabel}>CSV Upload</span>
                </button>
            </div>

            {activeTab === 'asset-selection' && (
                <div className={styles.fields}>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="data-symbol">
                            Symbol
                        </label>
                        <input
                            id="data-symbol"
                            type="text"
                            className={styles.input}
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value)}
                            autoComplete="off"
                            placeholder="BTC/USDT, ETH/USDT…"
                        />
                    </div>

                    <div className={styles.metaGrid}>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="data-interval">
                                Interval
                            </label>
                            <div className={styles.selectWrap}>
                                <select
                                    id="data-interval"
                                    className={styles.select}
                                    value={interval}
                                    onChange={(e) => setInterval(e.target.value)}
                                >
                                    {INTERVAL_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className={styles.selectChevron} aria-hidden strokeWidth={2} />
                            </div>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="data-exchange">
                                Exchange
                            </label>
                            <div className={styles.selectWrap}>
                                <select
                                    id="data-exchange"
                                    className={styles.select}
                                    value={exchange}
                                    onChange={(e) => setExchange(e.target.value)}
                                >
                                    {EXCHANGE_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className={styles.selectChevron} aria-hidden strokeWidth={2} />
                            </div>
                        </div>
                    </div>

                    <div className={styles.dateGrid}>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="data-start">
                                Start Date
                            </label>
                            <div className={styles.inputWrap}>
                                <input
                                    id="data-start"
                                    type="text"
                                    className={`${styles.input} ${styles.inputWithEndAdornment}`}
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    autoComplete="off"
                                />
                                <Calendar className={styles.inputIcon} aria-hidden strokeWidth={2} />
                            </div>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="data-end">
                                End Date
                            </label>
                            <div className={styles.inputWrap}>
                                <input
                                    id="data-end"
                                    type="text"
                                    className={`${styles.input} ${styles.inputWithEndAdornment}`}
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    autoComplete="off"
                                />
                                <Calendar className={styles.inputIcon} aria-hidden strokeWidth={2} />
                            </div>
                        </div>
                    </div>

                    <p className={styles.forexHint} role="note">
                        <strong>Forex &amp; metals</strong> (e.g. EURUSD, GBPUSD, XAUUSD): server download is{' '}
                        <strong>crypto spot only</strong> (Binance). Use <strong>CSV Upload</strong> with OHLCV from
                        your broker or data export.
                    </p>
                </div>
            )}

            {activeTab === 'csv-upload' && (
                <div className={styles.csvZone}>
                    <Upload className={styles.csvUploadIcon} size={28} strokeWidth={1.5} aria-hidden />
                    <p className={styles.csvHint}>
                        Required for forex and metal symbols—upload OHLCV CSV with a header row (e.g. timestamp, open,
                        high, low, close, volume). A preview of the first rows appears in the stream panel.
                    </p>
                    <label className={styles.fileLabel} htmlFor={fileInputId}>
                        Choose CSV
                    </label>
                    <input
                        id={fileInputId}
                        className={styles.fileInput}
                        type="file"
                        accept=".csv,text/csv"
                        onChange={(e) => handleCsvFile(e.target.files?.[0] ?? null)}
                    />
                    {csvFileName && <span className={styles.fileName}>{csvFileName}</span>}
                    {csvError && <p className={styles.csvError}>{csvError}</p>}
                </div>
            )}
        </div>
    );
}
