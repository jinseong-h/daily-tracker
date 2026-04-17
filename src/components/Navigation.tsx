import { Clock, Calendar, BarChart3, Settings } from 'lucide-react';
import { cn } from '../utils/cn';

export function Navigation({ activeTab, onChange, vertical = false }: { activeTab: string; onChange: (tab: string) => void; vertical?: boolean }) {
  const tabs = [
    { id: 'tracker', icon: Clock, label: '트래커' },
    { id: 'calendar', icon: Calendar, label: '캘린더' },
    { id: 'statistics', icon: BarChart3, label: '통계' },
    { id: 'settings', icon: Settings, label: '설정' }
  ];

  if (vertical) {
    return (
      <nav className="flex flex-col gap-2 px-4 w-full">
        {tabs.map(tab => (
          <button
            key={`v-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-semibold text-sm",
              activeTab === tab.id ? "bg-primary/10 text-primary shadow-sm" : "text-neutral-500 hover:bg-neutral-100 hover:text-darkText"
            )}
          >
            <tab.icon size={20} />
            {tab.label}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <nav className="sticky bottom-0 w-full z-50 bg-white/90 backdrop-blur-md border-t border-neutral-200 pt-4 px-6 pb-8 mt-auto">
      <div className="flex justify-between items-center w-full">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 p-2 rounded-2xl min-w-[72px] transition-all duration-300",
              activeTab === tab.id 
                ? "text-primary bg-primary/10 shadow-sm" 
                : "text-neutral-400 hover:text-neutral-600"
            )}
          >
            <tab.icon size={24} />
            <span className="text-[10px] font-semibold tracking-wide">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
