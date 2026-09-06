import { readFileSync, writeFileSync } from 'fs';
const file = 'src/components/Pages/LogPage.tsx';
let content = readFileSync(file, 'utf-8');
content = content.replace(
  "  }, [selectedDate, selectedShift, selectedMesin, selectedLine]);",
  "  }, [selectedDate, selectedMesin, selectedLine, searchQuery]);"
);
writeFileSync(file, content);
