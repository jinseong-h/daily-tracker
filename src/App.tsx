import { useState, useEffect } from 'react';
import { useStore } from './store/useStore';
import { ActivityGrid } from './components/dashboard/ActivityGrid';
import { CalendarView } from './components/calendar/CalendarView';
import { StatisticsView } from './components/statistics/StatisticsView';
import { SettingsView } from './components/settings/SettingsView';
import { Navigation } from './components/Navigation';
import { FloatingTimer } from './components/FloatingTimer';
import { initSync } from './lib/sync';

initSync();

function App() {
  const [activeTab, setActiveTab] = useState('tracker');
  const { tags, categories, addTag, addCategory } = useStore();

  useEffect(() => {
    if (!localStorage.getItem('sleep_migrated_v4')) {
      if (!categories.find(c => c.name === '기본')) {
         addCategory({ name: '기본', color: '#8b5cf6' });
      }
      if (!tags.find(t => t.name === '취침')) {
         addTag({ name: '취침', category: '기본', daily_target: 7 });
      }
      localStorage.setItem('sleep_migrated_v4', 'true');
    }
  }, [tags, categories, addTag, addCategory]);

  return (
    <div className="h-[100dvh] bg-neutral-100 flex text-darkText font-sans selection:bg-primary/30 overflow-hidden">
      <div className="w-full bg-background relative flex flex-col h-full overflow-hidden text-sm md:flex-row">
      
        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-64 lg:w-72 bg-white border-r border-neutral-200 flex-col pt-10 pb-6 z-50 shrink-0 h-full overflow-y-auto">
          <div className="px-8 mb-10 w-full flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary text-white rounded-2xl flex items-center justify-center font-black text-2xl mb-4 shadow-lg drop-shadow">V</div>
            <h1 className="text-xl font-bold tracking-tight text-darkText">Vivatly</h1>
            <p className="text-xs text-neutral-400 mt-1">나의 일상을 기록하다</p>
          </div>
          <Navigation vertical activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Content Area */}
        <div id="main-scroll-container" className="flex-1 flex flex-col h-full overflow-y-auto relative bg-background/50 scroll-smooth">
          <header className="pt-12 pb-6 px-6 md:pt-10 md:px-10 sticky top-0 bg-background/90 backdrop-blur-md z-40 border-b border-neutral-200/50 transition-all flex items-center justify-between">
            {activeTab === 'tracker' && (
              <>
                <h1 className="text-3xl font-bold text-darkText tracking-tight">트래커</h1>
              </>
            )}
            {activeTab === 'calendar' && (
              <>
                <h1 className="text-3xl font-bold text-darkText tracking-tight">캘린더</h1>
              </>
            )}
            {activeTab === 'statistics' && (
              <div className="flex justify-between items-center w-full">
                <h1 className="text-3xl font-bold text-darkText tracking-tight">통계</h1>
                <div className="flex bg-neutral-100/80 backdrop-blur rounded-lg p-1 border border-neutral-200/50">
                  <button 
                    onClick={() => useStore.getState().setStatisticsTimeRange('week')}
                    className={`text-xs px-4 py-1.5 rounded-md font-semibold transition-all ${useStore.getState().statisticsTimeRange === 'week' ? "bg-white shadow-sm text-darkText" : "text-neutral-500 hover:text-darkText"}`}
                  >
                    주간
                  </button>
                  <button 
                    onClick={() => useStore.getState().setStatisticsTimeRange('month')}
                    className={`text-xs px-4 py-1.5 rounded-md font-semibold transition-all ${useStore.getState().statisticsTimeRange === 'month' ? "bg-white shadow-sm text-darkText" : "text-neutral-500 hover:text-darkText"}`}
                  >
                    월간
                  </button>
                </div>
              </div>
            )}
            {activeTab === 'settings' && (
              <>
                <h1 className="text-3xl font-bold text-darkText tracking-tight">설정</h1>
              </>
            )}
          </header>

          <main className="px-4 pb-32 md:px-10 md:pb-10 animate-in fade-in duration-500 flex-1">
            {activeTab === 'tracker' && <ActivityGrid />}
            {activeTab === 'calendar' && <CalendarView />}
            {activeTab === 'statistics' && <StatisticsView />}
            {activeTab === 'settings' && <SettingsView />}
          </main>

          {/* Mobile Navigation */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
            <Navigation activeTab={activeTab} onChange={setActiveTab} />
          </div>
        </div>
        
        {/* Floating Timer Widget */}
        <FloatingTimer activeTab={activeTab} />
      </div>
    </div>
  );
}

export default App;
