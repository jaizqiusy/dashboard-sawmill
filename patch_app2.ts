import { readFileSync, writeFileSync } from 'fs';
const file = 'src/App.tsx';
let content = readFileSync(file, 'utf-8');

if (!content.includes("import { OrderPage }")) {
  content = content.replace("import { RankingPage }", "import { OrderPage } from './components/Pages/OrderPage';\nimport { RankingPage }");
  writeFileSync(file, content);
}
