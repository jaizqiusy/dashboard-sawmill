import React from 'react';
import { 
  Gauge, 
  TrendingUp, 
  Trophy, 
  ClipboardCheck, 
  Target, 
  Cylinder, 
  Factory, 
  CirclePercent, 
  CalendarClock, 
  FileBarChart2, 
  ClockAlert, 
  FileClock, 
  IdCard,
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface HomePageProps {
  setActiveTab: (tab: string) => void;
}

export function HomePage({ setActiveTab }: HomePageProps) {
  // Map icons and colors accurately to the provided reference design
  const menuItems = [
    { 
      id: 'Overview', 
      icon: Gauge, 
      label: 'Overview', 
      bg: 'bg-gradient-to-b from-[#05C596] to-[#048E6B]' 
    },
    { 
      id: 'Analytics', 
      icon: TrendingUp, 
      label: 'Analytics', 
      bg: 'bg-gradient-to-b from-[#7642ED] to-[#5123D8]' 
    },
    { 
      id: 'Ranking', 
      icon: Trophy, 
      label: 'Ranking', 
      bg: 'bg-gradient-to-b from-[#F5A623] to-[#DF820B]' 
    },
    { 
      id: 'Order', 
      icon: ClipboardCheck, 
      label: 'Order', 
      bg: 'bg-gradient-to-b from-[#F03D6D] to-[#BD194A]' 
    },
    { 
      id: 'AnalisaOperator', 
      icon: Target, 
      label: 'Analisa Opr', 
      bg: 'bg-gradient-to-b from-[#0EA5E9] to-[#0275B1]' 
    },
    { 
      id: 'Log', 
      icon: Cylinder, 
      label: 'Input Log', 
      bg: 'bg-gradient-to-b from-[#0B8E82] to-[#066158]' 
    },
    { 
      id: 'Production', 
      icon: Factory, 
      label: 'Live Prod', 
      bg: 'bg-gradient-to-b from-[#0BA6AF] to-[#087F86]' 
    },
    { 
      id: 'Performance', 
      icon: CirclePercent, 
      label: 'Performance', 
      bg: 'bg-gradient-to-b from-[#10B981] to-[#05875D]' 
    },
    { 
      id: 'Plan', 
      icon: CalendarClock, 
      label: 'Plan', 
      bg: 'bg-gradient-to-b from-[#5B63EE] to-[#3B42CE]' 
    },
    { 
      id: 'Recap', 
      icon: FileBarChart2, 
      label: 'Rekap Data', 
      bg: 'bg-gradient-to-b from-[#F59E0B] to-[#C97204]' 
    },
    { 
      id: 'Downtime', 
      icon: ClockAlert, 
      label: 'Downtime', 
      bg: 'bg-gradient-to-b from-[#EF4444] to-[#B91C1C]' 
    },
    { 
      id: 'History', 
      icon: FileClock, 
      label: 'History', 
      bg: 'bg-gradient-to-b from-[#3B82F6] to-[#1D4ED8]' 
    },
    { 
      id: 'OperatorProfile', 
      icon: IdCard, 
      label: 'Operator', 
      bg: 'bg-gradient-to-b from-[#8B5CF6] to-[#6324D6]' 
    },
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

        {/* Main Menu Grid - 4 columns on mobile (HP), flexible multi-column on desktop (komputer) */}
        <div className="flex justify-center mt-2 sm:mt-4">
          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-2 sm:gap-x-6 md:gap-x-8 gap-y-3.5 sm:gap-y-6 md:gap-y-8 w-full max-w-[380px] sm:max-w-xl md:max-w-3xl lg:max-w-5xl justify-items-center">
            {menuItems.map((item) => (
              <button
                key={item.id}
                id={`menu-item-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center justify-start gap-1.5 sm:gap-2 hover:-translate-y-1 active:scale-95 transition-all duration-300 group w-full max-w-[78px] sm:max-w-[100px] focus:outline-none"
              >
                <div className={cn(
                  "w-[66px] h-[66px] sm:w-[86px] sm:h-[86px] md:w-[96px] md:h-[96px] rounded-[19px] sm:rounded-[24px] flex items-center justify-center shadow-lg shadow-black/20 border-t border-white/25 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl relative overflow-hidden", 
                  item.bg
                )}>
                  {/* Subtle top-gloss sheen */}
                  <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-[19px] sm:rounded-t-[24px]" />
                  
                  <item.icon 
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 text-white relative z-10" 
                    strokeWidth={1.9} 
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}
                  />
                </div>
                <span className="text-white text-[11px] sm:text-[13px] md:text-[14px] font-medium text-center tracking-tight sm:tracking-normal font-sans drop-shadow-md leading-tight line-clamp-1 sm:line-clamp-none max-w-full">
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
