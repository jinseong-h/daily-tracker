import { useStore } from '../../store/useStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

export function MonthCalendar({ selectedDate, onDateSelect }: { selectedDate: string, onDateSelect: (d: string) => void }) {
  const journals = useStore(state => state.journals);
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  
  useEffect(() => {
    setCurrentMonth(new Date(selectedDate));
  }, [selectedDate]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const getDayColor = (date: Date) => {
    const dStr = format(date, 'yyyy-MM-dd');
    const j = journals.find(j => j.date === dStr);
    return j ? j.emotion_color : undefined;
  };

  return (
    <div className="w-full flex flex-col">
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="font-bold text-darkText">{format(currentMonth, 'yyyy년 M월')}</h3>
        <div className="flex gap-2">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-neutral-100 rounded-full transition-colors text-neutral-600"><ChevronLeft size={20} /></button>
          <button onClick={handleNextMonth} className="p-1 hover:bg-neutral-100 rounded-full transition-colors text-neutral-600"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-[10px] font-bold text-neutral-400 py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-3 gap-x-1">
        {days.map(day => {
          const isSelected = selectedDate === format(day, 'yyyy-MM-dd');
          const isSameMth = isSameMonth(day, monthStart);
          const isTdy = isSameDay(day, new Date());
          const emotionColor = getDayColor(day);

          return (
            <div key={day.toISOString()} className="flex justify-center flex-col items-center gap-1.5">
              <button
                onClick={() => onDateSelect(format(day, 'yyyy-MM-dd'))}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all shrink-0",
                  !isSameMth && "text-neutral-300",
                  isSameMth && !isSelected && !isTdy && "text-darkText hover:bg-neutral-100",
                  isSameMth && !isSelected && isTdy && "bg-primary/10 font-bold text-primary border border-primary/20",
                  isSelected && "bg-darkText text-white shadow-md scale-110"
                )}
              >
                {format(day, 'd')}
              </button>
              
              <div className="w-6 h-1.5 rounded-full shrink-0" style={{ backgroundColor: emotionColor || 'transparent' }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
