const fs = require('fs');
let code = fs.readFileSync('src/components/Pages/AnalisaOperatorPage.tsx', 'utf8');

if (!code.includes("onAuthStateChanged")) {
  code = code.replace(
    "import { db, auth } from '../../firebase';",
    "import { db, auth } from '../../firebase';\nimport { onAuthStateChanged } from 'firebase/auth';"
  );
}

const authStateStr = `  const [customNotes, setCustomNotes] = useState<any[]>([]);

  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(auth.currentUser?.email || null);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUserEmail(user?.email || null);
    });
    return () => unsubscribe();
  }, []);

  const ALLOWED_EMAILS = ['jaizqiusy@gmail.com', 'chamdan918@gmail.com', 'jarmoyo121095@gmail.com'];
  const canEditNotes = currentUserEmail && ALLOWED_EMAILS.includes(currentUserEmail);
`;
code = code.replace("  const [customNotes, setCustomNotes] = useState<any[]>([]);", authStateStr);

const submitUpdate = `  const submitNote = async () => {
    if (!noteTanggal || !noteMesin || !noteText) return alert('Mohon lengkapi Tanggal, Mesin, dan Catatan');
    if (!auth.currentUser) return alert('Silakan login terlebih dahulu untuk menambahkan catatan');
    if (!ALLOWED_EMAILS.includes(auth.currentUser.email || '')) return alert('Maaf, akun Anda tidak memiliki izin untuk menambahkan catatan.');
    setIsSubmitting(true);`;
code = code.replace(/  const submitNote = async \(\) => \{\n    if \(\!noteTanggal \|\| \!noteMesin \|\| \!noteText\) return alert\('Mohon lengkapi Tanggal, Mesin, dan Catatan'\);\n    if \(\!auth\.currentUser\) return alert\('Silakan login terlebih dahulu untuk menambahkan catatan'\);\n    setIsSubmitting\(true\);/, submitUpdate);

const noteBarRegex = /        \{\/\* Note Input Bar \*\/\}[\s\S]*?<\/button>\s*<\/div>/;

const noteBarMatch = code.match(noteBarRegex);
if(noteBarMatch) {
  const replacement = `        {/* Note Input Bar - Only visible to allowed emails */}
        {canEditNotes && (
${noteBarMatch[0].split('\n').map(line => '        ' + line).join('\n')}
        )}`;
  code = code.replace(noteBarRegex, replacement);
}

fs.writeFileSync('src/components/Pages/AnalisaOperatorPage.tsx', code);
