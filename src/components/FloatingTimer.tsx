import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { differenceInSeconds } from 'date-fns';
import { Pause, Clock } from 'lucide-react';
import { cn } from '../utils/cn';

export function FloatingTimer({ activeTab }: { activeTab: string }) {
  const { activities, stopActivity, showFloatingTimer } = useStore();
  const [now, setNow] = useState(new Date());

  const activeActivity = activities.find(a => a.is_running);

  useEffect(() => {
    if (!activeActivity || !showFloatingTimer) return;
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [activeActivity, showFloatingTimer]);

  if (!activeActivity || !showFloatingTimer || activeTab === 'tracker') return null;

  const diffSec = Math.max(0, differenceInSeconds(now, new Date(activeActivity.start_time)));
  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  const s = diffSec % 60;
  const runningTimeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  return (
    <div className="fixed bottom-24 right-4 md:bottom-12 md:right-12 z-50 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div 
        className="flex items-center gap-3 pr-2 pl-4 py-2 rounded-full shadow-xl border border-white/20 backdrop-blur-md"
        style={{ backgroundColor: activeActivity.color }}
      >
        <div className="flex items-center gap-2 text-white">
          <Clock size={16} className="opacity-80 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold opacity-90 leading-none mb-1 shadow-sm">{activeActivity.tag}</span>
            <span className="text-sm font-mono font-bold leading-none drop-shadow-sm tracking-wider">{runningTimeStr}</span>
          </div>
        </div>
        <button 
          onClick={(e) => {
             e.stopPropagation();
             stopActivity();
          }}
          className="w-10 h-10 ml-1 flex items-center justify-center rounded-full bg-white text-darkText hover:scale-105 active:scale-95 transition-transform shadow-md"
          title="작업 정지"
        >
          <Pause size={18} className="text-red-500 fill-current" />
        </button>
      </div>
    </div>
  );
}
