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
    <div className="min-h-[100dvh] max-h-[100dvh] flex flex-col bg-[#6970f0] text-slate-800 font-sans relative overflow-hidden">
      {/* Background Gradients (Softer for light theme) */}
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-white/10 blur-[80px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-white/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[80vw] h-[80vw] rounded-full bg-white/10 blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <header className="px-5 py-5 relative z-10 flex items-center justify-between bg-[#202020] border-b border-[#202020]">
        <div className="flex flex-col">
          <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
            SAWMILL <span className="text-blue-500 italic">PERFORMANCE DASHBOARD</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-1">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center">
          <button className="p-1 text-slate-300 hover:text-white transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 pb-24 custom-scrollbar">
        {children}
      </main>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 pointer-events-none">
        <nav className="pointer-events-auto mx-auto max-w-md bg-white shadow-xl shadow-[#6970f0]/50 rounded-2xl p-2 flex justify-between items-center relative">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="relative flex flex-col items-center justify-center w-[16%] py-2 gap-1 group transition-all"
              >
                {isActive && (
                  <div className="absolute inset-0 bg-blue-50/80 rounded-xl transition-all duration-300" />
                )}
                <item.icon 
                  className={cn(
                    "w-5 h-5 transition-all duration-300 relative z-10",
                    isActive ? "text-blue-600 scale-110" : "text-slate-400 group-hover:text-slate-600 group-hover:-translate-y-0.5"
                  )} 
                />
                <span className={cn(
                  "text-[9px] font-medium transition-colors relative z-10",
                  isActive ? "text-blue-600 font-bold" : "text-slate-400 group-hover:text-slate-600"
                )}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  );
}
