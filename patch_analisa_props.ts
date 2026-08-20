import fs from 'fs';

const path = 'src/components/Pages/AnalisaOperatorPage.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `interface AnalisaOperatorPageProps {
  data: ProductionData[];
}`,
  `import { AnalisaOperatorDetailData } from '../../types';

interface AnalisaOperatorPageProps {
  data: ProductionData[];
  detailData?: AnalisaOperatorDetailData[];
}`
);

// also update the function signature
code = code.replace(
  'export function AnalisaOperatorPage({ data }: AnalisaOperatorPageProps) {',
  'export function AnalisaOperatorPage({ data, detailData = [] }: AnalisaOperatorPageProps) {'
);

fs.writeFileSync(path, code);
