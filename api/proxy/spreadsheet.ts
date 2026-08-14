export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { id, sheet, gid } = req.query;
    if (!id) return res.status(400).json({ error: "Spreadsheet ID is required" });
    
    let url = "";
    if (sheet) {
      url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet as string)}`;
    } else if (gid) {
      url = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
    } else {
      return res.status(400).json({ error: "Either sheet or gid must be provided" });
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Sheets responded with ${response.status}: ${response.statusText}`);
    }
    const data = await response.text();
    res.setHeader('Content-Type', 'text/csv');
    res.status(200).send(data);
  } catch (error) {
    console.error("Spreadsheet Proxy Error:", error);
    res.status(500).json({ error: "Failed to fetch spreadsheet data" });
  }
}
