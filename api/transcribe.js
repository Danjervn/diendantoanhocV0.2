import { getClient, getTextFromResponse, json, MODEL_AUDIO } from "./_shared.js";

export async function POST(request) {
  try {
    const ai = getClient();
    const { audioBase64, mimeType = "audio/webm" } = await request.json();

    if (!audioBase64) {
      return json({ error: "Thiếu dữ liệu audio." }, 400);
    }

    const response = await ai.models.generateContent({
      model: MODEL_AUDIO,
      contents: [
        {
          inlineData: {
            data: audioBase64,
            mimeType
          }
        },
        {
          text: "Hãy chuyển toàn bộ nội dung giọng nói trong audio này thành văn bản tiếng Việt sạch, giữ công thức toán nếu nghe được, không thêm giải thích ngoài bản chép."
        }
      ]
    });

    return json({ text: getTextFromResponse(response) });
  } catch (error) {
    return json({ error: error?.message || "Lỗi speech-to-text." }, 500);
  }
}
