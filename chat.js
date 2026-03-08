import { getClient, getTextFromResponse, json, MODEL_TEXT } from "./_shared.js";

export async function POST(request) {
  try {
    const ai = getClient();
    const { message, history = [] } = await request.json();

    const compactHistory = Array.isArray(history)
      ? history.slice(-8).map((item) => ({
          role: item?.role === "assistant" ? "model" : "user",
          parts: [{ text: String(item?.content || "") }]
        }))
      : [];

    const contents = [
      ...compactHistory,
      {
        role: "user",
        parts: [
          {
            text: `Bạn là trợ lý AI cho diễn đàn toán học.\n
Yêu cầu bắt buộc:\n- Luôn trả lời bằng tiếng Việt.\n- Nếu là bài toán, trình bày từng bước rõ ràng.\n- Nếu người dùng yêu cầu soạn thảo văn bản, hãy viết mạch lạc, đúng chính tả, đúng ngữ cảnh.\n- Nếu thông tin chưa chắc chắn, nói rõ điều đó.\n- Ưu tiên giải thích dễ hiểu cho học sinh/sinh viên.\n\nYêu cầu của người dùng:\n${String(message || "")}`
          }
        ]
      }
    ];

    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents
    });

    return json({ text: getTextFromResponse(response) });
  } catch (error) {
    return json({ error: error?.message || "Lỗi chat AI." }, 500);
  }
}
