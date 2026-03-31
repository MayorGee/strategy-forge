import type { ReactNode } from 'react';
import styles from './page-shell.module.scss';

interface PageShellProps {
    title: string;
    subtitle?: string;
    /** Merged onto the title — e.g. a view-specific larger hero style from a CSS module. */
    titleClassName?: string;
    children: ReactNode;
}

export function PageShell({ title, subtitle, titleClassName, children }: PageShellProps) {
    return (
        <div className={styles.shell}>
            <header className={styles.header}>
                <h1 className={`${styles.title}${titleClassName ? ` ${titleClassName}` : ''}`}>{title}</h1>
                {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
            </header>
            {children}
        </div>
    );
}
