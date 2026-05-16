import React from 'react';
import { Download } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
  machineCount?: number;
  onExport?: () => void;
}

export function Header({ title, subtitle, machineCount, onExport }: HeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-8 px-1" id="main-header">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-slate-500 font-medium mt-1">{subtitle}</p>
      </div>
      <div className="flex items-center gap-6">
        {machineCount !== undefined && (
          <span className="text-slate-500 text-sm font-medium">{machineCount} Mesin</span>
        )}
        <button 
          onClick={onExport}
          className="flex items-center justify-center gap-2 bg-[#4285F4] hover:bg-[#3b78e7] text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 shadow-md shadow-blue-500/20"
        >
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
}

interface TabBarProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  return (
    <div className="flex border-b border-slate-700/50 mb-8 overflow-x-auto no-scrollbar scroll-smooth" id="tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-all relative ${
            activeTab === tab 
              ? 'text-cyan-400' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {tab}
          {activeTab === tab && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-cyan-400 rounded-t-sm shadow-[0_-2px_10px_rgba(34,211,238,0.5)]" />
          )}
        </button>
      ))}
    </div>
  );
}
