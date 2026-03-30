import type { OhlcvBar, StreamPreviewRow } from '../types/backtest';

function parsePx(s: string): number | null {
    const n = parseFloat(s.replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : null;
}

/** Map CSV preview strings → numeric OHLCV for POST /backtest (same schema as Binance-normalized bars). */
export function streamPreviewToOhlcvBars(rows: StreamPreviewRow[]): OhlcvBar[] {
    const out: OhlcvBar[] = [];
    for (const r of rows) {
        const o = parsePx(r.open);
        const h = parsePx(r.high);
        const l = parsePx(r.low);
        const c = parsePx(r.close);
        const vRaw = parsePx(r.volume);
        if (o === null || h === null || l === null || c === null) continue;
        out.push({
            time: r.timestamp.trim(),
            open: o,
            high: h,
            low: l,
            close: c,
            volume: vRaw ?? 0,
        });
    }
    return out;
}
