import { readFileSync, writeFileSync } from 'fs';
const file = 'src/services/dataService.ts';
let content = readFileSync(file, 'utf-8');

const search = `      console.log('Update detected in spreadsheet! Updating UI and syncing to Firestore...');
      // Update UI state immediately for responsive experience
      onUpdateDetected(newProd, newSupp, newMonth, newOp, newAnalisaDetail, newLogDikerjakan, newAnalisaOpData);`;

const replace = `      console.log('Update detected in spreadsheet! Updating UI and syncing to Firestore...');
      // Clear memory cache so next fetches get the latest data
      clearMemoryCache();
      // Update UI state immediately for responsive experience
      onUpdateDetected(newProd, newSupp, newMonth, newOp, newAnalisaDetail, newLogDikerjakan, newAnalisaOpData);`;

if (content.includes(search)) {
  content = content.replace(search, replace);
  writeFileSync(file, content);
} else {
  console.log("Could not find the target string.");
}
