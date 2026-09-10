import { readFileSync, writeFileSync } from 'fs';
const file = 'src/services/dataService.ts';
let content = readFileSync(file, 'utf-8');

// Insert memory cache map
const mapDef = `// Cached baseline data
let memoizedStaticBaseline: ProductionData[] | null = null;
const memoryCache = new Map<string, {data: any, timestamp: number}>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

export function clearMemoryCache() {
  memoryCache.clear();
}
`;

if (!content.includes('memoryCache')) {
  content = content.replace(`// Cached baseline data\nlet memoizedStaticBaseline: ProductionData[] | null = null;`, mapDef);
}

writeFileSync(file, content);
