import { dedupeSources, getClient, getTextFromResponse, json, MODEL_SEARCH } from "./_shared.js";

export async function POST(request) {
  try {
    const ai = getClient();
    const { query, history = [] } = await request.json();

    const historyText = Array.isArray(history)
      ? history.slice(-4).map((item) => `${item?.role === "assistant" ? "AI" : "Người dùng"}: ${item?.content || ""}`).join("\n")
      : "";

    const response = await ai.models.generateContent({
      model: MODEL_SEARCH,
      contents: `Bạn là trợ lý tìm kiếm bài toán cho diễn đàn toán học.\n
Nhiệm vụ:\n- Tìm trên web các bài toán, tài liệu hoặc nguồn học phù hợp với yêu cầu.\n- Trả lời bằng tiếng Việt.\n- Ưu tiên nguồn uy tín, dễ học.\n- Nếu là đề bài, hãy mô tả ngắn gọn đề và mức độ phù hợp.\n- Cuối câu trả lời, tạo mục \"Gợi ý từ khóa tìm thêm\" nếu có ích.\n\nNgữ cảnh gần đây:\n${historyText || "(không có)"}\n\nYêu cầu hiện tại:\n${String(query || "")}`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const groundingMetadata = response?.candidates?.[0]?.groundingMetadata || null;

    return json({
      text: getTextFromResponse(response),
      sources: dedupeSources(groundingMetadata),
      groundingMetadata
    });
  } catch (error) {
    return json({ error: error?.message || "Lỗi tìm kiếm bài toán trên web." }, 500);
  }
}
