import { PageShell } from '../../components/PageShell';
import { useBacktest } from '../../context/BacktestContext';
import {
    STRATEGY_TEMPLATES,
    builtInCards,
    templatePresetSummary,
    type StrategyLibraryRow,
} from '../../data/strategyLibrary';
import { strategyLabel } from '../../data/strategies';
import type { AppView } from '../../types/navigation';
import type { StrategyId } from '../../types/backtest';
import styles from './strategies-view.module.scss';

interface StrategiesViewProps {
    onNavigate: (view: AppView) => void;
}

export function StrategiesView({ onNavigate }: StrategiesViewProps) {
    const { setStrategyId, applyStrategyPreset } = useBacktest();

    const useInForge = (strategyId: StrategyId) => {
        setStrategyId(strategyId);
        onNavigate('dashboard');
    };

    const renderCard = (card: StrategyLibraryRow) => (
        <article
            key={card.kind === 'builtin' ? card.strategyId : card.id}
            className={`${styles.card} ${
                card.kind === 'template' ? styles.cardTemplate : styles.cardBuiltin
            }`}
        >
            <h3 className={styles.cardTitle}>{card.name}</h3>
            <p className={styles.engineLine}>
                Engine: <strong>{strategyLabel(card.strategyId)}</strong>
            </p>
            {card.kind === 'template' && (
                <p className={styles.presetLine}>{templatePresetSummary(card)}</p>
            )}
            <p className={styles.desc}>{card.description}</p>
            <div className={styles.tags}>
                {card.tags.map((t) => (
                    <span key={t} className={styles.tag}>
                        {t}
                    </span>
                ))}
            </div>
            <div className={styles.actions}>
                {card.kind === 'builtin' ? (
                    <>
                        <button
                            type="button"
                            className={styles.useBtn}
                            onClick={() => useInForge(card.strategyId)}
                        >
                            Use in Forge
                        </button>
                        <button
                            type="button"
                            className={styles.ghostBtn}
                            onClick={() => onNavigate('dashboard')}
                        >
                            Open dashboard
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        className={styles.useBtn}
                        onClick={() => {
                            applyStrategyPreset(card.strategyId, card.presetParams);
                            onNavigate('dashboard');
                        }}
                    >
                        Apply template in Forge
                    </button>
                )}
            </div>
        </article>
    );

    return (
        <PageShell
            title="Strategies"
            subtitle="Core strategies and templates are grouped separately below—templates only change preset numbers on an engine you already have in the app."
        >
            <div className={styles.page}>
                <section className={styles.section} aria-labelledby="forge-core-strategies-heading">
                    <header className={styles.sectionHeader}>
                        <h2 id="forge-core-strategies-heading" className={styles.sectionTitle}>
                            Core strategies
                        </h2>
                        <p className={styles.sectionIntro}>
                            Built-in backtest engines. <strong>Use in Forge</strong> selects the engine and leaves your
                            current dashboard parameters as-is until you change them.
                        </p>
                    </header>
                    <div className={styles.grid}>{builtInCards().map(renderCard)}</div>
                </section>

                <section className={styles.section} aria-labelledby="forge-templates-heading">
                    <header className={styles.sectionHeader}>
                        <h2 id="forge-templates-heading" className={styles.sectionTitle}>
                            Templates
                        </h2>
                        <p className={styles.sectionIntro}>
                            Named presets on those same engines. <strong>Apply template in Forge</strong> switches the
                            engine if needed, overwrites parameters with the bundle listed on the card, and opens the
                            dashboard.
                        </p>
                    </header>
                    <div className={styles.grid}>{STRATEGY_TEMPLATES.map(renderCard)}</div>
                </section>
            </div>
        </PageShell>
    );
}
