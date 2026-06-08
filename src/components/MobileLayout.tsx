import React from 'react';
import { 
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';

interface MobileLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  title: string;
  user: any;
  firebaseConnected: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

export function MobileLayout({ 
  children, 
  activeTab, 
  setActiveTab, 
  title,
  user,
  firebaseConnected,
  onLogin,
  onLogout
}: MobileLayoutProps) {
  const isHome = activeTab === 'Home';
  
  return (
    <div className={cn(
      "min-h-[100dvh] max-h-[100dvh] flex flex-col text-slate-800 font-sans relative overflow-hidden transition-colors duration-300",
      isHome ? "bg-gradient-to-br from-emerald-600 via-purple-600 to-indigo-900" : "bg-[#6970f0]"
    )}>
      {/* Background Gradients (Softer for light theme) */}
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-white/10 blur-[80px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-white/5 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[80vw] h-[80vw] rounded-full bg-white/10 blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <header className="px-5 py-5 relative z-20 flex items-center justify-between bg-[#202020] border-b border-[#202020]">
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
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
              SAWMILL <span className="text-blue-500 italic text-[14px]">PERFORMANCE</span>
              <span 
                className={cn(
                  "w-2 h-2 rounded-full inline-block",
                  firebaseConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                )} 
                title={firebaseConnected ? "Firebase Cloud Terhubung" : "Firebase Cloud Terputus"} 
              />
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[9px] text-white/60 font-bold tracking-widest uppercase">
                {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
              <div className="w-1 h-1 bg-white/20 rounded-full" />
              {user ? (
                <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                  {user.photoURL && <img src={user.photoURL} alt={user.displayName || 'User'} className="w-3.5 h-3.5 rounded-full border border-white/20" referrerPolicy="no-referrer" />}
                  <span className="text-[9px] text-white/80 font-bold max-w-[60px] truncate">{user.displayName?.split(' ')[0]}</span>
                  <button onClick={onLogout} className="text-[8px] text-rose-400 hover:text-rose-300 font-extrabold uppercase ml-1">Keluar</button>
                </div>
              ) : (
                <button onClick={onLogin} className="text-[9px] bg-indigo-600/50 hover:bg-indigo-600/70 text-white/90 border border-indigo-500/30 px-2 py-0.5 rounded-lg font-bold flex items-center gap-1 transition-all">
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Floating AI Report Button - Absolute position as requested */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <button 
            onClick={() => setActiveTab('AI')}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl transition-all active:scale-95 shadow-lg",
              activeTab === 'AI' 
                ? "bg-white text-indigo-600 shadow-white/10" 
                : "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-indigo-500/20 border border-indigo-400/30"
            )}
          >
            <Sparkles className={cn("w-3.5 h-3.5", activeTab === 'AI' ? "animate-pulse" : "")} />
            <span className="text-[9px] font-black uppercase tracking-wider">Laporan AI</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain relative z-10 pb-6 custom-scrollbar [-webkit-overflow-scrolling:touch] will-change-scroll transform-gpu">
        {children}
      </main>
    </div>
  );
}
