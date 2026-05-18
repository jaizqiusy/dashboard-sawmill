import React from 'react';
import { 
  LayoutGrid, 
  BarChart3, 
  Trophy, 
  Factory, 
  FileText,
  AlertTriangle, 
  History,
  Sparkles
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
    { id: 'AI', icon: Sparkles, label: 'Laporan AI', color: 'text-fuchsia-600', bg: 'bg-fuchsia-100', border: 'border-fuchsia-200' },
    { id: 'History', icon: History, label: 'History', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
  ];

  return (
    <div className="p-5 space-y-6">
      {/* Welcome Card */}
      <div className="bg-slate-50 rounded-2xl p-4 shadow-sm border border-slate-200 text-slate-900">
        <h2 className="text-xl font-black tracking-tight">Selamat Datang!</h2>
        
        {/* Daily Quote */}
        <div className="mt-3 pt-3 border-t border-slate-200">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Motivasi Hari Ini
          </p>
          <p className="text-xs font-bold italic text-slate-800 leading-relaxed">
            "{[
              "Semangat kerja hari ini adalah kunci sukses hari esok.",
              "Setiap batang kayu adalah hasil dari kesabaran dan kerja keras.",
              "Kualitas adalah prioritas utama kita.",
              "Kerja cerdas, kerja tuntas, kerja ikhlas.",
              "Keselamatan kerja adalah tanggung jawab kita bersama.",
              "Berikan yang terbaik di setiap shift, hasil tidak akan mengkhianati usaha.",
              "Tetap fokus, tetap produktif, tetap semangat!",
              "Kedisiplinan adalah jembatan antara cita-cita dan pencapaian.",
              "Jangan pernah berhenti belajar, karena hidup tidak pernah berhenti mengajar.",
              "Kebersamaan adalah awal dari kesuksesan yang luar biasa."
            ][new Date().getDate() % 10]}"
          </p>
        </div>
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
