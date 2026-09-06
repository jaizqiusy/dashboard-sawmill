import { readFileSync, writeFileSync } from 'fs';
const file = 'src/components/Pages/LogPage.tsx';
let content = readFileSync(file, 'utf-8');

// I also added `selectedLine` to the dependency array in LogPage.tsx, let's make sure it's correct.
