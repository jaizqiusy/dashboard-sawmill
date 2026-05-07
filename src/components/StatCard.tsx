import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  iconBgColor?: string;
  className?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, iconBgColor = 'bg-blue-500/10', className }: StatCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      id={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
      className={cn("bg-white border border-slate-200 p-6 rounded-xl flex items-center gap-5 shadow-sm", className)}
    >
      <div className={cn("flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center bg-white", iconBgColor.replace('bg-', 'text-'))}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex flex-col">
        <div className="text-3xl font-bold text-slate-900 leading-tight">
          {value}
        </div>
        <div className="text-sm font-bold text-slate-900 mt-0.5">
          {title}
        </div>
        <div className="text-xs text-slate-500 mt-0.5 font-medium uppercase tracking-wide">
          {subtitle}
        </div>
      </div>
    </motion.div>
  );
}
