import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  const AVATARS_FILE = path.join(process.cwd(), "operator_avatars.json");

  app.use(express.json({ limit: '50mb' }));

  // API Routes for operator avatars
  app.get("/api/avatars", (req, res) => {
    try {
      if (fs.existsSync(AVATARS_FILE)) {
        const data = fs.readFileSync(AVATARS_FILE, "utf-8");
        res.json(JSON.parse(data));
      } else {
        res.json({});
      }
    } catch (error) {
      console.error("Failed to read avatars:", error);
      res.json({});
    }
  });

  app.post("/api/avatars", (req, res) => {
    try {
      const { mesin, imageBase64 } = req.body;
      if (!mesin) {
        return res.status(400).json({ error: "Mesin parameter is required" });
      }
      let avatarsList: Record<string, string> = {};
      if (fs.existsSync(AVATARS_FILE)) {
        try {
          avatarsList = JSON.parse(fs.readFileSync(AVATARS_FILE, "utf-8"));
        } catch {
          avatarsList = {};
        }
      }
      avatarsList[mesin] = imageBase64;
      fs.writeFileSync(AVATARS_FILE, JSON.stringify(avatarsList, null, 2), "utf-8");
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to save avatar:", error);
      res.status(500).json({ error: "Failed to save avatar on server" });
    }
  });

  // API Route for Gemini
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, context } = req.body;
      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `You are an AI assistant for a sawmill operations dashboard. Respond in Indonesian. Keep responses helpful, concise, and professional.\n\nContext:\n${JSON.stringify(context)}\n\nUser: ${message}`,
      });

      res.json({ reply: response.text });
    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).json({ error: "Gagal menghubungkan ke AI." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
