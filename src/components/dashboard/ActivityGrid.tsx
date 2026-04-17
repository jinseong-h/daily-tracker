import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { ActivityButton } from './ActivityButton';
import { PauseCircle, PlayCircle, Clock } from 'lucide-react';
import { format, differenceInSeconds, subDays } from 'date-fns';

export function ActivityGrid() {
  const { tags, categories, activities, targetPeriodSetting, startActivity, stopActivity } = useStore();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getCategoryColor = (categoryName: string) => {
    return categories.find(c => c.name === categoryName)?.color || '#A7C1A8';
  };

  const activeActivity = activities.find(a => a.is_running);

  const handleButtonClick = (tagName: string, categoryName: string, color: string) => {
    if (activeActivity && activeActivity.tag === tagName) {
      stopActivity();
    } else {
      startActivity(tagName, categoryName, color);
      // Auto-scroll to top when starting a new activity
      setTimeout(() => {
        const container = document.getElementById('main-scroll-container');
        if (container) {
          container.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100); // Slight delay to let the animation start
    }
  };

  const getTagWarnings = (tag: any): ('average' | 'today')[] => {
    if (!tag.daily_target) return [];
    
    const warnings: ('average' | 'today')[] = [];
    const periodDays = targetPeriodSetting || 7;
    const currentNow = new Date();
    const { dayStartOffset = 0 } = useStore.getState();
    
    let logicalTodayStart = new Date(currentNow.getFullYear(), currentNow.getMonth(), currentNow.getDate(), dayStartOffset, 0, 0, 0);
    if (currentNow < logicalTodayStart) {
      logicalTodayStart = subDays(logicalTodayStart, 1);
    }
    
    const todayActivities = activities.filter(a => {
      if (a.tag !== tag.name) return false;
      return new Date(a.start_time) >= logicalTodayStart;
    });
    const todayMs = todayActivities.reduce((sum, a) => {
      const start = new Date(a.start_time).getTime();
      const end = a.end_time ? new Date(a.end_time).getTime() : currentNow.getTime();
      return sum + Math.max(0, end - start);
    }, 0);
    
    if (todayMs < tag.daily_target * 3600000) {
      warnings.push('today');
    }
    
    let totalMs = 0;
    for (let i = periodDays - 1; i >= 0; i--) {
      const dayRefStart = subDays(logicalTodayStart, i);
      const dayRefEnd = subDays(logicalTodayStart, i - 1);
      
      const dayActs = activities.filter(a => {
        const s = new Date(a.start_time);
        return a.tag === tag.name && s >= dayRefStart && s < dayRefEnd;
      });
      totalMs += dayActs.reduce((sum, a) => {
        const start = new Date(a.start_time).getTime();
        const end = a.end_time ? new Date(a.end_time).getTime() : currentNow.getTime();
        return sum + Math.max(0, end - start);
      }, 0);
    }
    
    if (totalMs < tag.daily_target * 3600000 * periodDays) {
      warnings.push('average');
    }
    
    return warnings;
  };

  // Format running time for spotlight
  let runningTimeStr = '00:00:00';
  if (activeActivity) {
    const diffSec = Math.max(0, differenceInSeconds(now, new Date(activeActivity.start_time)));
    const h = Math.floor(diffSec / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    const s = diffSec % 60;
    runningTimeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  const displayTags = tags;

  return (
    <div className="flex flex-col gap-6 lg:gap-8 h-full">
      {/* Active Spotlight */}
      <div 
        className={`transition-all duration-500 will-change-transform ease-out overflow-hidden flex flex-col justify-center ${activeActivity ? 'opacity-100 max-h-[500px] scale-100 mb-4' : 'opacity-0 max-h-0 scale-95 pointer-events-none'}`}
      >
        {activeActivity && (
          <div 
            className="w-full rounded-3xl p-8 lg:p-12 shadow-xl border border-white/20 relative overflow-hidden flex flex-col items-center justify-center text-white"
            style={{ backgroundColor: activeActivity.color }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <Clock size={200} />
            </div>
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <span className="text-sm font-semibold tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full backdrop-blur-md mb-4 shadow-sm">
                {activeActivity.category}
              </span>
              <h2 className="text-4xl lg:text-5xl font-black mb-6 drop-shadow-md">{activeActivity.tag}</h2>
              <div className="text-6xl lg:text-7xl font-mono font-bold tracking-tighter mb-10 drop-shadow-lg">
                {runningTimeStr}
              </div>
              
              <button
                onClick={stopActivity}
                className="bg-white text-darkText rounded-2xl px-10 py-5 text-lg font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-3 drop-shadow-xl"
              >
                <PauseCircle size={28} className="text-red-500" />
                작업 정지
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grid List grouped by categories */}
      <div className="pb-8">
        <h3 className="text-sm font-bold text-neutral-400 mb-6 px-1">
          {activeActivity ? '다른 작업 시작 / 전환' : '어떤 작업을 시작할까요?'}
        </h3>
        
        <div className="flex flex-col gap-8">
          {categories.map((cat) => {
            const categoryTags = displayTags.filter(t => t.category === cat.name);
            if (categoryTags.length === 0) return null;
            return (
              <div key={`cat-group-${cat.name}`}>
                <div className="flex items-center gap-2 mb-3 px-1 relative">
                  <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />
                  <h4 className="text-sm font-bold text-darkText opacity-80">{cat.name}</h4>
                  <div className="h-px bg-neutral-200 flex-1 ml-2 opacity-50" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {categoryTags.map((tag) => {
                    const isRunning = activeActivity?.tag === tag.name;
                    return (
                      <ActivityButton
                        key={`${tag.category}-${tag.name}`}
                        tag={tag.name}
                        category={tag.category}
                        color={cat.color}
                        isRunning={isRunning}
                        startTime={isRunning ? activeActivity.start_time : undefined}
                        warnings={getTagWarnings(tag)}
                        onClick={() => handleButtonClick(tag.name, tag.category, cat.color)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
