import { readFileSync, writeFileSync } from 'fs';

const file = 'src/services/dataService.ts';
let content = readFileSync(file, 'utf-8');

// Remove static import
content = content.replace(
  "import { RAW_CSV_DATA } from '../data/raw_data';",
  ""
);

// We need to change getStaticBaselineData to be async or avoid it completely if not strictly necessary synchronously.
// Let's check where getStaticBaselineData is used.
