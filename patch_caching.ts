import { readFileSync, writeFileSync } from 'fs';
const file = 'src/services/dataService.ts';
let content = readFileSync(file, 'utf-8');

const functionsToWrap = [
  { name: 'fetchOperatorData', type: 'OperatorData[]' },
  { name: 'fetchProductionData', type: 'ProductionData[]' },
  { name: 'fetchSupplierData', type: 'SupplierData[]' },
  { name: 'fetchMonthlyLogData', type: 'MonthlyLogData[]' },
  { name: 'fetchAnalisaOperatorDetailData', type: 'AnalisaOperatorDetailData[]' },
  { name: 'fetchAnalisaOperatorData', type: 'ProductionData[]' },
  { name: 'fetchLogDikerjakan', type: "import('../types').LogDikerjakanData[]" }
];

// Special case for fetchLogDikerjakan where type is import(...) or just LogDikerjakanData[]
content = content.replace("export async function fetchLogDikerjakan(): Promise<import('../types').LogDikerjakanData[]> {", "export async function fetchLogDikerjakan(): Promise<LogDikerjakanData[]> {");

for (const { name, type } of functionsToWrap) {
  const searchStr = `export async function ${name}(): Promise<${type}> {`;
  if (content.includes(searchStr)) {
    content = content.replace(searchStr, `async function _${name}_internal(): Promise<${type}> {`);
    
    // Add wrapper at the end
    const wrapper = `\nexport async function ${name}(forceRefresh = false): Promise<${type}> {
  if (!forceRefresh) {
    const cached = memoryCache.get('${name}');
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      return cached.data;
    }
  }
  const data = await _${name}_internal();
  memoryCache.set('${name}', { data, timestamp: Date.now() });
  return data;
}\n`;
    content += wrapper;
  }
}

// Wrap fetchOrderUrgentDataFromSheet
const searchUrgent = "export async function fetchOrderUrgentDataFromSheet(): Promise<{data: any[], dateH1: string, dateHariIni: string}> {";
if (content.includes(searchUrgent)) {
  content = content.replace(searchUrgent, "async function _fetchOrderUrgentDataFromSheet_internal(): Promise<{data: any[], dateH1: string, dateHariIni: string}> {");
  const wrapperUrgent = `\nexport async function fetchOrderUrgentDataFromSheet(forceRefresh = false): Promise<{data: any[], dateH1: string, dateHariIni: string}> {
  if (!forceRefresh) {
    const cached = memoryCache.get('fetchOrderUrgentDataFromSheet');
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      return cached.data;
    }
  }
  const data = await _fetchOrderUrgentDataFromSheet_internal();
  memoryCache.set('fetchOrderUrgentDataFromSheet', { data, timestamp: Date.now() });
  return data;
}\n`;
  content += wrapperUrgent;
}

writeFileSync(file, content);
