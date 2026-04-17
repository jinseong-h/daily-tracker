import { Play, Square } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useTimer } from '../../hooks/useTimer';

interface ActivityButtonProps {
  tag: string;
  category: string;
  color: string;
  isRunning: boolean;
  startTime?: string | null;
  warnings?: ('average' | 'today')[];
  onClick: () => void;
}

export function ActivityButton({ tag, category, color, isRunning, startTime, warnings = [], onClick }: ActivityButtonProps) {
  const elapsed = useTimer(isRunning ? startTime : null);

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center p-5 rounded-2xl transition-all duration-200 min-h-[150px] group",
        isRunning 
          ? "bg-white shadow-[0_8px_20px_rgb(0,0,0,0.08)] border-2 scale-[1.02]" 
          : "flat-card hover:bg-neutral-50 active:scale-[0.98]"
      )}
      style={{
        borderColor: isRunning ? color : 'transparent',
      }}
    >
      {!isRunning && warnings.length > 0 && (
        <div className="absolute -top-[2px] -right-[2px] flex flex-col items-end gap-[1px] overflow-hidden rounded-bl-xl rounded-tr-2xl">
          {warnings.includes('average') && (
            <div className="bg-red-500 text-white font-black text-xs px-3 py-1.5 shadow-sm leading-none tracking-tight animate-pulse" title="일 평균 목표 미달">
              평균미달
            </div>
          )}
          {warnings.includes('today') && (
            <div className="bg-orange-100 text-orange-600 font-bold text-[11px] px-2.5 py-1 shadow-sm leading-none tracking-tight" title="오늘 목표 미달">
              당일부족
            </div>
          )}
        </div>
      )}
      <div className="flex flex-col items-center gap-3 w-full">
        <div 
          className={cn(
            "p-3 rounded-full transition-all duration-200",
            isRunning ? "bg-red-50 text-red-500" : "bg-neutral-100 text-neutral-400 group-hover:text-neutral-600"
          )}
        >
          {isRunning ? <Square size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
        </div>
        
        <div className="text-center">
          <h3 className={cn(
            "font-bold text-base tracking-tight",
            isRunning ? "text-darkText" : "text-neutral-700"
          )}>{tag}</h3>
          <p className="text-[11px] font-medium mt-0.5"
             style={{ color: isRunning ? color : '#9ca3af' }}>
            {category}
          </p>
        </div>

        {isRunning && (
           <div className="mt-1 text-xl font-bold font-mono text-darkText">
             {elapsed}
           </div>
        )}
      </div>
    </button>
  );
}
