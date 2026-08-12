const fs = require('fs');
let code = fs.readFileSync('src/components/MobileLayout.tsx', 'utf8');

code = code.replace(
  "import { cn } from '../lib/utils';",
  "import { cn } from '../lib/utils';\nimport { syncSpreadsheetToFirestore } from '../services/dataService';\nimport { RefreshCw } from 'lucide-react';\nimport { useState } from 'react';"
);

code = code.replace(
  "export function MobileLayout({",
  "export function MobileLayout({\n"
);

// We need to inject state into MobileLayout
const stateHooks = `  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  
  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await syncSpreadsheetToFirestore(setSyncStatus);
      setSyncStatus('Selesai! Memuat ulang...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setSyncStatus('Gagal: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };
`;

code = code.replace(
  "const isHome = activeTab === 'Home';",
  stateHooks + "\n  const isHome = activeTab === 'Home';"
);

// Replace the Laporan AI button with Sinkron Data button
const syncButton = `
        {/* Floating Sync Button - Absolute position */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end">
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl transition-all active:scale-95 shadow-lg disabled:opacity-50",
              isSyncing 
                ? "bg-white text-indigo-600 shadow-white/10" 
                : "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-indigo-500/20 border border-indigo-400/30"
            )}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isSyncing ? "animate-spin" : "")} />
            <span className="text-[9px] font-black uppercase tracking-wider">{isSyncing ? 'Menyinkronkan...' : 'Sinkron Data'}</span>
          </button>
          {syncStatus && <span className="text-[7px] text-white/70 mt-1 max-w-[100px] truncate text-right absolute top-full right-0">{syncStatus}</span>}
        </div>
`;

// use regex to replace the floating button block
code = code.replace(
  /\{\/\* Floating AI Report Button - Absolute position as requested \*\/\}[\s\S]*?<\/button>\s*<\/div>/,
  syncButton
);

fs.writeFileSync('src/components/MobileLayout.tsx', code);
