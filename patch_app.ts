import fs from 'fs';

const path = 'src/App.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('AnalisaOperatorDetailData')) {
  code = code.replace(
    "import { MonthlyLogData, ProductionData, SupplierData, OperatorData } from './types';",
    "import { MonthlyLogData, ProductionData, SupplierData, OperatorData, AnalisaOperatorDetailData } from './types';"
  );
}

if (!code.includes('fetchAnalisaOperatorDetailData')) {
  code = code.replace(
    'fetchOperatorData,',
    'fetchOperatorData,\n  fetchAnalisaOperatorDetailData,'
  );
}

if (!code.includes('analisaOperatorDetailData')) {
  code = code.replace(
    'const [operatorData, setOperatorData] = useState<OperatorData[]>([]);',
    'const [operatorData, setOperatorData] = useState<OperatorData[]>([]);\n  const [analisaOperatorDetailData, setAnalisaOperatorDetailData] = useState<AnalisaOperatorDetailData[]>([]);'
  );
}

code = code.replace(
  'latestDataRef.current = { data, supplierData, monthlyLogData, operatorData };',
  'latestDataRef.current = { data, supplierData, monthlyLogData, operatorData, analisaOperatorDetailData };'
);

code = code.replace(
  '}, [data, supplierData, monthlyLogData, operatorData]);',
  '}, [data, supplierData, monthlyLogData, operatorData, analisaOperatorDetailData]);'
);

code = code.replace(
  `fetchOperatorData()
      ]).then(([prodData, suppData, monthlyLog, opData]) => {`,
  `fetchOperatorData(),
        fetchAnalisaOperatorDetailData()
      ]).then(([prodData, suppData, monthlyLog, opData, analisaDetailData]) => {`
);

code = code.replace(
  `setOperatorData(opData);
        setIsLoading(false);`,
  `setOperatorData(opData);
        setAnalisaOperatorDetailData(analisaDetailData);
        setIsLoading(false);`
);

code = code.replace(
  `opData,
          (newProd, newSupp, newMonth, newOp) => {`,
  `opData,
          analisaDetailData,
          (newProd, newSupp, newMonth, newOp, newAnalisaDetail) => {`
);

code = code.replace(
  `setOperatorData(newOp);
            }`,
  `setOperatorData(newOp);
              setAnalisaOperatorDetailData(newAnalisaDetail);
            }`
);

code = code.replace(
  `const { data: d, supplierData: s, monthlyLogData: m, operatorData: o } = latestDataRef.current;
      autoSyncSpreadsheetUpdates(d, s, m, o, (newProd, newSupp, newMonth, newOp) => {`,
  `const { data: d, supplierData: s, monthlyLogData: m, operatorData: o, analisaOperatorDetailData: a } = latestDataRef.current;
      autoSyncSpreadsheetUpdates(d, s, m, o, a, (newProd, newSupp, newMonth, newOp, newAnalisaDetail) => {`
);

code = code.replace(
  `setOperatorData(newOp);
        }`,
  `setOperatorData(newOp);
          setAnalisaOperatorDetailData(newAnalisaDetail);
        }`
);

// Pass down to AnalisaOperatorPage
code = code.replace(
  `{activeTab === 'AnalisaOperator' && <AnalisaOperatorPage data={data} />}`,
  `{activeTab === 'AnalisaOperator' && <AnalisaOperatorPage data={data} detailData={analisaOperatorDetailData} />}`
);

fs.writeFileSync(path, code);
