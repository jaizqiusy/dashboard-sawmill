import { readFileSync, writeFileSync } from 'fs';
const file = 'src/services/dataService.ts';
let content = readFileSync(file, 'utf-8');

function addCacheToFunction(funcName: string, returnType: string) {
  const searchStr = `export async function ${funcName}(): Promise<${returnType}> {`;
  if (!content.includes(searchStr)) return;
  
  const replacement = `export async function ${funcName}(): Promise<${returnType}> {
  const cached = memoryCache.get('${funcName}');
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    return cached.data;
  }
`;
  content = content.replace(searchStr, replacement);
  
  // Now we need to find all returns in the function and cache them before returning... 
  // Wait, it's easier to rename the original function and wrap it.
}

