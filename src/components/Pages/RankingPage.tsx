import React, { useState } from 'react';
import { Trophy, Crown, X, ZoomIn, User, Lock, Unlock, Upload } from 'lucide-react';
import { cn, getApiUrl } from '../../lib/utils';
import { getAvailablePeriods, getMachineRankings } from '../../services/dataService';
import { BsAchievementUpdate } from './BsAchievementUpdate';
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';

// Premium SVG avatar generator for operators
const getDefaultSvgAvatar = (mesin: string, name: string) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || mesin;
    
  // Custom design-centric gradients matching the machine/operator index
  const key = mesin.trim().toUpperCase();
  let gradientColors = {
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
        <linearGradient id="grad-${key.replace(/\s+/g, '-')}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${gradientColors.from};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${gradientColors.to};stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#grad-${key.replace(/\s+/g, '-')})" />
      <text x="50%" y="45%" text-anchor="middle" fill="${gradientColors.text}" font-family="'Inter', system-ui, sans-serif" font-weight="800" font-size="36" dy=".3em">${initials}</text>
      
      <!-- Styled machine label badge for precision -->
      <rect x="25" y="80" width="70" height="18" rx="9" fill="rgba(0,0,0,0.3)" />
      <text x="50%" y="89%" text-anchor="middle" fill="rgba(255,255,255,0.95)" font-family="'JetBrains Mono', monospace" font-weight="900" font-size="10" dy=".3em">${mesin}</text>
    </svg>
  `.trim().replace(/\s+/g, ' ');

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export function RankingPage({ data, operatorData }: { data: any[], operatorData?: any[] }) {
  const [activeSubTab, setActiveSubTab] = useState<'ranks' | 'realtime'>('ranks');
  const [periodType, setPeriodType] = useState('monthly');
  const periods = getAvailablePeriods(data);
  const [periodValue, setPeriodValue] = useState(periods.months[0] || 0);
  const [selectedOperator, setSelectedOperator] = useState<any>(null);

  const [customAvatars, setCustomAvatars] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('operator_avatars');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [avatarLocks, setAvatarLocks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('operator_avatar_locks');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Load custom avatars and locks from server on mount for cross-device persistence
  React.useEffect(() => {
    let loadedFromFirestore = false;

    // 1. Subscribe to real-time Firestore database updates first
    const unsubscribe = onSnapshot(collection(db, 'operators'), (snapshot) => {
      loadedFromFirestore = true;
      const serverAvatars: Record<string, string> = {};
      const serverLocks: Record<string, boolean> = {};
      
      snapshot.forEach((docSnapshot) => {
        const item = docSnapshot.data();
        if (item.mesin) {
          if (item.avatar) serverAvatars[item.mesin] = item.avatar;
          serverLocks[item.mesin] = !!item.locked;
        }
      });
      
      if (Object.keys(serverAvatars).length > 0) {
        setCustomAvatars(prev => {
          const combined = { ...prev, ...serverAvatars };
          try {
            localStorage.setItem('operator_avatars', JSON.stringify(combined));
          } catch (e) {
            console.warn("Storage quota full", e);
          }
          return combined;
        });
      }
      
      if (Object.keys(serverLocks).length > 0) {
        setAvatarLocks(prev => {
          const combined = { ...prev, ...serverLocks };
          try {
            localStorage.setItem('operator_avatar_locks', JSON.stringify(combined));
          } catch (e) {
            console.warn("Storage quota full", e);
          }
          return combined;
        });
      }
    }, (error) => {
      console.warn("Firestore onSnapshot error, fallback active:", error);
      fetchFallbackREST();
    });

    const fetchFallbackREST = () => {
      // 2. Fetch local backup endpoints as fallback
      fetch(getApiUrl('/api/avatars'))
        .then(res => res.json())
        .then(serverAvatars => {
          if (serverAvatars && typeof serverAvatars === 'object') {
            setCustomAvatars(prev => {
              const combined = { ...prev, ...serverAvatars };
              try {
                localStorage.setItem('operator_avatars', JSON.stringify(combined));
              } catch (e) {
                console.warn("Storage quota full", e);
              }
              return combined;
            });
          }
        })
        .catch(err => console.error("Fallback avatars fetch error:", err));

      fetch(getApiUrl('/api/avatar-locks'))
        .then(res => res.json())
        .then(serverLocks => {
          if (serverLocks && typeof serverLocks === 'object') {
            setAvatarLocks(prev => {
              const combined = { ...prev, ...serverLocks };
              try {
                localStorage.setItem('operator_avatar_locks', JSON.stringify(combined));
              } catch (e) {
                console.warn("Storage quota full", e);
              }
              return combined;
            });
          }
        })
        .catch(err => console.error("Fallback locks fetch error:", err));
    };

    // Delay fallback REST API check to avoid dual-loading when Firestore is already online
    const fallbackTimeout = setTimeout(() => {
      if (!loadedFromFirestore) {
        fetchFallbackREST();
      }
    }, 1200);

    return () => {
      unsubscribe();
      clearTimeout(fallbackTimeout);
    };
  }, []);

  const toggleLock = (mesin: string) => {
    const isCurrentlyLocked = !!avatarLocks[mesin];
    const newLockedState = !isCurrentlyLocked;
    
    const updated = { ...avatarLocks, [mesin]: newLockedState };
    setAvatarLocks(updated);
    try {
      localStorage.setItem('operator_avatar_locks', JSON.stringify(updated));
    } catch (e) {
      console.warn("Local storage error", e);
    }

    fetch(getApiUrl('/api/avatar-locks'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mesin, locked: newLockedState })
    })
    .then(res => res.json())
    .then(p => {
      if (p.success) console.log(`Lock toggled successfully for ${mesin}`);
    })
    .catch(err => console.error("Error toggling lock:", err));

    // Synchronize to Firestore
    const opDocId = mesin.replace(/\s+/g, '_');
    setDoc(doc(db, 'operators', opDocId), {
      mesin,
      avatar: customAvatars[mesin] || '',
      locked: newLockedState,
      updatedAt: serverTimestamp()
    })
    .then(() => console.log(`Synchronized lock state to Firestore for ${mesin}`))
    .catch(err => {
      try {
        handleFirestoreError(err, OperationType.WRITE, `operators/${opDocId}`);
      } catch (e) {
        console.warn("Firestore lock sync skipped:", e);
      }
    });
  };

  const handleAvatarUpload = (mesin: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 200; // Ultra compact size for lightweight rendering
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
          const base64 = canvas.toDataURL('image/jpeg', 0.75); // High-performance compression
          
          // Save to local state
          const updated = { ...customAvatars, [mesin]: base64 };
          setCustomAvatars(updated);
          
          try {
            localStorage.setItem('operator_avatars', JSON.stringify(updated));
          } catch (storageError) {
            console.warn("localStorage quota hit", storageError);
          }

          // Auto lock photo after successful upload
          const updatedLocks = { ...avatarLocks, [mesin]: true };
          setAvatarLocks(updatedLocks);
          try {
            localStorage.setItem('operator_avatar_locks', JSON.stringify(updatedLocks));
          } catch (e) {
            console.warn("Local storage write locks issue", e);
          }
          
          // Save to server JSON database for cross-device sync
          fetch(getApiUrl('/api/avatars'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mesin, imageBase64: base64 })
          })
          .then(res => res.json())
          .then(payload => {
            if (payload.success) {
              console.log(`Synchronized operator photo for ${mesin} successfully`);
              return fetch(getApiUrl('/api/avatar-locks'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mesin, locked: true })
              });
            }
          })
          .then(lockRes => {
            if (lockRes) return lockRes.json();
          })
          .then(() => {
            console.log(`Otomatis mengunci foto operator ${mesin}`);
          })
          .catch(err => console.error("Server synchronization error for operator photo:", err));

          // Synchronize to Firestore
          const opDocId = mesin.replace(/\s+/g, '_');
          setDoc(doc(db, 'operators', opDocId), {
            mesin,
            avatar: base64,
            locked: true,
            updatedAt: serverTimestamp()
          })
          .then(() => console.log(`Synchronized uploaded photo to Firestore for ${mesin}`))
          .catch(err => {
            try {
              handleFirestoreError(err, OperationType.WRITE, `operators/${opDocId}`);
            } catch (e) {
              console.warn("Firestore photo sync skipped:", e);
            }
          });
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const closeProfile = () => {
    setSelectedOperator(null);
  };

  const handleImageError = (e: any) => {
    e.target.onerror = null; 
    e.target.style.display = 'none';
    const parent = e.target.parentElement;
    if (parent) {
      const fallbackIcon = parent.querySelector('.fallback-icon');
      if (fallbackIcon) fallbackIcon.style.display = 'block';
    }
  };

  const rankings = getMachineRankings(data, periodType as any, periodValue);
  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3, 8); // top 8

  const avatars: Record<string, { name: string; photoUrl?: string }> = React.useMemo(() => {
    const base: Record<string, { name: string; photoUrl?: string }> = {
      'BS 1': { name: 'Ahmad Khudlori' },
      'BS 2': { name: 'Marjono' },
      'BS 3': { name: 'Hartono' },
      'BS 4': { name: 'Saenurrodin' },
      'BS 5': { name: 'Subur' },
      'BS 6': { name: 'Supardi' },
      'BS 7': { name: 'Supariyo' },
      'BS 8': { name: 'Sukono' }
    };
    if (operatorData && operatorData.length > 0) {
      operatorData.forEach(op => {
        if (op.kode_bs && op.status_aktif) {
          base[op.kode_bs] = {
            name: op.nama_lengkap || base[op.kode_bs]?.name,
            photoUrl: op.url_foto || undefined
          };
        }
      });
    }
    return base;
  }, [operatorData]);

  const getAvatarImage = (mesin: string) => {
    if (customAvatars[mesin]) return customAvatars[mesin];
    if (avatars[mesin]?.photoUrl) return avatars[mesin].photoUrl;
    const name = avatars[mesin]?.name || mesin;
    return getDefaultSvgAvatar(mesin, name);
  };

  const PodiumItem = ({ rankItem, rank }: { rankItem: any, rank: number }) => {
      const isFirst = rank === 1;
      const isSecond = rank === 2;
      const isThird = rank === 3;
      
      const borderColor = isFirst ? 'border-amber-400' : isSecond ? 'border-cyan-400' : 'border-[#00796b]';
      const badgeColor = isFirst ? 'bg-amber-400 text-amber-950' : isSecond ? 'bg-cyan-400 text-cyan-950' : 'bg-[#00796b] text-white';
      const glow = isFirst ? 'shadow-[0_0_25px_rgba(251,191,36,0.25)]' : 
                   isSecond ? 'shadow-[0_0_15px_rgba(34,211,238,0.15)]' : 
                              'shadow-[0_0_15px_rgba(0,121,107,0.2)]';
      
      const yieldColor = isFirst ? 'text-amber-400' : isSecond ? 'text-cyan-400' : 'text-[#00796b]';
      const sizeClass = isFirst 
        ? 'w-14 h-14 min-[385px]:w-18 min-[385px]:h-18 sm:w-24 sm:h-24' 
        : 'w-11 h-11 min-[385px]:w-14 min-[385px]:h-14 sm:w-20 sm:h-20';
      
      return (
          <div className={cn("flex flex-col items-center relative z-10 hover:-translate-y-1 transition-transform duration-300", isFirst ? "-mt-4" : "mt-4 sm:mt-6")}>
              {isFirst && (
                <Crown 
                  className="w-5 h-5 min-[385px]:w-7 min-[385px]:h-7 sm:w-10 sm:h-10 text-amber-400 absolute -top-4.5 min-[385px]:-top-6 sm:-top-8 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)] z-20" 
                  fill="currentColor" 
                />
              )}
              <div className="relative cursor-pointer group" onClick={() => setSelectedOperator(rankItem)}>
                  <div className={cn("rounded-full border-[3px] flex items-center justify-center bg-slate-800 text-slate-300 font-bold overflow-hidden p-0.5 relative", borderColor, glow, sizeClass)}>
                      <div className="w-full h-full rounded-full bg-slate-900 border border-slate-700/30 flex items-center justify-center overflow-hidden relative">
                        <img 
                          src={getAvatarImage(rankItem.mesin)} 
                          alt={rankItem.mesin} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110" 
                          onError={handleImageError}
                        />
                        <User 
                          size={20} 
                          className="text-slate-500 absolute fallback-icon" 
                          style={{ display: 'none' }}
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <ZoomIn className="w-4 h-4 sm:w-6 sm:h-6 text-white drop-shadow-md" />
                        </div>
                      </div>
                  </div>
                  <div className={cn(
                    "absolute left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center font-black ring-2 sm:ring-4 ring-[#0f172a] z-10 transition-all",
                    isFirst ? "-bottom-2 sm:-bottom-3 w-5 h-5 sm:w-7 sm:h-7 text-[10px] sm:text-sm" : "-bottom-1.5 sm:-bottom-3 w-4 h-4 sm:w-6 sm:h-6 text-[9px] sm:text-xs",
                    badgeColor
                  )}>
                      {rank}
                  </div>
              </div>
              <div className="mt-2.5 sm:mt-4 text-center px-0.5 max-w-[80px] min-[385px]:max-w-[100px] sm:max-w-none">
                  <p className="text-white font-bold text-[10px] min-[385px]:text-xs sm:text-sm tracking-wide truncate leading-tight">{avatars[rankItem.mesin]?.name || rankItem.mesin}</p>
                  <p className="text-slate-400 text-[7.5px] sm:text-[10px] font-bold mt-0.5 uppercase tracking-wider leading-none">{rankItem.mesin}</p>
                  <p className={cn("font-black text-xs min-[385px]:text-sm sm:text-xl mt-0.5 tracking-tight", yieldColor)}>{(rankItem.yield * 100).toFixed(1)}%</p>
                  <p className="text-slate-400 text-[8.5px] sm:text-xs mt-0.5 font-medium leading-none">{rankItem.total.toLocaleString('id-ID', { maximumFractionDigits: 1 })} M³</p>
              </div>
          </div>
      )
  };

  return (
    <div className="p-2 sm:p-5 space-y-4">
      {/* Sub-tab selection capsules for 1-screen views */}
      <div className="flex bg-slate-900/40 backdrop-blur-md p-1 rounded-2xl border border-white/5 max-w-md mx-auto relative z-10 shadow-lg relative overflow-hidden">
        <button
          onClick={() => setActiveSubTab('ranks')}
          className={cn(
            "flex-1 py-1.5 sm:py-2 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer",
            activeSubTab === 'ranks' 
              ? "bg-[#00796b] text-white shadow-md font-black" 
              : "text-slate-300 hover:text-white"
          )}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Peringkat Operator</span>
        </button>
        <button
          onClick={() => setActiveSubTab('realtime')}
          className={cn(
            "flex-1 py-1.5 sm:py-2 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer",
            activeSubTab === 'realtime' 
              ? "bg-[#00796b] text-white shadow-md font-black" 
              : "text-slate-300 hover:text-white"
          )}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          <span>Pencapaian Realtime</span>
        </button>
      </div>

      {activeSubTab === 'ranks' ? (
        <div className="bg-[#0f172a] rounded-3xl p-3 sm:p-6 md:p-8 shadow-xl relative overflow-hidden ring-1 ring-slate-800">
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-sky-900/15 to-transparent pointer-events-none" />
          
          {/* Integrated Header Row containing Trophy Title + Period Filter controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2.5 border-b border-slate-800/80 pb-3 mb-4 relative z-10">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4.5 h-4.5 text-amber-400" />
              <span className="text-white font-extrabold text-sm sm:text-base tracking-tight">Leaderboard Operator</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <div className="flex bg-slate-800/60 p-0.5 rounded-lg border border-slate-750">
                <button 
                  onClick={() => { setPeriodType('weekly'); setPeriodValue(periods.weeks[0] || 0); }}
                  className={cn(
                    "px-2 py-1 text-[8.5px] uppercase tracking-wider font-extrabold rounded transition-colors cursor-pointer",
                    periodType === 'weekly' ? "bg-amber-400 text-amber-950 font-black" : "text-slate-400 hover:text-white"
                  )}
                >
                  Mingguan
                </button>
                <button 
                  onClick={() => { setPeriodType('monthly'); setPeriodValue(periods.months[0] || 0); }}
                  className={cn(
                    "px-2 py-1 text-[8.5px] uppercase tracking-wider font-extrabold rounded transition-colors cursor-pointer",
                    periodType === 'monthly' ? "bg-amber-400 text-amber-950 font-black" : "text-slate-400 hover:text-white"
                  )}
                >
                  Bulanan
                </button>
              </div>
              
              <select 
                className="bg-slate-800/80 border border-slate-750 text-white text-[10px] sm:text-xs font-bold rounded-lg px-2 py-1 outline-none cursor-pointer focus:border-amber-400"
                value={periodValue}
                onChange={(e) => setPeriodValue(parseInt(e.target.value))}
              >
                {periodType === 'monthly' ? periods.months.map(m => (
                  <option key={m} value={m} className="bg-[#0f172a]">Bulan {m}</option>
                )) : periods.weeks.map(w => (
                  <option key={w} value={w} className="bg-[#0f172a]">Minggu {w}</option>
                ))}
              </select>
            </div>
          </div>

          {rankings.length > 0 ? (
            <>
              {/* Podium display */}
              <div className="flex justify-center items-end gap-1.5 min-[385px]:gap-3.5 sm:gap-10 mb-4 pt-1">
                  {top3[1] && <PodiumItem rankItem={top3[1]} rank={2} />}
                  {top3[0] && <PodiumItem rankItem={top3[0]} rank={1} />}
                  {top3[2] && <PodiumItem rankItem={top3[2]} rank={3} />}
              </div>

              {/* Ranks list 4-8 */}
              <div className="space-y-2 max-w-2xl mx-auto relative z-10">
                  {rest.map((rankItem, i) => {
                      const rank = i + 4;
                      return (
                          <div key={rank} className="bg-[#1e293b]/40 rounded-xl p-2 sm:p-3 flex items-center gap-2 sm:gap-4 border border-slate-800/10 hover:bg-[#253247] transition-colors relative overflow-hidden group">
                              <div className="w-5 sm:w-8 flex justify-center flex-shrink-0">
                                <span className="text-slate-500 font-bold text-sm sm:text-xl group-hover:text-slate-400 transition-colors">{rank}</span>
                              </div>
                              <div 
                                  className="w-8 h-8 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-slate-800 flex-shrink-0 ring-1.5 sm:ring-2 ring-[#00796b] p-0.5 shadow-[0_0_6px_rgba(0,121,107,0.15)] cursor-pointer group/avatar relative"
                                  onClick={() => setSelectedOperator(rankItem)}
                              >
                                  <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center overflow-hidden relative">
                                    <img 
                                      src={getAvatarImage(rankItem.mesin)} 
                                      alt={rankItem.mesin} 
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover object-center transition-transform duration-500 group-hover/avatar:scale-110" 
                                      onError={handleImageError}
                                    />
                                    <User 
                                      size={16} 
                                      className="text-slate-500 absolute fallback-icon" 
                                      style={{ display: 'none' }}
                                    />
                                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                      <ZoomIn className="w-3.5 h-3.5 text-white drop-shadow-md" />
                                    </div>
                                  </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="text-white font-bold text-xs sm:text-base tracking-tight truncate leading-tight">{avatars[rankItem.mesin]?.name || rankItem.mesin}</p>
                                  <p className="text-sky-400 text-[9px] sm:text-xs font-medium mt-0.5 truncate leading-none">{rankItem.mesin}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                  <p className="text-white font-black text-xs sm:text-lg tracking-tight">{(rankItem.yield * 100).toFixed(1)}%</p>
                                  <p className="text-slate-400 text-[9px] sm:text-xs font-medium mt-0.5 leading-none">{rankItem.total.toLocaleString('id-ID', { maximumFractionDigits: 1 })} M³</p>
                              </div>
                          </div>
                      );
                  })}
              </div>
            </>
          ) : (
            <div className="text-center text-slate-400 py-12 text-xs relative z-10">
               Belum ada data produksi yang memadai untuk periode ini.
            </div>
          )}
        </div>
      ) : (
        <BsAchievementUpdate />
      )}

      {selectedOperator && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-all"
          onClick={closeProfile}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-sm sm:max-w-md w-full overflow-hidden transform scale-100 opacity-100 transition-all duration-300 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-800 text-sm sm:text-lg">Detail Operator</h2>
              <button 
                onClick={closeProfile}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            
            <div className="p-5 sm:p-8 flex flex-col items-center">
              <div className="relative mb-5 sm:mb-6 flex flex-col items-center">
                <label 
                  className="w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full overflow-hidden shadow-xl border-4 sm:border-8 border-slate-50 bg-slate-100 flex items-center justify-center relative cursor-pointer group"
                  title={avatarLocks[selectedOperator.mesin] ? "Foto Terkunci. Klik gembok di bawah untuk Membuka." : "Klik untuk mengubah foto"}
                >
                    <img
                      src={getAvatarImage(selectedOperator.mesin)}
                      alt={selectedOperator.mesin}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center"
                      onError={handleImageError}
                    />
                    <User 
                      size={60} 
                      className="text-slate-300 absolute fallback-icon" 
                      style={{ display: 'none' }}
                    />
                    {!avatarLocks[selectedOperator.mesin] ? (
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center">
                        <span className="text-white font-bold text-base sm:text-lg drop-shadow-md">Ganti Foto</span>
                        <span className="text-slate-200 text-xs sm:text-sm mt-1">Klik untuk unggah</span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center">
                        <Lock className="text-amber-400 w-6 h-6 sm:w-8 sm:h-8" />
                        <span className="text-white font-bold text-[10px] sm:text-xs mt-1">Foto Terkunci</span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onClick={(e) => {
                        if (avatarLocks[selectedOperator.mesin]) {
                          e.preventDefault();
                          alert(`Foto saat ini sedang dikunci. Silakan klik tombol gembok gembok untuk Membuka.`);
                        } else {
                          e.stopPropagation();
                        }
                      }}
                      onChange={(e) => {
                          if (e.target.files?.[0]) {
                              handleAvatarUpload(selectedOperator.mesin, e.target.files[0]);
                          }
                      }} 
                    />
                </label>

                {/* Padlock button under the avatar circle inside modal */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleLock(selectedOperator.mesin); }}
                  className={cn(
                    "absolute bottom-1 sm:bottom-2 right-1 sm:right-2 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 border",
                    avatarLocks[selectedOperator.mesin] 
                      ? "bg-slate-900 border-slate-700 text-amber-400" 
                      : "bg-white border-slate-200 text-slate-500 hover:text-slate-900"
                  )}
                  title={avatarLocks[selectedOperator.mesin] ? "Foto terkunci. Klik untuk Buka Kunci" : "Klik untuk Mengunci Foto"}
                >
                  {avatarLocks[selectedOperator.mesin] ? <Lock className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <Unlock className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
                </button>
              </div>

              <div className="mt-1 mb-4 flex flex-col items-center gap-1.5 w-full">
                <label className={cn(
                  "px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-wider cursor-pointer shadow-xs border transition-colors flex items-center gap-1.5",
                  avatarLocks[selectedOperator.mesin]
                    ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
                )}>
                  {avatarLocks[selectedOperator.mesin] ? <Lock className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                  {avatarLocks[selectedOperator.mesin] ? 'Foto Terkunci' : 'Unggah Foto Operator'}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onClick={(e) => {
                      if (avatarLocks[selectedOperator.mesin]) {
                        e.preventDefault();
                        alert(`Gagal: Foto dikunci. Klik tombol gembok di sebelah kanan bawah foto untuk membuka kunci.`);
                      } else {
                        e.stopPropagation();
                      }
                    }}
                    onChange={(e) => {
                        if (e.target.files?.[0]) {
                            handleAvatarUpload(selectedOperator.mesin, e.target.files[0]);
                        }
                    }} 
                  />
                </label>
                <p className="text-[9px] sm:text-[10px] text-slate-500 font-semibold leading-none text-center">
                  {avatarLocks[selectedOperator.mesin] ? 'Keamanan Aktif (Buka gembok untuk mengubah)' : 'Foto otomatis dikunci setelah Anda unggah'}
                </p>
              </div>
              
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2 text-center">
                {avatars[selectedOperator.mesin]?.name || selectedOperator.mesin}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-blue-700 bg-blue-50 px-4 py-1.5 rounded-xl mb-5 sm:mb-6 text-center leading-none">
                Operator Produksi ({selectedOperator.mesin})
              </p>
              
              <div className="flex flex-col gap-2.5 w-full bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs sm:text-sm font-medium">Pencapaian Yield</span>
                    <span className="font-bold text-slate-800 text-sm sm:text-lg">{(selectedOperator.yield * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs sm:text-sm font-medium">Total Produksi</span>
                    <span className="font-bold text-slate-800 text-sm sm:text-lg">{selectedOperator.total.toLocaleString('id-ID', { maximumFractionDigits: 1 })} M³</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
