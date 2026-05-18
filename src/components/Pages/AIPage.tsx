import React from 'react';
import { Sparkles, Brain, Zap, MessageSquare } from 'lucide-react';

export function AIPage({ data }) {
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
          <p className="text-sm text-slate-600 leading-relaxed">
            Berdasarkan data terbaru, rata-rata rendemen utama Anda mencapai <span className="font-bold text-slate-900">32.4%</span>. 
            Ini menunjukkan peningkatan <span className="text-emerald-500 font-bold">+2.1%</span> dibandingkan rata-rata minggu lalu. 
            Mesin <span className="font-bold">BS 3</span> menunjukkan performa tertinggi pagi ini.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-100 rounded-lg">
              <Brain className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="font-bold text-slate-800">Rekomendasi AI</h3>
          </div>
          <ul className="space-y-3">
            <li className="flex gap-3 text-sm text-slate-600">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
              <span>Perhatikan downtime tinggi pada <span className="font-bold">BS 7</span>, terdeteksi pola gangguan setiap 4 jam.</span>
            </li>
            <li className="flex gap-3 text-sm text-slate-600">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <span>Optimalkan input log pada shift sore untuk menyeimbangkan beban kerja mesin Pony.</span>
            </li>
          </ul>
        </div>

        <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold">Tanya AI (Segera Hadir)</h3>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-xs text-slate-400 border border-white/5">
            Fitur chat interaktif sedang dalam pengembangan...
          </div>
        </div>
      </div>
    </div>
  );
}
