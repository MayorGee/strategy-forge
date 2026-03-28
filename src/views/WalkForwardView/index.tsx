import { useId, useState } from 'react';
import { PageShell } from '../../components/PageShell';
import styles from './walk-forward-view.module.scss';

export function WalkForwardView() {
    const id = useId();
    const [train, setTrain] = useState('90');
    const [test, setTest] = useState('30');
    const [step, setStep] = useState('30');
    const [anchored, setAnchored] = useState(true);

    return (
        <PageShell
            title="Walk-forward"
            subtitle="Anchor in-sample optimization, roll forward, and score out-of-sample stability. Scheduler wiring lands with the Python service."
        >
            <div className={styles.panel}>
                <div className={styles.grid2}>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor={`${id}-train`}>
                            Train window (bars)
                        </label>
                        <input
                            id={`${id}-train`}
                            className={styles.input}
                            value={train}
                            onChange={(e) => setTrain(e.target.value)}
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor={`${id}-test`}>
                            Test window (bars)
                        </label>
                        <input
                            id={`${id}-test`}
                            className={styles.input}
                            value={test}
                            onChange={(e) => setTest(e.target.value)}
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor={`${id}-step`}>
                            Step (bars)
                        </label>
                        <input
                            id={`${id}-step`}
                            className={styles.input}
                            value={step}
                            onChange={(e) => setStep(e.target.value)}
                        />
                    </div>
                </div>
                <label className={styles.check}>
                    <input
                        type="checkbox"
                        checked={anchored}
                        onChange={(e) => setAnchored(e.target.checked)}
                    />
                    Anchor first train window to dataset start
                </label>
                <button
                    type="button"
                    className={styles.runBtn}
                    disabled
                    title="Enabled once the FastAPI service is connected."
                >
                    Run walk-forward (requires API)
                </button>
                <p className={styles.note}>
                    Outputs will mirror the Dashboard: equity per fold, parameter stability, and worst-fold metrics.
                </p>
            </div>
        </PageShell>
    );
}
