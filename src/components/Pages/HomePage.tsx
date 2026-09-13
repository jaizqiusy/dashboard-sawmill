import React, { useState } from 'react';
import { Package, 
  LayoutGrid, 
  BarChart3, 
  Trophy, 
  Factory, 
  FileText,
  AlertTriangle, 
  History,
  Sparkles,
  Calendar,
  Users,
  Activity,
  MessageCircle,
  BookUser,
  LineChart,
  CircleDollarSign,
  Box,
  Wrench,
  Gauge,
  Settings
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface HomePageProps {
  setActiveTab: (tab: string) => void;
}

export function HomePage({ setActiveTab }: HomePageProps) {
  // Map to the requested colors/icons based on the image style
  const menuItems = [
    { id: 'Overview', icon: Gauge, label: 'Overview', bg: 'bg-[#D16474]' },
    { id: 'Analytics', icon: LineChart, label: 'Analytics', bg: 'bg-[#DA8E56]' },
    { id: 'Ranking', icon: Trophy, label: 'Ranking', bg: 'bg-[#676767]' },
    { id: 'Order', icon: Package, label: 'Order', bg: 'bg-[#A34F55]' },
    { id: 'AnalisaOperator', icon: BookUser, label: 'Analisa Opr', bg: 'bg-[#2D867D]' },
    { id: 'Log', icon: MessageCircle, label: 'Input Log', bg: 'bg-[#CF6078]' },
    { id: 'Production', icon: Settings, label: 'Live Prod', bg: 'bg-[#72B538]' },
    { id: 'Performance', icon: Activity, label: 'Performance', bg: 'bg-[#DA8E56]' },
    { id: 'Plan', icon: Calendar, label: 'Plan', bg: 'bg-[#DA8E56]' },
    { id: 'Recap', icon: FileText, label: 'Rekap Data', bg: 'bg-[#2D867D]' },
    { id: 'Downtime', icon: Wrench, label: 'Downtime', bg: 'bg-[#676767]' },
    { id: 'History', icon: History, label: 'History', bg: 'bg-[#A34F55]' },
    { id: 'OperatorProfile', icon: Users, label: 'Operator', bg: 'bg-[#2D867D]' },
  ];

  return (
    <div className="min-h-full p-5 sm:p-6 lg:p-8 pt-8">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Motivation Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 sm:p-3 border border-white/10 shadow-xl w-[90%] sm:w-1/2 mx-auto">
          <div className="flex justify-between items-center mb-1.5">
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 flex items-center gap-1.5">
               <Sparkles className="w-3 h-3" /> Inspirasi Hari Ini
             </h3>
          </div>
          <p className="text-xs font-medium italic text-slate-100 leading-relaxed">
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
        <div className="flex justify-center mt-6">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-8 max-w-4xl">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center justify-start gap-2 hover:-translate-y-1 transition-all duration-300 group w-[90px] sm:w-[100px]"
              >
                <div className={cn(
                  "w-[75px] h-[75px] sm:w-[85px] sm:h-[85px] rounded-[14px] flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-105", 
                  item.bg
                )}>
                  <item.icon 
                    className="w-10 h-10 sm:w-11 sm:h-11 text-white" 
                    strokeWidth={1.5} 
                    style={{ filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.3))' }}
                  />
                </div>
                <span className="text-white text-[13px] sm:text-[14px] font-normal text-center tracking-normal font-sans drop-shadow-md">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
