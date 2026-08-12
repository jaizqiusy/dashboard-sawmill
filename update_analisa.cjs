const fs = require('fs');
let code = fs.readFileSync('src/components/Pages/AnalisaOperatorPage.tsx', 'utf8');

// Replace the header and remove the old filters block
const headerOld = `          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <User className="w-8 h-8 text-indigo-600" />
              Analisa Operator
            </h1>
            <p className="text-slate-500 mt-1 font-medium">Laporan Harian dan Akumulasi Performa Mesin</p>
          </div>`;

const headerNew = `          <div className="flex flex-col gap-4">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <User className="w-8 h-8 text-indigo-600" />
              Analisa Operator
            </h1>
            
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
            </div>
          </div>`;

code = code.replace(headerOld, headerNew);

const filtersOld = `        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white rounded-2xl p-4 shadow-xl shadow-indigo-100/20 border border-indigo-50">
          <div className="flex flex-col gap-1 w-full sm:w-1/3">
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
          <div className="flex flex-col gap-1 w-full sm:w-1/3">
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
        </div>`;

code = code.replace(filtersOld, "");

fs.writeFileSync('src/components/Pages/AnalisaOperatorPage.tsx', code);
