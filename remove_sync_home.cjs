const fs = require('fs');
let code = fs.readFileSync('src/components/Pages/HomePage.tsx', 'utf8');

// Remove imports
code = code.replace("import { syncSpreadsheetToFirestore } from '../../services/dataService';\n", "");
code = code.replace("import { RefreshCw } from 'lucide-react';\n", "");
code = code.replace("import { useState } from 'react';\n", "");

// Remove state and handlers
code = code.replace(/  const \[isSyncing, setIsSyncing\] = useState\(false\);\n  const \[syncStatus, setSyncStatus\] = useState\(''\);\n  \n  const handleSync = async \(\) => {[\s\S]*?  };\n/, "");

// Remove Sync Card UI
code = code.replace(/        \{\/\* Sync Card \*\/\}[\s\S]*?<\/div>\n/, "");

fs.writeFileSync('src/components/Pages/HomePage.tsx', code);
