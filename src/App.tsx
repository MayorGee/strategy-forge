import { useState } from 'react';
import { BacktestProvider } from './context/BacktestContext';
import { DataInput } from './components/DataInput';
import { DataStreamPreview } from './components/DataStreamPreview';
import { EquityCurveCard } from './components/EquityCurveCard';
import { ForgeModePlaceholder } from './components/ForgeModePlaceholder';
import { MobileBottomNav, type MobileNavId } from './components/MobileBottomNav';
import { MobileNav } from './components/MobileNav';
import { PerformanceMetrics } from './components/PerformanceMetrics';
import { RecentExecutionLog } from './components/RecentExecutionLog';
import { RunContextBanner } from './components/RunContextBanner';
import { Sidebar } from './components/Sidebar';
import { StrategyLogic } from './components/StrategyLogic';
import { StrategyRunButton } from './components/StrategyRunButton';
import { TopBar, type ForgeMainTab } from './components/TopBar';
import type { AppView } from './types/navigation';
import { appViewToMobileNavId, mobileNavIdToAppView } from './utils/mobileNavMap';
import { DocumentationView } from './views/DocumentationView';
import { HistoryView } from './views/HistoryView';
import { ParametersView } from './views/ParametersView';
import { SettingsView } from './views/SettingsView';
import { StrategiesView } from './views/StrategiesView';
import { ToolSheetView } from './views/ToolSheetView';
import { WalkForwardView } from './views/WalkForwardView';

function AppLayout() {
    const [mainTab, setMainTab] = useState<ForgeMainTab>('backtest');
    const [view, setView] = useState<AppView>('dashboard');

    const handleTopTab = (tab: ForgeMainTab) => {
        setMainTab(tab);
        setView('dashboard');
    };

    const handleMobileNav = (id: MobileNavId) => {
        setView(mobileNavIdToAppView(id));
    };

    const dashboardBody =
        mainTab === 'backtest' ? (
            <>
                <RunContextBanner />
                <div className="app__section">
                    <div className="app__workspace">
                        <DataInput />
                        <DataStreamPreview />
                    </div>
                    <div className="app__strategyStrip">
                        <div className="app__strategyBar">
                            <div className="app__strategyBarMain">
                                <StrategyLogic />
                            </div>
                            <div className="app__strategyBarRun">
                                <StrategyRunButton />
                            </div>
                        </div>
                    </div>
                    <PerformanceMetrics />
                    <EquityCurveCard />
                    <RecentExecutionLog />
                </div>
            </>
        ) : mainTab === 'optimize' ? (
            <ForgeModePlaceholder mode="optimize" />
        ) : (
            <ForgeModePlaceholder mode="analyze" />
        );

    const mainContent = (() => {
        switch (view) {
            case 'dashboard':
                return dashboardBody;
            case 'strategies':
                return <StrategiesView onNavigate={setView} />;
            case 'parameters':
                return <ParametersView />;
            case 'walkforward':
                return <WalkForwardView />;
            case 'history':
                return <HistoryView onNavigate={setView} />;
            case 'montecarlo':
                return (
                    <ToolSheetView
                        title="Monte Carlo"
                        subtitle="Stress paths, drawdown fan charts, and distribution of outcomes—wired once the engine exposes scenario APIs."
                        bullets={[
                            'Run N randomized trade sequences or return-path bootstraps on the same rules.',
                            'Compare percentile bands for final equity and max drawdown vs. the baseline run.',
                            'Export summary stats for desk notes; live charts connect to the FastAPI analysis layer.',
                        ]}
                        ctaLabel="Run stress batch (API pending)"
                    />
                );
            case 'ga':
                return (
                    <ToolSheetView
                        title="Genetic optimizer"
                        subtitle="Population-based search over discrete parameter grids before walk-forward validation."
                        bullets={[
                            'Encode parameters as genes, score with your chosen fitness (Sharpe, CAGR, etc.).',
                            'Elitism + mutation keep the search stable on noisy objectives.',
                            'Best individuals feed the Forge bar; full runs await the Python optimization service.',
                        ]}
                        ctaLabel="Start GA session (API pending)"
                    />
                );
            case 'settings':
                return <SettingsView onNavigate={setView} />;
            case 'documentation':
                return <DocumentationView />;
            default:
                return dashboardBody;
        }
    })();

    const shell = view === 'dashboard' ? 'forge' : 'page';

    return (
        <div className="app" data-shell={shell}>
            <div className="app__glow app__glow--top" aria-hidden />
            <div className="app__glow app__glow--bottom" aria-hidden />
            <Sidebar activeView={view} onNavigate={setView} />
            <MobileNav />
            <div className="app__main">
                {view === 'dashboard' && <TopBar activeTab={mainTab} onTabChange={handleTopTab} />}
                <main className="app__content">{mainContent}</main>
            </div>
            <MobileBottomNav activeId={appViewToMobileNavId(view)} onNavigate={handleMobileNav} />
        </div>
    );
}

function App() {
    return (
        <BacktestProvider>
            <AppLayout />
        </BacktestProvider>
    );
}

export default App;
