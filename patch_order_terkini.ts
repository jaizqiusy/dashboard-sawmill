import { readFileSync, writeFileSync } from 'fs';
const file = 'src/components/Pages/OrderPage.tsx';
let content = readFileSync(file, 'utf-8');

const oldFilter = `  const filteredData = data.filter(item => {
    if (activeTab === 'TERKINI') return true; // Show all by default for TERKINI? Or just top N? Will match behavior in image
    if (activeTab === 'KURANG' && item.status !== 'kurang') return false;
    if (activeTab === 'SELESAI' && item.status !== 'selesai') return false;
    if (search && !item.ukuran.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const countKurang = data.filter(d => d.status === 'kurang').length;
  const countSelesai = data.filter(d => d.status === 'selesai').length;
  const countSemua = data.length;
  // If "TERKINI" means top 35, we can limit it later, but for now we'll just show all active stuff.
  // We'll set TERKINI to 35 for matching exactly if there is exactly 35. Actually let's just make it countSemua if not defined.
  // Wait, let's just use the exact logic from the user's mockup to show dynamic numbers.`;

const newFilter = `  const filteredData = data.filter(item => {
    if (search && !item.ukuran.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTab === 'TERKINI') {
      return (item.h1 !== null && item.h1 > 0) || (item.hariIni !== null && item.hariIni > 0);
    }
    if (activeTab === 'KURANG' && item.status !== 'kurang') return false;
    if (activeTab === 'SELESAI' && item.status !== 'selesai') return false;
    return true;
  });

  const countTerkini = data.filter(item => (item.h1 !== null && item.h1 > 0) || (item.hariIni !== null && item.hariIni > 0)).length;
  const countKurang = data.filter(d => d.status === 'kurang').length;
  const countSelesai = data.filter(d => d.status === 'selesai').length;
  const countSemua = data.length;`;

content = content.replace(oldFilter, newFilter);

const oldTerkiniBtn = `TERKINI ({countSemua > 35 ? 35 : countSemua})`;
const newTerkiniBtn = `TERKINI ({countTerkini})`;

content = content.replace(oldTerkiniBtn, newTerkiniBtn);

// I also need to fix the slice(0, 35) in the rendering
const oldRender = `(activeTab === 'TERKINI' ? filteredData.slice(0, 35) : filteredData).map((row, idx) => (`
const newRender = `filteredData.map((row, idx) => (`
content = content.replace(oldRender, newRender);

writeFileSync(file, content);
