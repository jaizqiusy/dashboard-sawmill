import React from 'react';
import { 
  LayoutGrid, 
  BarChart3, 
  Trophy, 
  Factory, 
  FileText,
  AlertTriangle, 
  History 
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface HomePageProps {
  setActiveTab: (tab: string) => void;
}

export function HomePage({ setActiveTab }: HomePageProps) {
  const menuItems = [
    { id: 'Overview', icon: LayoutGrid, label: 'Overview', color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-indigo-200' },
    { id: 'Analytics', icon: BarChart3, label: 'Analytics', color: 'text-sky-600', bg: 'bg-sky-100', border: 'border-sky-200' },
    { id: 'Ranking', icon: Trophy, label: 'Ranking', color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200' },
    { id: 'Production', icon: Factory, label: 'Live Prod', color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' },
    { id: 'Recap', icon: FileText, label: 'Rekap Data', color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
    { id: 'Downtime', icon: AlertTriangle, label: 'Downtime', color: 'text-rose-600', bg: 'bg-rose-100', border: 'border-rose-200' },
    { id: 'History', icon: History, label: 'History', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
  ];

  return (
    <div className="p-5 space-y-6">
      {/* Welcome Card */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-lg text-white">
        <h2 className="text-xl font-black tracking-tight mb-1">Selamat Datang!</h2>
        <p className="text-sm text-blue-100 font-medium">Pilih menu di bawah untuk melihat detail data.</p>
      </div>

      {/* Main Menu Grid */}
      <div>
        <h3 className="text-white text-sm font-bold tracking-widest uppercase mb-4 opacity-90 pl-1">Menu Utama</h3>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-3 shadow-md hover:scale-105 transition-transform border border-slate-100"
            >
              <div className={cn("p-3 rounded-xl border", item.bg, item.color, item.border)}>
                <item.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800 text-center">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
