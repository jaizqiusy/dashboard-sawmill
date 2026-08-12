const fs = require('fs');
let code = fs.readFileSync('src/components/Pages/HomePage.tsx', 'utf8');

code = code.replace(
  "import { cn } from '../../lib/utils';",
  "import { cn } from '../../lib/utils';\nimport { syncSpreadsheetToFirestore } from '../../services/dataService';\nimport { RefreshCw } from 'lucide-react';\nimport { useState } from 'react';"
);

code = code.replace(
  "export function HomePage({ setActiveTab }: HomePageProps) {",
  "export function HomePage({ setActiveTab }: HomePageProps) {\n  const [isSyncing, setIsSyncing] = useState(false);\n  const [syncStatus, setSyncStatus] = useState('');\n  \n  const handleSync = async () => {\n    if (isSyncing) return;\n    setIsSyncing(true);\n    try {\n      await syncSpreadsheetToFirestore(setSyncStatus);\n      setSyncStatus('Selesai! Memuat ulang...');\n      setTimeout(() => window.location.reload(), 1500);\n    } catch (err: any) {\n      setSyncStatus('Gagal: ' + err.message);\n    } finally {\n      setIsSyncing(false);\n    }\n  };"
);

// Add the sync button above the menu
const syncButton = `
        {/* Sync Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-xl flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-white">Database Firestore</h3>
            <p className="text-xs text-indigo-200 mt-1">{syncStatus || 'Sinkronkan data terbaru dari Google Sheets'}</p>
          </div>
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold text-xs transition-all disabled:opacity-50"
          >
            <RefreshCw className={\`w-4 h-4 \${isSyncing ? 'animate-spin' : ''}\`} />
            {isSyncing ? 'Menyinkronkan...' : 'Sinkron Data'}
          </button>
        </div>
`;

code = code.replace(
  "{/* Main Menu Grid */}",
  syncButton + "\n        {/* Main Menu Grid */}"
);

fs.writeFileSync('src/components/Pages/HomePage.tsx', code);
