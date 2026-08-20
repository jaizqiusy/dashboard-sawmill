import fs from 'fs';

const path = 'src/components/Pages/AnalisaOperatorPage.tsx';
let code = fs.readFileSync(path, 'utf8');

const newCode = `
  const filteredData = useMemo(() => {
    return processedData.filter(row => {
      if (selectedDate !== 'all' && row.tanggal !== selectedDate) return false;
      if (selectedMachine !== 'all' && row.mesin !== selectedMachine) return false;
      return true;
    });
  }, [processedData, selectedDate, selectedMachine]);

  const filteredDetailData = useMemo(() => {
    if (!detailData) return [];
    return detailData.filter(row => {
      const d = new Date(row.tanggal);
      if (d.getMonth() + 1 !== selectedMonth) return false;
      if (selectedDate !== 'all' && row.tanggal !== selectedDate) return false;
      const normalizedRowMachine = normalizeMachineName(row.mesin);
      if (selectedMachine !== 'all' && normalizedRowMachine !== selectedMachine) return false;
      return true;
    }).sort((a, b) => {
      const dateCmp = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
      if (dateCmp !== 0) return dateCmp;
      const numA = parseInt(a.mesin.replace(/\\D/g, '')) || 0;
      const numB = parseInt(b.mesin.replace(/\\D/g, '')) || 0;
      return numA - numB;
    });
  }, [detailData, selectedMonth, selectedDate, selectedMachine]);
`;

code = code.replace(
  `  const filteredData = useMemo(() => {
    return processedData.filter(row => {
      if (selectedDate !== 'all' && row.tanggal !== selectedDate) return false;
      if (selectedMachine !== 'all' && row.mesin !== selectedMachine) return false;
      return true;
    });
  }, [processedData, selectedDate, selectedMachine]);`,
  newCode
);

fs.writeFileSync(path, code);
