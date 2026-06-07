import React, { useState, useEffect } from 'react';
import { 
  User, 
  Clock, 
  Calendar, 
  Trophy, 
  Percent, 
  Activity, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Upload, 
  Sparkles, 
  CheckCircle,
  TrendingUp,
  Award,
  Maximize2,
  X,
  Gauge
} from 'lucide-react';
import { cn, getApiUrl } from '../../lib/utils';
import { normalizeMachineName } from '../../services/dataService';

export const OPERATOR_DETAILS: Record<string, { name: string; tenure: string; joinDate: string; specialty: string }> = {
  'BS 1': { name: 'Ahmad Khudlori', tenure: '8 Tahun', joinDate: '12 Mei 2018', specialty: 'Rendemen Optimal & Log Lokal' },
  'BS 2': { name: 'Marjono', tenure: '6 Tahun', joinDate: '04 Agustus 2020', specialty: 'Presisi Ukuran & Log Utama' },
  'BS 3': { name: 'Hartono', tenure: '7 Tahun', joinDate: '19 September 2019', specialty: 'Sawmill Kecepatan Tinggi & Log Turunan' },
  'BS 4': { name: 'Saenurrodin', tenure: '5 Tahun', joinDate: '02 Februari 2021', specialty: 'Sortasi Efisien & Bebas Downtime' },
  'BS 5': { name: 'Subur', tenure: '4 Tahun', joinDate: '11 November 2022', specialty: 'Volume Output Konsisten' },
  'BS 6': { name: 'Supardi', tenure: '9 Tahun', joinDate: '15 Maret 2017', specialty: 'Spesialis Log Diameter Besar (Utama)' },
  'BS 7': { name: 'Supariyo', tenure: '3 Tahun', joinDate: '08 Oktober 2023', specialty: 'Penanganan Aliran Kerja & Log Lokal' },
  'BS 8': { name: 'Sukono', tenure: '5 Tahun', joinDate: '30 Juni 2021', specialty: 'Pemulihan Serat & Optimasi Turunan' }
};

// Premium SVG avatar generator for fallback display
const getDefaultSvgAvatar = (mesin: string, name: string) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || mesin;
    
  const key = mesin.trim().toUpperCase();
  const gradientColors = {
    'BS 1': { from: '#f59e0b', to: '#d97706', text: '#ffffff' }, // Amber/Golden Ring
    'BS 2': { from: '#06b6d4', to: '#0891b2', text: '#ffffff' }, // Cyan
    'BS 3': { from: '#10b981', to: '#059669', text: '#ffffff' }, // Emerald
    'BS 4': { from: '#6366f1', to: '#4f46e5', text: '#ffffff' }, // Indigo
    'BS 5': { from: '#8b5cf6', to: '#7c3aed', text: '#ffffff' }, // Purple
    'BS 6': { from: '#ec4899', to: '#d946ef', text: '#ffffff' }, // Fuchsia
    'BS 7': { from: '#3b82f6', to: '#2563eb', text: '#ffffff' }, // Blue
    'BS 8': { from: '#f97316', to: '#ea580c', text: '#ffffff' }  // Orange
  }[key] || { from: '#64748b', to: '#475569', text: '#ffffff' };

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <linearGradient id="profile-grad-${key.replace(/\s+/g, '-')}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${gradientColors.from};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${gradientColors.to};stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#profile-grad-${key.replace(/\s+/g, '-')})" />
      <text x="50%" y="45%" text-anchor="middle" fill="${gradientColors.text}" font-family="'Inter', system-ui, sans-serif" font-weight="800" font-size="36" dy=".3em">${initials}</text>
      <rect x="25" y="80" width="70" height="18" rx="9" fill="rgba(0,0,0,0.3)" />
      <text x="50%" y="89%" text-anchor="middle" fill="rgba(255,255,255,0.95)" font-family="'JetBrains Mono', monospace" font-weight="900" font-size="10" dy=".3em">${mesin}</text>
    </svg>
  `.trim().replace(/\s+/g, ' ');

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export function OperatorProfilePage({ data }: { data: any[] }) {
  const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
  const [customAvatars, setCustomAvatars] = useState<Record<string, string>>({});
  const [avatarLocks, setAvatarLocks] = useState<Record<string, boolean>>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Sync state with server database on mount
  useEffect(() => {
    // 1. Fetch images
    fetch(getApiUrl('/api/avatars'))
      .then(res => res.json())
      .then(serverAvatars => {
        if (serverAvatars && typeof serverAvatars === 'object') {
          setCustomAvatars(prev => {
            const combined = { ...prev, ...serverAvatars };
            try {
              localStorage.setItem('operator_avatars', JSON.stringify(combined));
            } catch (e) {
              console.warn("Storage quota full, keeping in-memory", e);
            }
            return combined;
          });
        }
      })
      .catch(err => console.error("Error loading custom avatars:", err));

    // 2. Fetch locks
    fetch(getApiUrl('/api/avatar-locks'))
      .then(res => res.json())
      .then(serverLocks => {
        if (serverLocks && typeof serverLocks === 'object') {
          setAvatarLocks(prev => {
            const combined = { ...prev, ...serverLocks };
            try {
              localStorage.setItem('operator_avatar_locks', JSON.stringify(combined));
            } catch (e) {
              console.warn("Storage quota full, locking in-memory", e);
            }
            return combined;
          });
        }
      })
      .catch(err => console.error("Error loading photo locks:", err));
  }, []);

  // Handle Photo Upload with Auto-Lock (kunci setelah di unggah foto nya)
  const handleAvatarUpload = (mesin: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 250; 
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL('image/jpeg', 0.85);
          
          // Save locally
          const updatedAvatars = { ...customAvatars, [mesin]: base64 };
          setCustomAvatars(updatedAvatars);
          try {
            localStorage.setItem('operator_avatars', JSON.stringify(updatedAvatars));
          } catch (e) {
            console.warn("Local storage full", e);
          }

          // Auto-Lock after upload
          const updatedLocks = { ...avatarLocks, [mesin]: true };
          setAvatarLocks(updatedLocks);
          try {
            localStorage.setItem('operator_avatar_locks', JSON.stringify(updatedLocks));
          } catch (e) {
            console.warn("Local storage locks issue", e);
          }

          // Synchronize image to server
          fetch(getApiUrl('/api/avatars'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mesin, imageBase64: base64 })
          })
          .then(res => res.json())
          .then(reply => {
            if (reply.success) {
              // Synchronize lock status to server as well
              return fetch(getApiUrl('/api/avatar-locks'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mesin, locked: true })
              });
            }
          })
          .then(lockReply => {
            if (lockReply) return lockReply.json();
          })
          .then(() => {
            setSaveSuccessMsg(`Foto operator ${mesin} berhasil diunggah & otomatis dikunci!`);
            setTimeout(() => setSaveSuccessMsg(null), 4000);
          })
          .catch(err => console.error("Error saving to server:", err));
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Toggle lock state
  const toggleLock = (mesin: string) => {
    const isCurrentlyLocked = !!avatarLocks[mesin];
    const newLockedState = !isCurrentlyLocked;
    
    const updated = { ...avatarLocks, [mesin]: newLockedState };
    setAvatarLocks(updated);
    try {
      localStorage.setItem('operator_avatar_locks', JSON.stringify(updated));
    } catch (e) {
      console.warn("Local storage write error", e);
    }

    // Save to server database
    fetch(getApiUrl('/api/avatar-locks'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mesin, locked: newLockedState })
    })
    .then(res => res.json())
    .then(payload => {
      if (payload.success) {
        console.log(`Lock status synchronized successfully for ${mesin}`);
      }
    })
    .catch(err => console.error("Server synchronization error for lock status:", err));
  };

  // Helper to fallback to standard illustration
  const handleImageError = (e: any) => {
    e.target.onerror = null; 
    e.target.style.display = 'none';
    const parent = e.target.parentElement;
    if (parent) {
      const fallback = parent.querySelector('.fallback-icon');
      if (fallback) fallback.style.display = 'block';
    }
  };

  const getAvatarImage = (mesin: string) => {
    if (customAvatars[mesin]) return customAvatars[mesin];
    const name = OPERATOR_DETAILS[mesin]?.name || mesin;
    return getDefaultSvgAvatar(mesin, name);
  };

  // Dynamic Metrics Engine
  const computedMetrics = React.useMemo(() => {
    const metrics: Record<string, { totalVolume: number; avgYield: number; activeDays: number; orderCount: number }> = {};
    
    // Seed initial structures
    Object.keys(OPERATOR_DETAILS).forEach(mesin => {
      metrics[mesin] = { totalVolume: 0, avgYield: 0, activeDays: 0, orderCount: 0 };
    });

    // Compute logs
    if (data && Array.isArray(data)) {
      const uniqueDays: Record<string, Set<string>> = {};
      const yieldSums: Record<string, number> = {};
      const yieldCounts: Record<string, number> = {};

      data.forEach(d => {
        if (!d.mesin || d.input <= 0) return;
        const normalized = normalizeMachineName(d.mesin);
        if (!OPERATOR_DETAILS[normalized]) return;

        // Cumulative totals
        metrics[normalized].totalVolume += (d.total || 0);
        metrics[normalized].orderCount += 1;

        // Yield tracking
        const currentYield = d.input > 0 ? (d.total / d.input) : 0;
        yieldSums[normalized] = (yieldSums[normalized] || 0) + currentYield;
        yieldCounts[normalized] = (yieldCounts[normalized] || 0) + 1;

        // Days counting
        if (d.tanggal) {
          if (!uniqueDays[normalized]) {
            uniqueDays[normalized] = new Set();
          }
          uniqueDays[normalized].add(d.tanggal);
        }
      });

      // Assemble final values
      Object.keys(OPERATOR_DETAILS).forEach(mesin => {
        const count = yieldCounts[mesin] || 1;
        metrics[mesin].avgYield = ((yieldSums[mesin] || 0) / count) * 100;
        metrics[mesin].activeDays = uniqueDays[mesin]?.size || 0;
      });
    }

    return metrics;
  }, [data]);

  return (
    <div className="p-4 sm:p-5 max-w-4xl mx-auto space-y-6">
      
      {/* Page Title Card */}
      <div className="bg-gradient-to-r from-slate-900 to-[#1e293b] text-white rounded-3xl p-6 shadow-xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -ml-24 -mb-24" />
        
        <div className="flex gap-4 items-center relative z-10">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg ring-4 ring-indigo-500/20 text-white">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              Profil Operator BS
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </h2>
            <p className="text-xs text-slate-300 font-medium leading-relaxed mt-1">
              Direktori resmi, status foto, dan pencapaian historis personil sawmill
            </p>
          </div>
        </div>
      </div>

      {/* Upload/Locked Toast Alert */}
      {saveSuccessMsg && (
        <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-100 rounded-2xl p-4 flex gap-3 items-center shadow-lg transition-all animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="text-xs font-bold leading-snug">{saveSuccessMsg}</p>
        </div>
      )}

      {/* Grid of cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {Object.entries(OPERATOR_DETAILS).map(([mesin, profile]) => {
          const stats = computedMetrics[mesin];
          const isPhotoLocked = !!avatarLocks[mesin];
          const hasPhotoUploaded = !!customAvatars[mesin];

          const colorScheme = {
            'BS 1': { bg: 'bg-amber-50 border-amber-200/50', accent: 'text-amber-700 bg-amber-100/50', ring: 'ring-amber-500/20' },
            'BS 2': { bg: 'bg-cyan-50 border-cyan-200/50', accent: 'text-cyan-700 bg-cyan-100/50', ring: 'ring-cyan-500/20' },
            'BS 3': { bg: 'bg-emerald-50 border-emerald-200/50', accent: 'text-emerald-700 bg-emerald-100/50', ring: 'ring-emerald-500/20' },
            'BS 4': { bg: 'bg-indigo-50 border-indigo-200/50', accent: 'text-indigo-700 bg-indigo-100/50', ring: 'ring-indigo-500/20' },
            'BS 5': { bg: 'bg-purple-50 border-purple-200/50', accent: 'text-purple-700 bg-purple-100/50', ring: 'ring-purple-500/20' },
            'BS 6': { bg: 'bg-rose-50 border-rose-200/50', accent: 'text-rose-700 bg-rose-100/50', ring: 'ring-rose-500/20' },
            'BS 7': { bg: 'bg-sky-50 border-sky-200/50', accent: 'text-sky-700 bg-sky-100/50', ring: 'ring-sky-500/20' },
            'BS 8': { bg: 'bg-orange-50 border-orange-200/50', accent: 'text-orange-700 bg-orange-100/50', ring: 'ring-orange-500/20' },
          }[mesin] || { bg: 'bg-slate-50 border-slate-200/50', accent: 'text-slate-700 bg-slate-100/50', ring: 'ring-slate-500/20' };

          return (
            <div 
              key={mesin}
              className={cn(
                "rounded-3xl p-5 border shadow-sm transition-all duration-300 relative overflow-hidden flex flex-col justify-between group bg-white",
                "hover:-translate-y-1 hover:shadow-md"
              )}
            >
              {/* Operator Header */}
              <div className="flex gap-4 items-start">
                {/* Photo frame */}
                <div className="relative">
                  <div className={cn(
                    "w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-slate-800 flex items-center justify-center relative shadow-sm ring-4-no border border-white",
                    colorScheme.ring
                  )}>
                    <img 
                      src={getAvatarImage(mesin)} 
                      alt={profile.name} 
                      className="w-full h-full object-cover object-center transition-transform group-hover:scale-105" 
                      onError={handleImageError}
                    />
                    <div className="absolute inset-0 bg-black/10 transition-opacity opacity-0 group-hover:opacity-100 pointer-events-none" />
                  </div>
                  
                  {/* Photo Edit Lock Indicator (kunci setelah di unggah foto nya) */}
                  <button
                    onClick={() => toggleLock(mesin)}
                    className={cn(
                      "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md transition-all active:scale-90 border",
                      isPhotoLocked 
                        ? "bg-slate-900 border-slate-700 text-amber-400" 
                        : "bg-white border-slate-200 text-slate-500 hover:text-slate-900"
                    )}
                    title={isPhotoLocked ? "Foto Terkunci. Klik untuk Buka Kunci." : "Foto Terbuka. Klik untuk Kunci."}
                  >
                    {isPhotoLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Name / Casing */}
                <div className="flex-1 min-w-0">
                  <div className="flex gap-2 items-center">
                    <span className={cn("text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full leading-relaxed", colorScheme.accent)}>
                      {mesin}
                    </span>
                    {isPhotoLocked && (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-1 border border-amber-200/55 shadow-xs">
                        <Lock className="w-2.5 h-2.5" /> Locked
                      </span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-[#0f172a] text-md mt-1.5 tracking-tight group-hover:text-indigo-600 transition-colors leading-snug">
                    {profile.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 mt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Masa Kerja: <span className="text-slate-800 font-bold">{profile.tenure}</span>
                  </p>
                </div>
              </div>

              {/* Dynamic stats row */}
              <div className="mt-5 grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100/50">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Percent className="w-2.5 h-2.5" /> Avg Yield
                  </span>
                  <span className="text-slate-800 font-extrabold text-sm ml-3.5 mt-0.5">
                    {stats.avgYield > 0 ? `${stats.avgYield.toFixed(1)}%` : '--'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp className="w-2.5 h-2.5" /> Volume
                  </span>
                  <span className="text-slate-800 font-extrabold text-sm ml-3.5 mt-0.5">
                    {stats.totalVolume > 0 ? `${stats.totalVolume.toLocaleString('id-ID', { maximumFractionDigits: 1 })} M³` : '0 M³'}
                  </span>
                </div>
              </div>

              {/* Action layout */}
              <div className="mt-4 flex gap-2 items-center justify-between border-t border-slate-100 pt-3.5">
                <div className="text-[10px] text-slate-500 font-semibold">
                  Mulai: {profile.joinDate}
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedOperator(mesin)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all active:scale-95"
                    title="Lihat Detail Profil Bento"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  
                  {/* Photo Upload triggers only if unlocked (or if locked they must unlock it first) */}
                  <label className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-xs",
                    isPhotoLocked 
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" 
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  )}>
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onClick={(e) => {
                        if (isPhotoLocked) {
                          e.preventDefault();
                          alert(`Silakan aktifkan toggle kunci gembok (Unlock) di profil ${mesin} untuk mengganti foto operator.`);
                        }
                      }}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleAvatarUpload(mesin, e.target.files[0]);
                        }
                      }} 
                    />
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Operator Bento Detailed Sheet (Modal) */}
      {selectedOperator && (() => {
        const profile = OPERATOR_DETAILS[selectedOperator];
        const stats = computedMetrics[selectedOperator];
        const isPhotoLocked = !!avatarLocks[selectedOperator];

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-all"
            onClick={() => setSelectedOperator(null)}
          >
            <div 
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transform scale-100 opacity-100 transition-all duration-300 border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Banner Header */}
              <div className="flex justify-between items-center px-6 py-4.5 bg-slate-50 border-b border-slate-100 relative">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-extrabold text-[#0f172a] text-md">Bento Analisis Operator ({selectedOperator})</h2>
                </div>
                <button 
                  onClick={() => setSelectedOperator(null)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Bento Content */}
              <div className="p-6 space-y-5">
                {/* Visual Avatar Card bento */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
                  
                  {/* Photo frame */}
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden shadow-md ring-4 ring-indigo-500/10 border border-white">
                      <img 
                        src={getAvatarImage(selectedOperator)} 
                        alt={profile.name} 
                        className="w-full h-full object-cover object-center" 
                        onError={handleImageError}
                      />
                    </div>
                    {/* Visual Padlock lock */}
                    {isPhotoLocked && (
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center shadow-md">
                        <Lock className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-black text-slate-900 mt-4 leading-tight">{profile.name}</h3>
                  <p className="text-xs text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full mt-1 border border-indigo-150">
                    Masa Kerja: {profile.tenure} ({profile.joinDate})
                  </p>
                </div>

                {/* Grid metrics blocks */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-indigo-500" /> Rendemen
                    </span>
                    <div className="mt-2 text-lg font-black text-slate-800">
                      {stats.avgYield > 0 ? `${stats.avgYield.toFixed(1)}%` : '--'}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-none mt-1">Efisiensi output material</div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Volume
                    </span>
                    <div className="mt-2 text-lg font-black text-slate-800">
                      {stats.totalVolume > 0 ? `${stats.totalVolume.toLocaleString('id-ID', { maximumFractionDigits: 1 })} M³` : '0 M³'}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-none mt-1">Total produk bersih</div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-cyan-500" /> Hari Aktif
                    </span>
                    <div className="mt-2 text-lg font-black text-slate-800">
                      {stats.activeDays} Hari
                    </div>
                    <div className="text-[10px] text-slate-400 leading-none mt-1">Kehadiran operasional</div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-orange-500" /> Entri Data
                    </span>
                    <div className="mt-2 text-lg font-black text-slate-800">
                      {stats.orderCount} Entri
                    </div>
                    <div className="text-[10px] text-slate-400 leading-none mt-1">Frekuensi input logs</div>
                  </div>
                </div>

                {/* Signature specialty list */}
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3">
                  <Award className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">Fokus & Spesialisasi</h4>
                    <p className="text-xs text-indigo-800 leading-relaxed mt-1 font-semibold">{profile.specialty}</p>
                  </div>
                </div>

                {/* Locked info panel */}
                <div className="flex gap-4 items-center justify-between border-t border-slate-100 pt-4.5">
                  <div className="flex items-center gap-2">
                    {isPhotoLocked ? (
                      <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
                        <Lock className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="p-1.5 bg-slate-100 text-slate-500 rounded-lg border border-slate-200">
                        <Unlock className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide leading-none">Keamanan Data Foto</h4>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {isPhotoLocked ? "Modifikasi unggahan dikunci" : "Terbuka - siap diubah/unggah"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleLock(selectedOperator)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all",
                      isPhotoLocked 
                        ? "bg-slate-900 text-white" 
                        : "bg-amber-100 hover:bg-amber-100/80 text-amber-800 border border-amber-250"
                    )}
                  >
                    {isPhotoLocked ? "Buka Gembok" : "Kunci Sekarang"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
