import { useStore } from '../../store/useStore';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Trophy, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

export function GoalsView() {
  const goals = useStore(state => state.goals);
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (goals.some(g => g.is_completed)) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 6000); 
      return () => clearTimeout(timer);
    }
  }, [goals]);

  return (
    <div className="flex flex-col gap-6 py-2 pb-10 animate-in fade-in">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <Confetti width={width!} height={height!} recycle={false} numberOfPieces={600} gravity={0.15} />
        </div>
      )}

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold px-2 text-white">Current Goals</h2>
        <div className="flex flex-col gap-4">
          {goals.map(goal => {
            const percent = Math.min(100, Math.round((goal.current_hours / goal.target_hours) * 100));
            const isDone = percent === 100;
            return (
              <div key={goal.id} className="glass-card p-5 relative overflow-hidden group border-white/5">
                <div className="flex justify-between items-end mb-4 relative z-10">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1 block">Goal</span>
                    <h3 className="text-lg font-semibold text-white">{goal.target_tag} - {goal.target_hours}hrs</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-mono font-bold text-white group-hover:text-primary transition-colors">
                      {goal.current_hours.toFixed(1)}
                    </span>
                    <span className="text-neutral-500 text-sm ml-1 font-mono">/ {goal.target_hours}</span>
                  </div>
                </div>

                <div className="h-4 bg-neutral-900 rounded-full overflow-hidden border border-white/5 relative z-10">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out relative"
                    style={{ width: `${percent}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse-slow" />
                  </div>
                </div>
                
                {isDone && (
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-accent/20 blur-3xl rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-6">
        <h2 className="text-xl font-bold px-2 text-white flex items-center justify-between">
          <span>Badges</span>
          <span className="text-xs font-normal text-neutral-400 bg-neutral-800/50 border border-white/10 px-3 py-1 rounded-full">
            {goals.filter(g => g.is_completed).length} Achieved
          </span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {goals.map(goal => {
            const isDone = Boolean(goal.is_completed);
            
            return (
              <div 
                key={goal.id} 
                className={cn(
                  "aspect-square rounded-3xl flex flex-col items-center justify-center gap-3 transition-all p-4 text-center relative overflow-hidden",
                  isDone 
                    ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-yellow-500/40 shadow-[0_0_30px_-5px_rgba(234,179,8,0.3)]" 
                    : "glass-card opacity-50 grayscale border-white/5"
                )}
              >
                {isDone && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/20 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2" />
                )}
                <div className={cn(
                  "p-4 rounded-full shadow-inner relative z-10", 
                  isDone ? "bg-yellow-500/20 text-yellow-500 ring-1 ring-yellow-500/50" : "bg-neutral-800 text-neutral-500"
                )}>
                  {isDone ? <Trophy size={32} /> : <Lock size={32} />}
                </div>
                {isDone && (
                  <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider px-1 relative z-10">
                    {goal.target_tag.substring(0, 8)} Master
                  </span>
                )}
                {!isDone && (
                  <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider px-1 relative z-10">
                    Locked
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
