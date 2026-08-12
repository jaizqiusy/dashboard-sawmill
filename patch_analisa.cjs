const fs = require('fs');
let code = fs.readFileSync('src/components/Pages/AnalisaOperatorPage.tsx', 'utf8');

// 1. Add imports
code = code.replace(
  "import { ChevronDown, ChevronRight, User } from 'lucide-react';",
  "import { ChevronDown, ChevronRight, User, Download } from 'lucide-react';\nimport jsPDF from 'jspdf';\nimport autoTable from 'jspdf-autotable';"
);

// 2. Add handleDownloadPDF function
const downloadFn = `  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const title = 'Laporan Analisa Operator';
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    
    doc.setFontSize(10);
    doc.text(\`Bulan: \${monthNames[selectedMonth - 1]}\`, 14, 22);

    const tableColumn = ["Tanggal", "Mesin", "% Utama", "% Total", "Catatan", "Akm % Utama", "Akm % Total"];
    const tableRows: any[] = [];

    filteredData.forEach(row => {
      const rowData = [
        new Date(row.tanggal).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
        row.mesin,
        formatPercent(row.yieldUtama),
        formatPercent(row.yieldTotal),
        row.catatan,
        formatPercent(row.akumulasiUtama),
        formatPercent(row.akumulasiTotal)
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // indigo-600
    });

    doc.save(\`Analisa_Operator_\${monthNames[selectedMonth - 1]}.pdf\`);
  };

  const formatPercent = (val: number) => (val * 100).toFixed(2) + '%';`;

code = code.replace("const formatPercent = (val: number) => (val * 100).toFixed(2) + '%';", downloadFn);

// 3. Add the button to the header
const headerReplace = `
            <div className="flex flex-row gap-4 mt-1">
              <div className="flex flex-col gap-1 w-full sm:w-48">
                <label className="text-xs font-semibold text-slate-500 uppercase">Tanggal</label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                >
                  <option value="all">Semua Tanggal</option>
                  {availableDates.map(d => {
                    const fd = new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/ /g, '-');
                    return <option key={d} value={d}>{fd}</option>
                  })}
                </select>
              </div>
              <div className="flex flex-col gap-1 w-full sm:w-48">
                <label className="text-xs font-semibold text-slate-500 uppercase">Mesin</label>
                <select
                  value={selectedMachine}
                  onChange={(e) => setSelectedMachine(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                >
                  <option value="all">Semua Mesin</option>
                  {availableMachines.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col justify-end">
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download PDF</span>
                </button>
              </div>
            </div>`;

code = code.replace(/<div className="flex flex-row gap-4 mt-1">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, headerReplace + '\n          </div>');

fs.writeFileSync('src/components/Pages/AnalisaOperatorPage.tsx', code);
