import { getClient, getTextFromResponse, json, MODEL_VISION } from "./_shared.js";

export async function POST(request) {
  try {
    const ai = getClient();
    const { imageBase64, mimeType, prompt } = await request.json();

    if (!imageBase64 || !mimeType) {
      return json({ error: "Thiếu dữ liệu ảnh." }, 400);
    }

    const response = await ai.models.generateContent({
      model: MODEL_VISION,
      contents: [
        {
          inlineData: {
            data: imageBase64,
            mimeType
          }
        },
        {
          text: prompt || "Hãy nhận diện nội dung trong ảnh. Nếu đây là bài toán, hãy chép lại đề, nhận diện công thức/ký hiệu và giải thích ngắn gọn bằng tiếng Việt."
        }
      ]
    });

    return json({ text: getTextFromResponse(response) });
  } catch (error) {
    return json({ error: error?.message || "Lỗi nhận diện ảnh." }, 500);
  }
}
