import { readFileSync, writeFileSync } from 'fs';
const file = 'src/App.tsx';
let content = readFileSync(file, 'utf-8');

// Add import
if (!content.includes('OrderPage')) {
  content = content.replace("import { RankingPage } from './components/Pages/RankingPage';", "import { RankingPage } from './components/Pages/RankingPage';\nimport { OrderPage } from './components/Pages/OrderPage';");
}

// Add route
const beforeRoute = "{activeTab === 'Ranking' && <RankingPage data={data} operatorData={operatorData} />}";
const afterRoute = beforeRoute + "\n        {activeTab === 'Order' && <OrderPage />}";

if (!content.includes("activeTab === 'Order'")) {
  content = content.replace(beforeRoute, afterRoute);
  writeFileSync(file, content);
}
