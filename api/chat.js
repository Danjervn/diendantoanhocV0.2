import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request) {
  try {
    const { message, history = [] } = await request.json();

    const historyText = history
      .slice(-10)
      .map((m) => `${m.role === "assistant" ? "AI" : "Người dùng"}: ${m.content}`)
      .join("\n");

    const prompt = `
Bạn là trợ lý AI cho website diễn đàn toán học.
Yêu cầu:
- Luôn trả lời bằng tiếng Việt.
- Nếu là bài toán, giải từng bước rõ ràng.
- Nếu người dùng yêu cầu soạn thảo, hãy viết mạch lạc, gọn, đúng chính tả.
- Nếu không chắc, nói rõ là chưa chắc.

Lịch sử:
${historyText || "(trống)"}

Yêu cầu mới:
${message}
`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return Response.json({ text: result.text });
  } catch (error) {
    return Response.json(
      { error: error.message || "Lỗi chat AI" },
      { status: 500 }
    );
  }
}
