import React from 'react';
import { 
  LayoutGrid, 
  BarChart3, 
  Trophy, 
  Factory, 
  AlertTriangle, 
  History,
  Bell,
  UserCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

interface MobileLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  title: string;
}

export function MobileLayout({ children, activeTab, setActiveTab, title }: MobileLayoutProps) {
  const navItems = [
    { id: 'Overview', icon: LayoutGrid, label: 'Overview' },
    { id: 'Analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'Ranking', icon: Trophy, label: 'Ranking' },
    { id: 'Production', icon: Factory, label: 'Production' },
    { id: 'Downtime', icon: AlertTriangle, label: 'Downtime' },
    { id: 'History', icon: History, label: 'History' },
  ];

  return (
    <div className="min-h-[100dvh] max-h-[100dvh] flex flex-col bg-[#022c22] text-emerald-50 font-sans relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-emerald-600/20 blur-[80px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-teal-500/10 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[80vw] h-[80vw] rounded-full bg-green-600/15 blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <header className="px-5 pt-10 pb-4 relative z-10 flex items-center justify-between backdrop-blur-md bg-[#022c22]/60 border-b border-white/5">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
            {title}
          </h1>
          <p className="text-[10px] text-emerald-200/70 font-medium tracking-wider uppercase mt-1">SAWMILL EXECUTIVE DASHBOARD</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 border-2 border-[#022c22]" />
          </button>
          <button className="p-1 rounded-full border-2 border-emerald-400/50 shadow-sm shadow-emerald-500/20 overflow-hidden">
            <UserCircle className="w-7 h-7 text-emerald-200" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 pb-24 custom-scrollbar">
        {children}
      </main>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 pointer-events-none">
        <nav className="pointer-events-auto mx-auto max-w-md bg-[#064e3b]/80 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-2xl p-2 flex justify-between items-center relative">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="relative flex flex-col items-center justify-center w-[16%] py-2 gap-1 group transition-all"
              >
                {isActive && (
                  <div className="absolute inset-0 bg-white/10 rounded-xl transition-all duration-300" />
                )}
                <item.icon 
                  className={cn(
                    "w-5 h-5 transition-all duration-300 relative z-10",
                    isActive ? "text-emerald-400 scale-110 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "text-emerald-400/60 group-hover:text-emerald-200 group-hover:-translate-y-0.5"
                  )} 
                />
                <span className={cn(
                  "text-[9px] font-medium transition-colors relative z-10",
                  isActive ? "text-emerald-400" : "text-emerald-400/60 group-hover:text-emerald-200"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  );
}
