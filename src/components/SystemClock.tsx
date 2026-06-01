import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function SystemClock() {
  const [chileTime, setChileTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('es-CL', {
        timeZone: 'America/Santiago',
        dateStyle: 'medium',
        timeStyle: 'medium'
      });
      setChileTime(formatter.format(now));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-800/80 dark:bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-700/50 dark:border-slate-800 flex items-center gap-2 text-sm text-slate-350 dark:text-slate-400">
      <Clock className="w-4 h-4 text-emerald-400 animate-pulse" aria-hidden="true" />
      <div 
        className="font-mono text-xs sm:text-sm font-semibold tracking-wide text-slate-200 dark:text-slate-300" 
        id="chile-clock"
        aria-live="polite"
      >
        {chileTime || 'Cargando reloj...'}
      </div>
    </div>
  );
}
