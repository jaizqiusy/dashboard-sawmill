import { readFileSync, writeFileSync } from 'fs';
const file = 'src/services/dataService.ts';
let content = readFileSync(file, 'utf-8');

const searchLog = `export async function fetchLogDikerjakan(): Promise<LogDikerjakanData[]> {
  const fsData = await fetchChunkedData<import('../types').LogDikerjakanData>('logDikerjakan');
  if (fsData && fsData.length > 0) return fsData;
  return fetchLogDikerjakanFromSheet();
}`;

const replaceLog = `async function _fetchLogDikerjakan_internal(): Promise<LogDikerjakanData[]> {
  const fsData = await fetchChunkedData<import('../types').LogDikerjakanData>('logDikerjakan');
  if (fsData && fsData.length > 0) return fsData;
  return fetchLogDikerjakanFromSheet();
}

export async function fetchLogDikerjakan(forceRefresh = false): Promise<LogDikerjakanData[]> {
  if (!forceRefresh) {
    const cached = memoryCache.get('fetchLogDikerjakan');
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      return cached.data;
    }
  }
  const data = await _fetchLogDikerjakan_internal();
  memoryCache.set('fetchLogDikerjakan', { data, timestamp: Date.now() });
  return data;
}`;

if (content.includes(searchLog)) {
  content = content.replace(searchLog, replaceLog);
  writeFileSync(file, content);
} else {
  console.log("Could not find the target string.");
}
