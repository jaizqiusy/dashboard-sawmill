import { readFileSync, writeFileSync } from 'fs';
const file = 'src/components/Pages/HomePage.tsx';
let content = readFileSync(file, 'utf-8');

// The icon "Package" is needed. It might not be imported.
if (!content.includes('Package')) {
  content = content.replace('import { ', 'import { Package, ');
}

// Add the menu item
const before = "{ id: 'Ranking', icon: Trophy, label: 'Ranking', desc: 'Peringkat mesin', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },";
const after = before + "\n    { id: 'Order', icon: Package, label: 'ORDER', desc: 'Order urgent', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },";

if (!content.includes("id: 'Order'")) {
  content = content.replace(before, after);
  writeFileSync(file, content);
}
