import { useState } from 'react';
import { format } from 'date-fns';
import { MonthCalendar } from './MonthCalendar';
import { Timeline } from '../timeline/Timeline';
import { useStore } from '../../store/useStore';
import { LayoutList, FileEdit } from 'lucide-react';

const EMOTIONS = [
  { color: '#819A91', name: '평온/집중' },
  { color: '#A7C1A8', name: '기쁨/뿌듯' },
  { color: '#D1D8BE', name: '여유/무난' },
  { color: '#f59e0b', name: '바쁨/지침' },
  { color: '#ef4444', name: '우울/화남' },
];

export function CalendarView() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { journals, addJournal } = useStore();

  const journal = journals.find(j => j.date === selectedDate);
  const [memo, setMemo] = useState(journal ? journal.short_memo : '');

  const handleSave = (color: string) => {
    addJournal({
      date: selectedDate,
      emotion_color: color,
      short_memo: memo
    });
  };

  const MemoInput = () => (
    <div className="flex flex-col gap-4">
      <h3 className="font-bold text-sm text-darkText flex items-center gap-1.5 px-1"><FileEdit size={16} className="text-secondary" /> 메모 & 감정 기록</h3>
      <textarea
        value={memo}
        onChange={e => setMemo(e.target.value)}
        placeholder="오늘 하루는 어땠나요? 간단한 회고를 남겨보세요..."
        className="w-full bg-neutral-50 rounded-xl p-4 text-darkText border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none min-h-[100px] text-sm"
      />
      
      <div className="flex flex-col gap-2">
        <span className="text-xs text-neutral-500 font-bold px-1">감정 선택 (자동 저장)</span>
        <div className="flex flex-wrap gap-2">
          {EMOTIONS.map(e => (
            <button
              key={e.color}
              onClick={() => handleSave(e.color)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                journal?.emotion_color === e.color 
                  ? 'border-darkText scale-[1.02] shadow-sm' 
                  : 'border-neutral-200 hover:border-neutral-300 bg-white'
              }`}
              style={{ 
                backgroundColor: journal?.emotion_color === e.color ? `${e.color}15` : undefined,
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
              <span className={journal?.emotion_color === e.color ? 'text-darkText' : 'text-neutral-600'}>{e.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 py-2 pb-10 animate-in fade-in h-full">
      {/* Left Column (Calendar & Mobile Memo) */}
      <div className="flex flex-col gap-6 lg:w-[45%] shrink-0">
        <div className="flat-card p-5">
          <MonthCalendar onDateSelect={(date) => {
            setSelectedDate(date);
            const j = journals.find(x => x.date === date);
            setMemo(j ? j.short_memo : '');
          }} selectedDate={selectedDate} />
        </div>
        
        {/* Memo Input Desktop */}
        <div className="flat-card p-5 hidden lg:block">
          <MemoInput />
        </div>
      </div>

      {/* Right Column (Timeline & Mobile Memo) */}
      <div className="flex flex-col gap-6 lg:flex-1 w-full min-w-0">
        {/* Memo Input Mobile */}
        <div className="flat-card p-5 lg:hidden">
          <MemoInput />
        </div>

        <div className="flex-1 flex flex-col h-full bg-background rounded-2xl relative">
          <h2 className="text-xl font-bold text-darkText px-2 flex items-center justify-between mb-2">
            <span>{selectedDate.replace(/-/g, '.')} <span className="text-sm font-medium text-neutral-500 ml-1">타임라인</span></span>
            <LayoutList size={20} className="text-primary hidden lg:block" />
          </h2>
          
          <div className="w-full relative mt-2">
            <Timeline date={selectedDate} />
          </div>
        </div>
      </div>
    </div>
  );
}
