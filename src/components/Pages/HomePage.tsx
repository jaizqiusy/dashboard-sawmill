import React from 'react';
import { 
  LayoutGrid, 
  BarChart3, 
  Trophy, 
  Factory, 
  FileText,
  AlertTriangle, 
  History,
  Sparkles,
  Calendar
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface HomePageProps {
  setActiveTab: (tab: string) => void;
}

export function HomePage({ setActiveTab }: HomePageProps) {
  const menuItems = [
    { id: 'Overview', icon: LayoutGrid, label: 'Overview', desc: 'Ringkasan performa', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { id: 'Analytics', icon: BarChart3, label: 'Analytics', desc: 'Analisis detail', color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
    { id: 'Ranking', icon: Trophy, label: 'Ranking', desc: 'Peringkat mesin', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { id: 'Production', icon: Factory, label: 'Live Prod', desc: 'Produksi realtime', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { id: 'Recap', icon: FileText, label: 'Rekap Data', desc: 'Data historis', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { id: 'Downtime', icon: AlertTriangle, label: 'Downtime', desc: 'Status mesin', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
    { id: 'Plan', icon: Calendar, label: 'Plan', desc: 'Rencana produksi', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
    { id: 'AI', icon: Sparkles, label: 'Laporan AI', desc: 'Analisa cerdas', color: 'text-fuchsia-600', bg: 'bg-fuchsia-50', border: 'border-fuchsia-100' },
    { id: 'History', icon: History, label: 'History', desc: 'Riwayat data', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100' },
  ];

  return (
    <div className="min-h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-5 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Motivation Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-xl">
          <div className="flex justify-between items-center mb-3">
             <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-300 flex items-center gap-2">
               <Sparkles className="w-4 h-4" /> Inspirasi Hari Ini
             </h3>
          </div>
          <p className="text-sm sm:text-base font-medium italic text-slate-100 leading-relaxed">
            "{[
              "Semangat kerja hari ini adalah kunci sukses hari esok.",
              "Setiap batang kayu adalah hasil dari kesabaran dan kerja keras.",
              "Kualitas adalah prioritas utama kita.",
              "Kerja cerdas, kerja tuntas, kerja ikhlas.",
              "Keselamatan kerja adalah tanggung jawab kita bersama.",
              "Berikan yang terbaik di setiap shift, hasil tidak akan mengkhianati.",
              "Tetap fokus, tetap produktif, tetap semangat!",
              "Kedisiplinan adalah jembatan antara cita-cita dan pencapaian.",
              "Jangan pernah berhenti belajar, karena hidup selalu mengajar.",
              "Kebersamaan adalah awal dari kesuksesan yang luar biasa."
            ][new Date().getDate() % 10]}"
          </p>
        </div>

        {/* Main Menu Grid */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-indigo-200 uppercase tracking-widest pl-1">Menu Utama</h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center justify-start gap-2.5 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className={cn("p-4 sm:p-5 bg-white rounded-2xl shadow-xl shadow-black/10 ring-1 ring-white/10 group-hover:shadow-2xl group-hover:scale-105 transition-all duration-300", item.color)}>
                  <item.icon className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2]" />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-indigo-100/90 text-center tracking-wide leading-tight px-1 group-hover:text-white transition-colors">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
