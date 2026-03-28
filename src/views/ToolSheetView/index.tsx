import { PageShell } from '../../components/PageShell';
import styles from './tool-sheet-view.module.scss';

interface ToolSheetViewProps {
    title: string;
    subtitle: string;
    bullets: string[];
    ctaLabel: string;
}

export function ToolSheetView({ title, subtitle, bullets, ctaLabel }: ToolSheetViewProps) {
    return (
        <PageShell title={title} subtitle={subtitle}>
            <div className={styles.panel}>
                <ul className={styles.list}>
                    {bullets.map((b) => (
                        <li key={b} className={styles.item}>
                            {b}
                        </li>
                    ))}
                </ul>
                <button
                    type="button"
                    className={styles.cta}
                    disabled
                    title="Enabled once the FastAPI service is connected."
                >
                    {ctaLabel}
                </button>
            </div>
        </PageShell>
    );
}
