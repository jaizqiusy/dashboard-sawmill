import React, { useState } from 'react';
import { Trophy, Crown, X, ZoomIn, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getAvailablePeriods, getMachineRankings } from '../../services/dataService';
import { BsAchievementUpdate } from './BsAchievementUpdate';

import avatarBs1 from '../../assets/avatars/bs1.png';
import avatarBs2 from '../../assets/avatars/bs2.png';
import avatarBs3 from '../../assets/avatars/bs3.png';
import avatarBs4 from '../../assets/avatars/bs4.png';
import avatarBs5 from '../../assets/avatars/bs5.png';
import avatarBs6 from '../../assets/avatars/bs6.png';
import avatarBs7 from '../../assets/avatars/bs7.png';
import avatarBs8 from '../../assets/avatars/bs8.png';

export function RankingPage({ data }: any) {
  const [periodType, setPeriodType] = useState('monthly');
  const periods = getAvailablePeriods(data);
  const [periodValue, setPeriodValue] = useState(periods.months[0] || 0);
  const [selectedOperator, setSelectedOperator] = useState<any>(null);

  const [customAvatars, setCustomAvatars] = useState<Record<string, string>>({});

  React.useEffect(() => {
    fetch('/api/avatars')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') {
          setCustomAvatars(data);
        }
      })
      .catch(err => console.error("Error loading avatars:", err));
  }, []);

  const handleAvatarUpload = (mesin: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setCustomAvatars(prev => ({ ...prev, [mesin]: base64 }));
      fetch('/api/avatars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesin, imageBase64: base64 })
      }).catch(err => console.error("Error saving avatar:", err));
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

  const avatars: Record<string, { image: string, name: string }> = {
    'BS 1': { name: 'Ahmad Khudlori', image: avatarBs1 },
    'BS 2': { name: 'Marjono', image: avatarBs2 },
    'BS 3': { name: 'Hartono', image: avatarBs3 },
    'BS 4': { name: 'Saenurrodin', image: avatarBs4 },
    'BS 5': { name: 'Subur', image: avatarBs5 },
    'BS 6': { name: 'Supardi', image: avatarBs6 },
    'BS 7': { name: 'Supariyo', image: avatarBs7 },
    'BS 8': { name: 'Sukono', image: avatarBs8 }
  };

  const getAvatarImage = (mesin: string) => {
    if (customAvatars[mesin]) return customAvatars[mesin];
    return avatars[mesin]?.image || `https://api.dicebear.com/7.x/identicon/svg?seed=${mesin}`;
  };

  const PodiumItem = ({ rankItem, rank }: { rankItem: any, rank: number }) => {
      const isFirst = rank === 1;
      const isSecond = rank === 2;
      const isThird = rank === 3;
      
      const borderColor = isFirst ? 'border-amber-400' : isSecond ? 'border-cyan-400' : 'border-[#00796b]';
      const badgeColor = isFirst ? 'bg-amber-400 text-amber-950' : isSecond ? 'bg-cyan-400 text-cyan-950' : 'bg-[#00796b] text-white';
      const glow = isFirst ? 'shadow-[0_0_30px_rgba(251,191,36,0.3)]' : 
                   isSecond ? 'shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 
                              'shadow-[0_0_20px_rgba(0,121,107,0.3)]';
      
      const yieldColor = isFirst ? 'text-amber-400' : isSecond ? 'text-cyan-400' : 'text-[#00796b]';
      const size = isFirst ? 'w-24 h-24' : 'w-20 h-20';
      
      return (
          <div className={cn("flex flex-col items-center relative z-10 hover:-translate-y-1.5 transition-transform duration-300", isFirst ? "-mt-4" : "mt-8")}>
              {isFirst && <Crown className="w-10 h-10 text-amber-400 absolute -top-8 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" fill="currentColor" />}
              <div className="relative cursor-pointer group" onClick={() => setSelectedOperator(rankItem)}>
                  <div className={cn("rounded-full border-[3px] flex items-center justify-center bg-slate-800 text-slate-300 font-bold overflow-hidden p-1 relative", borderColor, glow, size)}>
                      <div className="w-full h-full rounded-full bg-slate-900 border border-slate-700/50 flex items-center justify-center overflow-hidden relative">
                        <img 
                          src={getAvatarImage(rankItem.mesin)} 
                          alt={rankItem.mesin} 
                          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110" 
                          onError={handleImageError}
                        />
                        <User 
                          size={32} 
                          className="text-slate-500 absolute fallback-icon" 
                          style={{ display: 'none' }}
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <ZoomIn size={24} className="text-white drop-shadow-md" />
                        </div>
                      </div>
                  </div>
                  <div className={cn("absolute -bottom-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black ring-4 ring-[#0f172a] z-10", badgeColor)}>
                      {rank}
                  </div>
              </div>
              <div className="mt-5 text-center">
                  <p className="text-white font-bold text-sm tracking-wide">{avatars[rankItem.mesin]?.name || rankItem.mesin}</p>
                  <p className="text-slate-400 text-[10px] font-bold mt-0.5 uppercase tracking-wider">{rankItem.mesin}</p>
                  <p className={cn("font-black text-xl mt-1 tracking-tight", yieldColor)}>{(rankItem.yield * 100).toFixed(1)}%</p>
                  <p className="text-slate-400 text-xs mt-0.5 font-medium">{rankItem.total.toLocaleString('id-ID', { maximumFractionDigits: 1 })} M³</p>
              </div>
          </div>
      )
  };

  return (
    <div className="p-5 space-y-6">
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full blur-3xl -mr-16 -mt-16" />
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 tracking-tight relative z-10">
          <Trophy className="w-5 h-5 text-amber-500" />
          Filter Leaderboard
        </h2>
        
        <div className="flex gap-2 mt-4 relative z-10">
          <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
             <button 
                onClick={() => { setPeriodType('weekly'); setPeriodValue(periods.weeks[0] || 0); }}
                className={cn("px-4 py-1.5 text-[11px] uppercase tracking-wider font-bold rounded-md transition-colors", periodType === 'weekly' ? "bg-amber-100 text-amber-700" : "text-slate-500 hover:bg-slate-100")}
             >
                Mingguan
             </button>
             <button 
                onClick={() => { setPeriodType('monthly'); setPeriodValue(periods.months[0] || 0); }}
                className={cn("px-4 py-1.5 text-[11px] uppercase tracking-wider font-bold rounded-md transition-colors", periodType === 'monthly' ? "bg-amber-100 text-amber-700" : "text-slate-500 hover:bg-slate-100")}
             >
                Bulanan
             </button>
          </div>
          <select 
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg px-3 py-1.5 outline-none"
            value={periodValue}
            onChange={(e) => setPeriodValue(parseInt(e.target.value))}
          >
            {periodType === 'monthly' ? periods.months.map(m => (
              <option key={m} value={m}>Bulan {m}</option>
            )) : periods.weeks.map(w => (
              <option key={w} value={w}>Minggu {w}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-[#0f172a] rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden ring-1 ring-slate-800">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-sky-900/20 to-transparent pointer-events-none" />
        
        {rankings.length > 0 ? (
          <>
            <div className="flex justify-center items-end gap-6 sm:gap-10 mb-12 pt-6">
                {top3[1] && <PodiumItem rankItem={top3[1]} rank={2} />}
                {top3[0] && <PodiumItem rankItem={top3[0]} rank={1} />}
                {top3[2] && <PodiumItem rankItem={top3[2]} rank={3} />}
            </div>

            <div className="space-y-4 max-w-2xl mx-auto relative z-10">
                {rest.map((rankItem, i) => {
                    const rank = i + 4;
                    return (
                        <div key={rank} className="bg-[#1e293b] rounded-[1.25rem] p-4 flex items-center gap-4 sm:gap-6 border border-slate-800/50 hover:bg-[#253247] transition-colors relative overflow-hidden group">
                            <div className="w-6 sm:w-8 flex justify-center flex-shrink-0">
                              <span className="text-slate-500 font-bold text-xl sm:text-2xl group-hover:text-slate-400 transition-colors">{rank}</span>
                            </div>
                            <div 
                                className="w-14 h-14 rounded-full overflow-hidden bg-slate-800 flex-shrink-0 ring-[3px] ring-[#00796b] p-0.5 shadow-[0_0_8px_rgba(0,121,107,0.3)] cursor-pointer group/avatar relative"
                                onClick={() => setSelectedOperator(rankItem)}
                            >
                                <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center overflow-hidden relative">
                                  <img 
                                    src={getAvatarImage(rankItem.mesin)} 
                                    alt={rankItem.mesin} 
                                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover/avatar:scale-110" 
                                    onError={handleImageError}
                                  />
                                  <User 
                                    size={24} 
                                    className="text-slate-500 absolute fallback-icon" 
                                    style={{ display: 'none' }}
                                  />
                                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                    <ZoomIn size={16} className="text-white drop-shadow-md" />
                                  </div>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-bold text-base sm:text-lg tracking-tight truncate">{avatars[rankItem.mesin]?.name || rankItem.mesin}</p>
                                <p className="text-sky-400 text-xs sm:text-sm font-medium mt-0.5 truncate">{rankItem.mesin}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-white font-black text-lg sm:text-xl tracking-tight">{(rankItem.yield * 100).toFixed(1)}%</p>
                                <p className="text-slate-400 text-xs sm:text-sm font-medium mt-0.5">{rankItem.total.toLocaleString('id-ID', { maximumFractionDigits: 1 })} M³</p>
                            </div>
                        </div>
                    );
                })}
            </div>
          </>
        ) : (
          <div className="text-center text-slate-400 py-20 text-sm relative z-10">
             Belum ada data produksi yang memadai untuk periode ini.
          </div>
        )}
      </div>

      <BsAchievementUpdate />

      {selectedOperator && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm transition-all"
          onClick={closeProfile}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform scale-100 opacity-100 transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-bold text-slate-800 text-lg">Detail Operator</h2>
              <button 
                onClick={closeProfile}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 flex flex-col items-center">
              <div className="relative mb-6 flex flex-col items-center">
                <label 
                  className="w-56 h-56 md:w-64 md:h-64 rounded-full overflow-hidden shadow-xl border-8 border-slate-50 bg-slate-100 flex items-center justify-center relative cursor-pointer group"
                  title="Klik untuk mengubah foto"
                >
                    <img
                      src={getAvatarImage(selectedOperator.mesin)}
                      alt={selectedOperator.mesin}
                      className="w-full h-full object-cover object-center"
                      onError={handleImageError}
                    />
                    <User 
                      size={100} 
                      className="text-slate-300 absolute fallback-icon" 
                      style={{ display: 'none' }}
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center">
                      <span className="text-white font-bold text-lg drop-shadow-md">Ganti Foto</span>
                      <span className="text-slate-200 text-sm mt-1">Klik untuk unggah</span>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                          if (e.target.files?.[0]) {
                              handleAvatarUpload(selectedOperator.mesin, e.target.files[0]);
                          }
                      }} 
                    />
                </label>
                <div className="mt-4">
                  <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors shadow-sm text-sm">
                    Unggah Foto Operator
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                          if (e.target.files?.[0]) {
                              handleAvatarUpload(selectedOperator.mesin, e.target.files[0]);
                          }
                      }} 
                    />
                  </label>
                </div>
              </div>
              
              <h3 className="text-3xl font-extrabold text-slate-900 mb-2 text-center">
                {avatars[selectedOperator.mesin]?.name || selectedOperator.mesin}
              </h3>
              <p className="text-md font-semibold text-blue-700 bg-blue-50 px-5 py-2 rounded-xl mb-6 text-center">
                Operator Produksi ({selectedOperator.mesin})
              </p>
              
              <div className="flex flex-col gap-3 w-full bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Pencapaian Yield</span>
                    <span className="font-bold text-slate-800 text-lg">{(selectedOperator.yield * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Total Produksi</span>
                    <span className="font-bold text-slate-800 text-lg">{selectedOperator.total.toLocaleString('id-ID', { maximumFractionDigits: 1 })} M³</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
