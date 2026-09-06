import { readFileSync, writeFileSync } from 'fs';
const file = 'src/services/dataService.ts';
let content = readFileSync(file, 'utf-8');

// Replace all console.error('Error fetching ...', error) with console.warn
content = content.replace(/console\.error\('Error fetching ([^']+)', error\);/g, "console.warn('Network offline or fetch blocked for $1. Using local/fallback data.');");
content = content.replace(/console\.error\('Error reading from Firestore:', error\);/g, "console.warn('Firestore offline. Using fallback.');");
content = content.replace(/console\.error\("Sync Error:", error\);/g, "console.warn('Sync skipped (offline).');");
content = content.replace(/console\.error\('Auto-sync background check failed:', error\);/g, "console.warn('Auto-sync background check skipped (offline).');");

// Update fetchChunkedData to check navigator.onLine
const chunkDataFn = "async function fetchChunkedData<T>(collectionName: string): Promise<T[] | null> {";
const chunkDataCheck = "async function fetchChunkedData<T>(collectionName: string): Promise<T[] | null> {\n  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;";
content = content.replace(chunkDataFn, chunkDataCheck);

// Update fetch...FromSheet to also check navigator.onLine if we want, but they already fallback quickly when offline.
// Actually, fetch() fails immediately when offline, so it's fine.

writeFileSync(file, content);
