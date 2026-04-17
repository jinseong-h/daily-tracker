import { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { generateTimelineBlocks } from '../../utils/timeline';
import type { TimelineBlock } from '../../utils/timeline';
import { startOfDay, isSameDay, format, differenceInMinutes } from 'date-fns';
import { GreyZoneModal } from './GreyZoneModal';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

function formatDuration(ms: number) {
  const mins = Math.max(1, Math.round(ms / 60000));
  if (mins < 60) return `${mins}분`;
  const hrs = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  if (remainingMins === 0) return `${hrs}시간`;
  return `${hrs}시간 ${remainingMins}분`;
}

const PIXELS_PER_MINUTE = 1.2; // 1시간 = 72px

export function Timeline({ date }: { date: string }) {
  const activities = useStore(state => state.activities);
  const [selectedBlock, setSelectedBlock] = useState<TimelineBlock | null>(null);
  
  const targetDateObj = new Date(date);
  const isToday = isSameDay(targetDateObj, new Date());

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    if (!isToday) return;
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, [isToday]);

  const blocks = useMemo(() => generateTimelineBlocks(activities, targetDateObj), [activities, now, date, targetDateObj]);
  
  const dayStart = startOfDay(targetDateObj);
  const currentMinutes = isToday ? differenceInMinutes(now, dayStart) : 0;
  
  const dayEndObj = isToday ? now : new Date(dayStart.getTime() + 86399999);
  
  const wasteMs = useMemo(() => {
    return activities
      .filter(a => a.tag === '낭비' && new Date(a.start_time) >= dayStart && new Date(a.start_time) <= dayEndObj)
      .reduce((sum, a) => {
        const aStart = new Date(a.start_time);
        const aEnd = a.end_time ? new Date(a.end_time) : dayEndObj;
        return sum + (Math.min(aEnd.getTime(), dayEndObj.getTime()) - Math.max(aStart.getTime(), dayStart.getTime()));
      }, 0);
  }, [activities, dayStart, dayEndObj, now]);

  const totalDayMs = dayEndObj.getTime() - dayStart.getTime();
  const wastePercentage = totalDayMs > 0 ? (wasteMs / Math.max(totalDayMs, 1)) * 100 : 0;
  const isWasteWarning = wastePercentage > 20;

  // Removed auto scroll to show 0-24h fully

  return (
    <div className="flex flex-col gap-4 py-2">
      {isWasteWarning && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-start gap-3">
          <AlertCircle className="shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-bold text-sm">주의</h3>
            <p className="text-xs mt-1 leading-relaxed text-red-500">
              오늘 하루 낭비 시간이 20%를 초과했습니다. ({wastePercentage.toFixed(1)}%)
            </p>
          </div>
        </div>
      )}

      {/* 24-Hour Ruler Timeline */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-neutral-200 relative overflow-hidden">
        <div className="relative w-full" style={{ height: `${24 * 60 * PIXELS_PER_MINUTE}px` }}>
          
          {/* Vertical Divider line */}
          <div className="absolute top-0 bottom-0 left-[60px] w-[1px] bg-neutral-100" />
          
          {/* Grid Lines & Hours */}
          {Array.from({ length: 25 }).map((_, i) => (
            <div 
              key={`hour-${i}`} 
              className="absolute w-full flex items-center pointer-events-none" 
              style={{ top: `${i * 60 * PIXELS_PER_MINUTE}px` }}
            >
               <div className="w-[60px] pr-3 shrink-0 flex justify-end">
                 <span className="text-[10px] text-neutral-400 font-mono font-medium transform -translate-y-1/2 z-10">
                   {String(i).padStart(2, '0')}:00
                 </span>
               </div>
               <div className="flex-1 border-t border-neutral-100" />
            </div>
          ))}

          {/* Current Time Indicator */}
          {isToday && (
            <div 
              className="absolute w-full z-50 flex items-center pointer-events-none" 
              style={{ top: `${currentMinutes * PIXELS_PER_MINUTE}px` }}
            >
              <div className="w-[60px] shrink-0" />
              <div className="flex-1 relative border-t-[1.5px] border-red-400">
                 <div className="w-2 h-2 rounded-full bg-red-400 shadow absolute -left-[4.5px] transform -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* Blocks */}
          <div className="absolute top-0 bottom-0 left-[68px] right-3 lg:right-5">
            {blocks.map(block => {
              const startMins = Math.max(0, differenceInMinutes(block.start, dayStart));
              const durMins = Math.round(block.durationMs / 60000);
              
              const topPx = startMins * PIXELS_PER_MINUTE;
              const heightPx = Math.max(16, durMins * PIXELS_PER_MINUTE); // 최소 16px 보장하여 선처럼 보이지 않게 함

              const startTimeStr = format(block.start, 'HH:mm');
              const endTimeStr = format(block.end, 'HH:mm');
              
              if (block.type === 'grey-zone') {
                return (
                  <button
                    key={block.id}
                    onClick={() => setSelectedBlock(block)}
                    disabled={!isToday || durMins < 15}
                    className="absolute w-full rounded-xl bg-neutral-50/50 hover:bg-neutral-100 transition-all border border-dashed border-neutral-300 flex items-center justify-center group overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                  >
                    {isToday && heightPx > 20 && (
                      <span className="text-[10px] text-neutral-400 font-bold group-hover:text-neutral-500 transition-colors bg-white/90 px-2 py-0.5 rounded-lg shadow-sm border border-neutral-100">
                        (+ 태그 추가)
                      </span>
                    )}
                  </button>
                );
              }

              const durStr = formatDuration(block.durationMs);
              const isTiny = heightPx < 25;

              const isEditable = block.activity?.tag === '휴식' || block.activity?.tag === '낭비';

              return (
                <div
                  key={block.id}
                  onClick={isEditable && isToday ? () => setSelectedBlock(block) : undefined}
                  className={`absolute w-full rounded-md overflow-hidden flex flex-col justify-center px-3 transition-all border shadow-sm z-20 group ${isEditable && isToday ? 'cursor-pointer hover:brightness-95' : ''}`}
                  style={{ 
                    top: `${topPx}px`, 
                    height: `${heightPx}px`,
                    backgroundColor: `${block.activity?.color}F5`, 
                    borderColor: `${block.activity?.color}`,
                    color: '#fff' // Assuming darker colors via text-shadow or contrasting text. White text generally works well on solid buttons
                  }}
                >
                  <div className="flex justify-between w-full items-center">
                    <span className="text-xs font-bold truncate drop-shadow-sm">
                      {block.activity?.tag}
                    </span>
                    {!isTiny && (
                      <span className="text-[10px] font-semibold opacity-90 font-mono shrink-0 ml-2 drop-shadow-sm">
                        {durStr}
                      </span>
                    )}
                  </div>
                  {!isTiny && heightPx > 35 && (
                    <div className="text-[9px] font-medium opacity-75 mt-0.5 drop-shadow-sm">
                      {startTimeStr} - {endTimeStr}
                    </div>
                  )}

                  {/* Tooltip for tiny blocks */}
                  {isTiny && (
                    <div className="absolute hidden group-hover:flex bg-neutral-800 text-white text-[10px] px-2 py-1 rounded -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-50">
                      {block.activity?.tag} ({durStr})
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedBlock && (
        <GreyZoneModal 
          block={selectedBlock} 
          onClose={() => setSelectedBlock(null)} 
        />
      )}
    </div>
  );
}
