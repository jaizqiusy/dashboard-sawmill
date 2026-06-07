import React, { useState, useMemo } from 'react';
import { Sparkles, Brain, Zap, MessageSquare, Send, Loader2 } from 'lucide-react';
import { ProductionData } from '../../types';
import { getApiUrl } from '../../lib/utils';

export function AIPage({ data }: { data: ProductionData[] }) {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', content: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const insights = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const validData = data.filter(d => d.mesin && d.mesin.toLowerCase().includes('bs') && d.input > 0);
    if (validData.length === 0) return null;

    // Sort data to find the latest date
    const sortedData = [...validData].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    const latestDate = sortedData[0]?.tanggal;
    
    // Today's stats
    const todayData = validData.filter(d => d.tanggal === latestDate);
    const todayInput = todayData.reduce((sum, d) => sum + d.input, 0);
    const todayUtama = todayData.reduce((sum, d) => sum + d.utama, 0);
    const todayTotal = todayData.reduce((sum, d) => sum + d.total, 0);
    const todayYield = todayInput > 0 ? (todayUtama / todayInput) * 100 : 0;
    const todayYieldTotal = todayInput > 0 ? (todayTotal / todayInput) * 100 : 0;
    
    const todayAchivementArr = todayData.filter(d => d.achievement > 0).map(d => d.achievement);
    const todayAvgAchievement = todayAchivementArr.length > 0 ? todayAchivementArr.reduce((a,b)=>a+b, 0) / todayAchivementArr.length : 0;
    
    // Past data stats
    const pastData = validData.filter(d => d.tanggal !== latestDate);
    const pastInput = pastData.reduce((sum, d) => sum + d.input, 0);
    const pastUtama = pastData.reduce((sum, d) => sum + d.utama, 0);
    const pastYield = pastInput > 0 ? (pastUtama / pastInput) * 100 : 0;
    
    const yieldDiff = todayYield - pastYield;
    const isIncreased = yieldDiff >= 0;
    
    // Machine level stats
    const machineStats: Record<string, { input: number, utama: number, total: number, downtime: number, achievement: number[], count: number }> = {};
    todayData.forEach(d => {
       if (!machineStats[d.mesin]) machineStats[d.mesin] = { input: 0, utama: 0, total: 0, downtime: 0, achievement: [], count: 0 };
       machineStats[d.mesin].input += d.input;
       machineStats[d.mesin].utama += d.utama;
       machineStats[d.mesin].total += d.total;
       machineStats[d.mesin].count++;
       if(d.achievement > 0) machineStats[d.mesin].achievement.push(d.achievement);
       
       if (d.downtime && d.mesin) {
         const parts = d.downtime.split(/[;,]/);
         parts.forEach(part => {
           const match = part.match(/=(\d+)mnt/);
           if (match && match[1]) {
             machineStats[d.mesin].downtime += parseInt(match[1]);
           }
         });
       }
    });
    
    let bestMachine = '-';
    let worstYieldMachine = '-';
    let maxMachineYield = -1;
    let minMachineYield = 101;
    
    let bestAchMachine = '-';
    let worstAchMachine = '-';
    let maxAch = -1;
    let minAch = 101;

    let worstMachineDowntime = '-';
    let maxDowntime = 0;
    let totalDowntime = 0;
    
    for (const [m, s] of Object.entries(machineStats)) {
       const mYield = s.input > 0 ? (s.utama / s.input) * 100 : 0;
       
       if (mYield > maxMachineYield) {
           maxMachineYield = mYield;
           bestMachine = m;
       }
       if (mYield < minMachineYield && s.input > 0) {
           minMachineYield = mYield;
           worstYieldMachine = m;
       }
       
       if (s.downtime > maxDowntime) {
          maxDowntime = s.downtime;
          worstMachineDowntime = m;
       }
       totalDowntime += s.downtime;
       
       const avgAch = s.achievement.length > 0 ? s.achievement.reduce((a,b)=>a+b, 0) / s.achievement.length : 0;
       if (avgAch > maxAch && avgAch > 0) {
          maxAch = avgAch;
          bestAchMachine = m;
       }
       if (avgAch < minAch && avgAch > 0) {
          minAch = avgAch;
          worstAchMachine = m;
       }
    }
    
    return {
      todayDate: latestDate,
      todayYield: todayYield.toFixed(1),
      todayYieldTotal: todayYieldTotal.toFixed(1),
      todayAvgAchievement: todayAvgAchievement.toFixed(1),
      yieldDiff: Math.abs(yieldDiff).toFixed(1),
      isIncreased,
      bestMachine,
      maxMachineYield: maxMachineYield.toFixed(1),
      worstYieldMachine,
      minMachineYield: minMachineYield.toFixed(1),
      bestAchMachine,
      maxAch: maxAch.toFixed(1),
      worstAchMachine,
      minAch: minAch.toFixed(1),
      worstMachineDowntime,
      maxDowntime,
      totalDowntime
    };
  }, [data]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    const userMsg = message.trim();
    setMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await fetch(getApiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          context: data || "Terdapat data performa sawmill hari ini."
        }),
      });

      if (!response.ok) throw new Error('Gagal memproses pesan');
      
      const responseData = await response.json();
      setChatHistory(prev => [...prev, { role: 'model', content: responseData.reply }]);
    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { role: 'model', content: 'Maaf, terjadi kesalahan saat menghubungi AI.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="p-5 space-y-6 pb-24">
      {/* Header AI */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Sparkles className="w-20 h-20" />
        </div>
        <div className="relative z-10">
          <div className="bg-white/20 w-fit p-2 rounded-xl backdrop-blur-md mb-4 font-bold text-[10px] uppercase tracking-[0.2em]">
            Powered by Gemini AI
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-2">Laporan AI</h2>
          <p className="text-sm text-blue-100 leading-relaxed font-medium">Analisis cerdas untuk performa sawmill Anda hari ini.</p>
        </div>
      </div>

      {/* Insight Sections */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-bold text-slate-800">Ringkasan Efisiensi</h3>
          </div>
          {insights ? (
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>
                Berdasarkan data hari ini ({insights.todayDate}), rata-rata rendemen utama Anda mencapai <span className="font-bold text-slate-900">{insights.todayYield}%</span> dengan yield total (termasuk turunan/lokal) di angka <span className="font-bold text-slate-900">{insights.todayYieldTotal}%</span>.
                Ini menunjukkan {insights.isIncreased ? 'peningkatan' : 'penurunan'} rendemen utama <span className={`${insights.isIncreased ? 'text-emerald-500' : 'text-rose-500'} font-bold`}>{insights.isIncreased ? '+' : '-'}{insights.yieldDiff}%</span> dibandingkan rata-rata riwayat sebelumnya. 
              </p>
              <p>
                Analisis per Mesin:<br/>
                • 🏆 <span className="font-bold">Yield Tertinggi:</span> Mesin <span className="font-bold text-emerald-600">{insights.bestMachine}</span> ({insights.maxMachineYield}%)<br/>
                • ⚠️ <span className="font-bold">Yield Terendah:</span> Mesin <span className="font-bold text-rose-600">{insights.worstYieldMachine}</span> ({insights.minMachineYield}%)<br/>
                • 🎯 <span className="font-bold">Pencapaian (Ach) Tertinggi:</span> Mesin <span className="font-bold text-emerald-600">{insights.bestAchMachine}</span> ({insights.maxAch}%)<br/>
                • 📉 <span className="font-bold">Pencapaian (Ach) Terendah:</span> Mesin <span className="font-bold text-rose-600">{insights.worstAchMachine}</span> ({insights.minAch}%)
              </p>
              <p>
                Total pencapaian produksi rata-rata berada pada angka <span className="font-bold">{insights.todayAvgAchievement}%</span>. Total downtime tercatat mencapai <span className="font-bold">{insights.totalDowntime} menit</span>.
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">Menganalisa data performa...</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-100 rounded-lg">
              <Brain className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="font-bold text-slate-800">Rekomendasi AI</h3>
          </div>
          <ul className="space-y-4">
            {insights && insights.totalDowntime > 0 ? (
              <li className="flex gap-3 text-sm text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 block mb-0.5">Penanganan Downtime Mesin</span>
                  Terdapat downtime yang harus diminimalisir. Mesin penyumbang terbesar adalah <span className="font-bold">{insights.worstMachineDowntime}</span> dengan <span className="font-bold text-rose-500">{insights.maxDowntime} menit</span>. 
                  Lakukan inspeksi root-cause analysis (misal: pisau patah, rantai seret, motor panas) dan buat Preventive Maintenance terjadwal.
                </div>
              </li>
            ) : insights ? (
              <li className="flex gap-3 text-sm text-slate-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 block mb-0.5">Downtime Sangat Baik</span>
                  Bagus sekali, tidak ada kendala downtime signifikan yang dilaporkan pada semua lini hari ini. Pertahankan maintenance rutin.
                </div>
              </li>
            ) : null}
            
            {insights && (
              <>
                <li className="flex gap-3 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">Optimasi Yield Material</span>
                    Mesin <span className="font-bold">{insights.worstYieldMachine}</span> memiliki rendemen terendah ({insights.minMachineYield}%). Cek kembali apakah karena grade kayu yang disupply kurang baik atau settingan ukuran pisau kurang presisi (toleransi speling terlalu besar). Prioritaskan log ukuran bagus untuk mesin ini, sementara potong kayu dengan bentuk kurang beraturan di mesin <span className="font-bold">{insights.bestMachine}</span> yang terbukti paling stabil (Rendemen {insights.maxMachineYield}%).
                  </div>
                </li>
                <li className="flex gap-3 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">Peningkatan Target Produksi (Speed)</span>
                    Mesin <span className="font-bold">{insights.worstAchMachine}</span> underperform dengan achievement harian rata-rata hanya {insights.minAch}%. Evaluasi kinerja operator dan kecepatan (feed rate) mesin tersebut. Pertimbangkan merotasi operator berpengalaman dari <span className="font-bold">{insights.bestAchMachine}</span> ({insights.maxAch}%) untuk melatih/mendampingi operator di <span className="font-bold">{insights.worstAchMachine}</span>.
                  </div>
                </li>
              </>
            )}
          </ul>
        </div>

        <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-lg flex flex-col h-[400px]">
          <div className="flex items-center gap-3 mb-4 shrink-0">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold">Tanya AI</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
            {chatHistory.length === 0 ? (
              <div className="bg-white/5 rounded-xl p-4 text-xs text-slate-400 border border-white/5 text-center my-auto">
                Ajukan pertanyaan seputar data performa sawmill kepada AI...
              </div>
            ) : (
              chatHistory.map((chat, idx) => (
                <div key={idx} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${chat.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white/10 text-slate-200 rounded-bl-none'}`}>
                    {chat.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/10 rounded-2xl rounded-bl-none p-3 text-slate-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Berpikir...</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="relative shrink-0">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              placeholder="Tanya performa produksi..."
              className="w-full bg-white/10 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !message.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
