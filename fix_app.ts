import { readFileSync, writeFileSync } from 'fs';
const file = 'src/App.tsx';
let content = readFileSync(file, 'utf-8');

// Remove any broken imports that I might have accidentally added
content = content.replace("import { OrderPage } from './components/Pages/OrderPage';\n", "");

// Add lazy loaded OrderPage
const beforeLazy = "const RankingPage = lazy(() => import('./components/Pages/RankingPage').then(module => ({ default: module.RankingPage })));";
const afterLazy = beforeLazy + "\nconst OrderPage = lazy(() => import('./components/Pages/OrderPage').then(module => ({ default: module.OrderPage })));";

if (!content.includes('const OrderPage = lazy')) {
  content = content.replace(beforeLazy, afterLazy);
  writeFileSync(file, content);
}
