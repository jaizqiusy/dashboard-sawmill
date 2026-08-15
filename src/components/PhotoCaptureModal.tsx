import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, X, FlipHorizontal, AlertCircle, Check, Image as ImageIcon } from 'lucide-react';

interface PhotoCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
}

export function compressImage(file: File, maxDimension = 1000, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(e.target?.result as string);
        }
        ctx.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL('image/jpeg', quality);
        resolve(base64);
      };
      img.onerror = (err) => reject(err);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export function PhotoCaptureModal({ isOpen, onClose, onCapture }: PhotoCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isLoading, setIsLoading] = useState(false);
  const [isShutterActive, setIsShutterActive] = useState(false);

  // Stop camera tracks helper
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async (mode: 'environment' | 'user') => {
    stopCameraStream();
    setCameraError(null);
    setIsLoading(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Kamera langsung tidak didukung di peramban ini. Gunakan unggah foto dari file/kamera bawaan.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Live camera error, falling back to file picker:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Izin kamera ditolak. Silakan izinkan akses kamera atau gunakan opsi Unggah File / Kamera HP.'
          : 'Tidak dapat membuka kamera langsung. Silakan gunakan tombol Ambil dari File / Kamera HP di bawah.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, facingMode]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    setIsShutterActive(true);
    setTimeout(() => setIsShutterActive(false), 200);

    const canvas = document.createElement('canvas');
    const maxDim = 1000;
    let width = video.videoWidth;
    let height = video.videoHeight;

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
      ctx.drawImage(video, 0, 0, width, height);
      const base64 = canvas.toDataURL('image/jpeg', 0.78);
      stopCameraStream();
      onCapture(base64);
      onClose();
    }
  };

  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file);
      stopCameraStream();
      onCapture(base64);
      onClose();
    } catch (err: any) {
      alert('Gagal memproses gambar: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>Ambil Foto Analisa Operator</span>
          </div>
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Container */}
        <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-900/80 text-white text-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <span>Menyiapkan Kamera...</span>
            </div>
          )}

          {cameraError ? (
            <div className="p-6 text-center text-slate-300 max-w-sm flex flex-col items-center gap-3">
              <AlertCircle className="w-10 h-10 text-amber-400" />
              <p className="text-xs">{cameraError}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                Gunakan Kamera Perangkat / Galeri
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover"
              />

              {/* Shutter flash effect */}
              {isShutterActive && <div className="absolute inset-0 bg-white z-20" />}

              {/* Viewfinder Overlay Guide */}
              <div className="absolute inset-4 border border-white/20 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                </div>
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                </div>
              </div>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileInputChange}
          />
        </div>

        {/* Controls Bar */}
        <div className="p-4 bg-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl transition-all"
            title="Pilih foto dari galeri atau kamera HP"
          >
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Pilih File</span>
          </button>

          {!cameraError && (
            <button
              onClick={handleCapture}
              disabled={isLoading}
              className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 border-4 border-white text-slate-950 flex items-center justify-center shadow-lg transition-all"
              title="Jepret Foto"
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
          )}

          {!cameraError && (
            <button
              onClick={handleToggleFacingMode}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl transition-all"
              title="Balik Kamera (Depan / Belakang)"
            >
              <FlipHorizontal className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Putar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
