import { readFileSync, writeFileSync } from 'fs';
const file = 'src/App.tsx';
let content = readFileSync(file, 'utf-8');

content = content.replace(
  'console.error("Initial load error:", err);',
  'console.warn("Initial load network issue. Proceeding with cache/fallback.");'
);

writeFileSync(file, content);
