/** Same key as Settings: persisted API origin (no trailing slash). */
export const STRATEGY_FORGE_API_BASE_KEY = 'strategy-forge-api-base';

export function readStoredApiBase(): string | null {
    try {
        const raw = localStorage.getItem(STRATEGY_FORGE_API_BASE_KEY)?.trim();
        if (!raw) return null;
        
        return raw.replace(/\/+$/, '');
    } catch {
        return null;
    }
}
