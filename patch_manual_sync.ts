import { readFileSync, writeFileSync } from 'fs';
const file = 'src/services/dataService.ts';
let content = readFileSync(file, 'utf-8');

const search = `    if (onProgress) onProgress('Sync Complete!');
  } catch (error: any) {`;

const replace = `    if (onProgress) onProgress('Sync Complete!');
    clearMemoryCache();
  } catch (error: any) {`;

if (content.includes(search)) {
  content = content.replace(search, replace);
  writeFileSync(file, content);
} else {
  console.log("Could not find the target string.");
}
