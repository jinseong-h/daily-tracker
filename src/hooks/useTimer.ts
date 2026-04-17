import { useState, useEffect } from 'react';

export function useTimer(startTime: string | null | undefined) {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    if (!startTime) {
      setElapsed('00:00:00');
      return;
    }

    const updateTimer = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const ms = Math.max(0, now - start);
      
      const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
      const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
      
      setElapsed(`${h}:${m}:${s}`);
    };

    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return elapsed;
}
