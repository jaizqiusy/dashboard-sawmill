import { readFileSync, writeFileSync } from 'fs';
const file = 'src/services/dataService.ts';
let content = readFileSync(file, 'utf-8');

const oldFunc = "  try {\n    const infoDoc = await getDoc(doc(db, 'dashboard_data', collectionName + '_info'));";
const newFunc = "  try {\n" +
                "    const infoDocPromise = getDoc(doc(db, 'dashboard_data', collectionName + '_info'));\n" +
                "    const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000));\n" +
                "    const infoDoc = await Promise.race([infoDocPromise, timeoutPromise]) as any;\n" +
                "    if (!infoDoc || !infoDoc.exists()) return null;";

content = content.replace(oldFunc, newFunc);
writeFileSync(file, content);
