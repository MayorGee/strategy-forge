import { useEffect, useState } from 'react';
import { PageShell } from '../../components/PageShell';
import type { AppView } from '../../types/navigation';
import styles from './settings-view.module.scss';

const STORAGE_KEY = 'strategy-forge-api-base';

interface SettingsViewProps {
    onNavigate?: (view: AppView) => void;
}

export function SettingsView({ onNavigate }: SettingsViewProps) {
    const [apiBase, setApiBase] = useState('');

    useEffect(() => {
        setApiBase(() => localStorage.getItem(STORAGE_KEY) ?? '');
    }, []);

    useEffect(() => {
        const t = window.setTimeout(() => {
            if (apiBase === '') {
                localStorage.removeItem(STORAGE_KEY);
            } else {
                localStorage.setItem(STORAGE_KEY, apiBase.trim());
            }
        }, 300);
        return () => window.clearTimeout(t);
    }, [apiBase]);

    return (
        <PageShell
            title="Settings"
            subtitle="Workspace preferences. API base is stored in this browser only—no secrets in the bundle."
        >
            <div className={styles.panel}>
                <div className={styles.field}>
                    <label className={styles.label} htmlFor="settings-api-base">
                        API base URL
                    </label>
                    <input
                        id="settings-api-base"
                        type="url"
                        className={styles.input}
                        placeholder="https://api.example.com"
                        value={apiBase}
                        onChange={(e) => setApiBase(e.target.value)}
                        autoComplete="off"
                    />
                    <p className={styles.hint}>
                        Used when the Vite app calls your FastAPI deployment (e.g. Railway). Leave blank for mock-only
                        mode.
                    </p>
                </div>

                {onNavigate ? (
                    <div className={styles.shortcuts}>
                        <h2 className={styles.shortcutsTitle}>Shortcuts</h2>
                        <p className={styles.shortcutsBody}>
                            On small screens the bottom bar does not include every route. Jump to portfolio assumptions
                            (capital, fees, slippage) from here if you do not use the desktop sidebar.
                        </p>
                        <button
                            type="button"
                            className={styles.linkAction}
                            onClick={() => onNavigate('parameters')}
                        >
                            Open Parameters
                        </button>
                    </div>
                ) : null}

                <p className={styles.note}>Theme: dark (default). Light mode can land after core workflows stabilize.</p>
            </div>
        </PageShell>
    );
}
