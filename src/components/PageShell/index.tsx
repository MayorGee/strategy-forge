import type { ReactNode } from 'react';
import styles from './page-shell.module.scss';

interface PageShellProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
}

export function PageShell({ title, subtitle, children }: PageShellProps) {
    return (
        <div className={styles.shell}>
            <header className={styles.header}>
                <h1 className={styles.title}>{title}</h1>
                {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            </header>
            {children}
        </div>
    );
}
