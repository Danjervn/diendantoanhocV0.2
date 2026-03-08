import { GoogleGenAI } from "@google/genai";

export const MODEL_TEXT = "gemini-2.5-flash";
export const MODEL_VISION = "gemini-2.5-flash";
export const MODEL_SEARCH = "gemini-2.5-flash";
export const MODEL_AUDIO = "gemini-2.5-flash";

export function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Thiếu biến môi trường GEMINI_API_KEY trên Vercel.");
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

export function getTextFromResponse(response) {
  return response?.text || "AI không trả về nội dung.";
}

export function dedupeSources(groundingMetadata) {
  const chunks = groundingMetadata?.groundingChunks || [];
  const map = new Map();

  for (const chunk of chunks) {
    const web = chunk?.web;
    if (web?.uri && !map.has(web.uri)) {
      map.set(web.uri, {
        title: web.title || web.uri,
        url: web.uri
      });
    }
  }

  return [...map.values()];
}
