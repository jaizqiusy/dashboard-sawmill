const fs = require('fs');
let code = fs.readFileSync('src/components/Pages/OrderUrgentUpdate.tsx', 'utf8');

const cacheLogic = `
let cachedOrderData: OrderUrgentItem[] | null = null;
let cachedDateCols: DateColInfo[] = [];
let cachedOrderLastUpdate: string = "-";

// LocalStorage helpers for instant zero-delay render
function getLocalOrderCache() {
  try {
    const raw = localStorage.getItem('cache_data_order_urgent');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function setLocalOrderCache(data: OrderUrgentItem[], cols: DateColInfo[], lastUpdate: string) {
  try {
    localStorage.setItem('cache_data_order_urgent', JSON.stringify({ data, cols, lastUpdate }));
  } catch (e) {
    // ignore
  }
}

const getUnit = (jo: string) => {`;

code = code.replace(/let cachedOrderData: OrderUrgentItem\[\] \| null = null;\nlet cachedDateCols: DateColInfo\[\] = \[\];\nlet cachedOrderLastUpdate: string = "-";\n\nconst getUnit = \(jo: string\) => {/, cacheLogic);

const syncLogic = `  const syncData = useCallback((force = false) => {
    if (!force) {
      if (cachedOrderData && cachedOrderData.length > 0) {
        setData(cachedOrderData);
        setDateCols(cachedDateCols);
        setLastUpdate(cachedOrderLastUpdate);
        return;
      }
      
      const localCache = getLocalOrderCache();
      if (localCache) {
        cachedOrderData = localCache.data;
        cachedDateCols = localCache.cols;
        cachedOrderLastUpdate = localCache.lastUpdate;
        setData(localCache.data);
        setDateCols(localCache.cols);
        setLastUpdate(localCache.lastUpdate);
        
        // Background sync to keep data fresh without blocking UI
        setTimeout(() => syncData(true), 3000);
        return;
      }
    }

    setLoading(true);
    setError(null);`;

code = code.replace(/  const syncData = useCallback\(\(force = false\) => \{\n    if \(\!force && cachedOrderData && cachedOrderData\.length > 0\) \{\n      setData\(cachedOrderData\);\n      setDateCols\(cachedDateCols\);\n      setLastUpdate\(cachedOrderLastUpdate\);\n      return;\n    \}\n\n    setLoading\(true\);\n    setError\(null\);/, syncLogic);

const saveLogic = `          cachedOrderLastUpdate = \`\${formattedDate}, \${formattedTime}\`;
          setLastUpdate(cachedOrderLastUpdate);
          
          setLocalOrderCache(items, cols, cachedOrderLastUpdate);
        } catch (err: any) {`;

code = code.replace(/          cachedOrderLastUpdate = `\$\{formattedDate\}, \$\{formattedTime\}`;\n          setLastUpdate\(cachedOrderLastUpdate\);\n        \} catch \(err: any\) \{/, saveLogic);

fs.writeFileSync('src/components/Pages/OrderUrgentUpdate.tsx', code);
