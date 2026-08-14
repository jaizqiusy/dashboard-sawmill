import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.status(401).json({ error: "API Key Gemini belum dikonfigurasi di Environment Variables Vercel." });
    }

    const { message, context } = req.body;
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: `You are an AI assistant for a sawmill operations dashboard. Respond in Indonesian. Keep responses helpful, concise, and professional.\n\nContext:\n${JSON.stringify(context)}\n\nUser: ${message}`,
    });

    res.status(200).json({ reply: response.text });
  } catch (error: any) {
    console.error("AI chat error:", error);
    res.status(500).json({ error: error.message || "Gagal menghubungkan ke AI." });
  }
}
