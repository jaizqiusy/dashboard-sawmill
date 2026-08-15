import React from 'react';
import { X, Download, User, Calendar, Cpu, MessageSquare } from 'lucide-react';

export interface PhotoLightboxData {
  url: string;
  mesin?: string;
  tanggal?: string;
  note?: string;
  author?: string;
  timeFormatted?: string;
}

interface PhotoLightboxModalProps {
  photoData: PhotoLightboxData | null;
  onClose: () => void;
}

export function PhotoLightboxModal({ photoData, onClose }: PhotoLightboxModalProps) {
  if (!photoData) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = photoData.url;
    link.download = `Foto_Analisa_${photoData.mesin || 'Operator'}_${photoData.tanggal || 'Catatan'}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-black rounded-lg uppercase tracking-wider">
              {photoData.mesin || 'Operator'}
            </span>
            <span className="text-xs text-slate-300 font-medium">
              {photoData.tanggal || ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold px-2.5"
              title="Unduh Foto"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Unduh</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Photo View */}
        <div className="relative flex-1 min-h-[260px] max-h-[60vh] bg-black/90 flex items-center justify-center overflow-hidden p-2">
          <img
            src={photoData.url}
            alt="Foto Catatan Analisa Operator"
            className="max-h-full max-w-full object-contain rounded-lg shadow-inner"
          />
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-800/95 border-t border-slate-700/80 flex flex-col gap-2.5 text-xs">
          {photoData.note && (
            <div className="flex items-start gap-2 text-slate-200">
              <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50 w-full text-slate-100">
                {photoData.note}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Oleh: <strong className="text-slate-200">{photoData.author || 'Operator'}</strong></span>
            </div>
            {photoData.timeFormatted && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{photoData.timeFormatted}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
