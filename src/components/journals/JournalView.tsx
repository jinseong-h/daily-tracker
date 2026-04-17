import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useStore } from '../../store/useStore';
import { Heatmap } from './Heatmap';

const EMOTIONS = [
  { color: '#22c55e', name: 'Happy / Good' },
  { color: '#eab308', name: 'Stressed / Busy' },
  { color: '#6366f1', name: 'Calm / Focused' },
  { color: '#ef4444', name: 'Angry / Frustrated' },
  { color: '#a855f7', name: 'Exhausted / Sad' },
];

export function JournalView() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { journals, activities, addJournal } = useStore();

  const journal = journals.find(j => j.date === selectedDate);
  const [memo, setMemo] = useState(journal ? journal.short_memo : '');

  // Reset memo state when selectedDate changes
  useMemo(() => {
    const j = journals.find(j => j.date === selectedDate);
    setMemo(j ? j.short_memo : '');
  }, [selectedDate, journals]);

  const handleSave = (color: string) => {
    addJournal({
      date: selectedDate,
      emotion_color: color,
      short_memo: memo
    });
  };

  const correlationText = useMemo(() => {
    if (activities.length === 0) return "Not enough data to analyze correlations.";
    
    const tagCount = activities.reduce((acc, a) => {
      if (a.tag !== 'Waste' && a.tag !== 'Rest') {
        acc[a.tag] = (acc[a.tag] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const keys = Object.keys(tagCount);
    if (keys.length === 0) return "Log some activities to see insights!";
    
    const maxTag = keys.reduce((a, b) => tagCount[a] > tagCount[b] ? a : b);
    
    // Check if there are journals for those days
    const daysWithTag = activities.filter(a => a.tag === maxTag).map(a => a.start_time.split('T')[0]);
    const emotionsForTag = journals.filter(j => daysWithTag.includes(j.date));
    
    if (emotionsForTag.length === 0) return `You track '${maxTag}' a lot, but haven't logged your emotions on those days yet!`;
    
    return `Interestingly, on days you spend time on "${maxTag}", your journal usually reflects diverse emotions. Keep monitoring this!`;
  }, [activities, journals]);


  return (
    <div className="flex flex-col gap-6 py-2 animate-in fade-in">
      <div className="glass-card p-5 border-white/5">
        <h2 className="text-lg font-semibold text-white mb-4">Activity Heatmap</h2>
        <Heatmap onDateSelect={setSelectedDate} selectedDate={selectedDate} />
      </div>

      <div className="glass-card p-5 border-white/5">
        <h2 className="text-lg font-semibold text-white mb-4">
          Journal for <span className="text-primary">{selectedDate}</span>
        </h2>
        
        <div className="flex flex-col gap-4">
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="How was your day? Write a short memo..."
            className="w-full bg-neutral-900/50 rounded-xl p-4 text-white border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary outline-none transition-all resize-none h-24"
          />
          
          <div className="flex flex-col gap-2 relative mt-2">
            <span className="text-xs text-neutral-400 font-medium uppercase tracking-widest">Select Emotion to Save</span>
            <div className="flex flex-wrap gap-2">
              {EMOTIONS.map(e => (
                <button
                  key={e.color}
                  onClick={() => handleSave(e.color)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    journal?.emotion_color === e.color 
                      ? 'border-white/40 scale-105 shadow-[0_0_15px_-3px] bg-opacity-30' 
                      : 'border-transparent hover:border-white/20 hover:bg-opacity-20'
                  }`}
                  style={{ 
                    backgroundColor: `${e.color}15`, 
                    color: e.color,
                    boxShadow: journal?.emotion_color === e.color ? `0 0 15px -3px ${e.color}` : undefined
                  }}
                >
                  <span className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: e.color }} />
                  {e.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-5 bg-gradient-to-br from-neutral-900 to-indigo-900/20 border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
        <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2 relative z-10">
          <span>✨</span> Insights
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed relative z-10">
          {correlationText}
        </p>
      </div>
    </div>
  );
}
