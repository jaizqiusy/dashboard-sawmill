import React from 'react';
import { 
  ArrowLeft
} from 'lucide-react';
import { cn } from '../lib/utils';

interface MobileLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  title: string;
}

export function MobileLayout({ children, activeTab, setActiveTab, title }: MobileLayoutProps) {
  return (
    <div className="min-h-[100dvh] max-h-[100dvh] flex flex-col bg-[#6970f0] text-slate-800 font-sans relative overflow-hidden">
      {/* Background Gradients (Softer for light theme) */}
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-white/10 blur-[80px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-white/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[80vw] h-[80vw] rounded-full bg-white/10 blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <header className="px-5 py-5 relative z-10 flex items-center justify-between bg-[#202020] border-b border-[#202020]">
        <div className="flex items-center gap-3">
          {activeTab !== 'Home' && (
            <button 
              onClick={() => setActiveTab('Home')}
              className="p-1.5 text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg"
            >
               <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex flex-col">
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              SAWMILL <span className="text-blue-500 italic">PERFORMANCE DASHBOARD</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-1">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <button className="p-1 text-slate-300 hover:text-white transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 pb-6 custom-scrollbar">
        {children}
      </main>
    </div>
  );
}
