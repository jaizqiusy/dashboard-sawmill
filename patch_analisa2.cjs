const fs = require('fs');
let code = fs.readFileSync('src/components/Pages/AnalisaOperatorPage.tsx', 'utf8');

if(!code.includes("import { db, auth }")) {
  code = code.replace(
    "import jsPDF from 'jspdf';",
    "import { db, auth } from '../../firebase';\nimport { collection, addDoc, getDocs, query, serverTimestamp } from 'firebase/firestore';\nimport jsPDF from 'jspdf';"
  );
}

// Add state for customNotes and new note
const stateStr = `  const [selectedMachine, setSelectedMachine] = useState<string>('all');

  const [noteTanggal, setNoteTanggal] = useState('');
  const [noteMesin, setNoteMesin] = useState('');
  const [noteText, setNoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customNotes, setCustomNotes] = useState<any[]>([]);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const q = query(collection(db, 'operator_notes'));
        const snapshot = await getDocs(q);
        const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCustomNotes(notes);
      } catch(e) {
        console.error("Failed to fetch notes", e);
      }
    };
    fetchNotes();
  }, []);

  const submitNote = async () => {
    if (!noteTanggal || !noteMesin || !noteText) return alert('Mohon lengkapi Tanggal, Mesin, dan Catatan');
    if (!auth.currentUser) return alert('Silakan login terlebih dahulu untuk menambahkan catatan');
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'operator_notes'), {
        tanggal: noteTanggal,
        mesin: noteMesin,
        note: noteText,
        author: auth.currentUser.email || 'Unknown',
        timestamp: serverTimestamp()
      });
      setNoteText('');
      alert('Catatan berhasil ditambahkan');
      // Refetch
      const q = query(collection(db, 'operator_notes'));
      const snapshot = await getDocs(q);
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomNotes(notes);
    } catch(e: any) {
      console.error(e);
      alert('Gagal menambahkan catatan: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };
`;
code = code.replace("  const [selectedMachine, setSelectedMachine] = useState<string>('all');", stateStr);

// Modify useMemo dependency and processing logic
code = code.replace("  const { processedData, availableDates, availableMachines } = useMemo(() => {", "  const { processedData, availableDates, availableMachines } = useMemo(() => {");
code = code.replace("catatan: row.downtime || '',", `catatan: (() => {
          const matchedNotes = customNotes.filter((n: any) => n.tanggal === row.tanggal && n.mesin === mesin);
          const customStr = matchedNotes.map((n: any) => n.note).join(' | ');
          return row.downtime ? (customStr ? \`\${row.downtime} | \${customStr}\` : row.downtime) : (customStr || '');
        })(),`);

code = code.replace("}, [data, selectedMonth]);", "}, [data, selectedMonth, customNotes]);");

// Add the input bar UI below the header (or above the table)
const inputBarUI = `        {/* Note Input Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-xl shadow-indigo-100/20 border border-indigo-50 flex flex-col sm:flex-row gap-3 items-end sm:items-center mt-4">
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Tgl Catatan</label>
            <input 
              type="date" 
              value={noteTanggal}
              onChange={e => setNoteTanggal(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Mesin</label>
            <select 
              value={noteMesin}
              onChange={e => setNoteMesin(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Pilih Mesin</option>
              {availableMachines.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 w-full flex-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Isi Catatan Harian</label>
            <input 
              type="text" 
              placeholder="Ketik catatan di sini..."
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
            />
          </div>
          <button 
            onClick={submitNote}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-50 mt-1 sm:mt-0"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Catatan'}
          </button>
        </div>

        {/* Data Table */}`;

code = code.replace("{/* Data Table */}", inputBarUI);

fs.writeFileSync('src/components/Pages/AnalisaOperatorPage.tsx', code);
