export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Vercel Serverless Functions have read-only filesystems.
  // We mock the response so the frontend doesn't crash on Vercel.
  if (req.method === 'GET') {
    return res.status(200).json({});
  }

  if (req.method === 'POST') {
    return res.status(200).json({ success: true, warning: 'Avatar upload simulated (Vercel read-only filesystem)' });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
