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
    { id: 'Order', icon: Box, label: 'Order', bg: 'bg-[#A34F55]' },
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
    <div className="min-h-full p-4 sm:p-6 lg:p-8 pt-4 sm:pt-6">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Motivation Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-white/15 shadow-lg w-full max-w-[320px] sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto text-center transition-all">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
             <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
             <h3 className="text-[11px] font-bold uppercase tracking-widest text-indigo-200">
               Inspirasi Hari Ini
             </h3>
          </div>
          <p className="text-xs sm:text-sm font-medium italic text-white/95 leading-relaxed">
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

        {/* Main Menu Grid - 2 columns on mobile (HP), flexible multi-column on desktop (komputer) */}
        <div className="flex justify-center mt-2 sm:mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 sm:gap-x-8 md:gap-x-10 gap-y-7 sm:gap-y-8 md:gap-y-9 w-full max-w-[320px] sm:max-w-xl md:max-w-3xl lg:max-w-5xl justify-items-center">
            {menuItems.map((item) => (
              <button
                key={item.id}
                id={`menu-item-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center justify-start gap-2.5 hover:-translate-y-1.5 active:scale-95 transition-all duration-300 group w-full max-w-[120px] focus:outline-none"
              >
                <div className={cn(
                  "w-[92px] h-[92px] sm:w-[100px] sm:h-[100px] md:w-[108px] md:h-[108px] rounded-[22px] flex items-center justify-center shadow-lg shadow-black/15 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl", 
                  item.bg
                )}>
                  <item.icon 
                    className="w-11 h-11 sm:w-12 sm:h-12 md:w-13 md:h-13 text-white" 
                    strokeWidth={1.6} 
                    style={{ filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.25))' }}
                  />
                </div>
                <span className="text-white text-[13px] sm:text-[14px] md:text-[15px] font-normal text-center tracking-normal font-sans drop-shadow-md whitespace-nowrap">
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
