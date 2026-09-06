import { readFileSync, writeFileSync } from 'fs';

const file = 'src/services/dataService.ts';
let content = readFileSync(file, 'utf-8');

// We need to change getStaticBaselineData to be async.
content = content.replace(
`function getStaticBaselineData(): ProductionData[] {
  if (!memoizedStaticBaseline) {
    memoizedStaticBaseline = parseCSV(RAW_CSV_DATA);
  }
  return memoizedStaticBaseline;
}`,
`async function getStaticBaselineData(): Promise<ProductionData[]> {
  if (!memoizedStaticBaseline) {
    const { RAW_CSV_DATA } = await import('../data/raw_data');
    memoizedStaticBaseline = parseCSV(RAW_CSV_DATA);
  }
  return memoizedStaticBaseline;
}`
);

// We also need to update the call sites to await it.
content = content.replace(
`export async function fetchProductionDataFromSheet(): Promise<ProductionData[]> {
  const staticData = getStaticBaselineData();`,
`export async function fetchProductionDataFromSheet(): Promise<ProductionData[]> {
  const staticData = await getStaticBaselineData();`
);

content = content.replace(
`export async function fetchProductionData(): Promise<ProductionData[]> {
  const staticData = getStaticBaselineData();`,
`export async function fetchProductionData(): Promise<ProductionData[]> {
  const staticData = await getStaticBaselineData();`
);

content = content.replace(
`export function parseProductionData(): ProductionData[] {
  return parseCSV(RAW_CSV_DATA);
}`,
`export async function parseProductionData(): Promise<ProductionData[]> {
  const { RAW_CSV_DATA } = await import('../data/raw_data');
  return parseCSV(RAW_CSV_DATA);
}`
);

writeFileSync(file, content);
