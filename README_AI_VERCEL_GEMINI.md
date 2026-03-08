# Tích hợp Gemini vào website trên Vercel

## Những gì đã được thêm
- Xóa key AI khỏi `config.js`
- Thêm Vercel Functions trong thư mục `api/`
- Thêm các route:
  - `POST /api/chat`
  - `POST /api/search-math`
  - `POST /api/vision`
  - `POST /api/transcribe`
- Nâng cấp `aiChatbot.js` để:
  - chat/soạn thảo văn bản
  - tìm bài toán trên web bằng Gemini + Google Search grounding
  - nhận diện ảnh toán học
  - speech-to-text từ file audio
  - speech-to-text trực tiếp trên trình duyệt nếu browser hỗ trợ `SpeechRecognition`
- Gắn chatbot vào các trang:
  - `index.html`
  - `algebra.html`
  - `geometry.html`
  - `calculus.html`
  - `post.html`
  - `admin.html`

## Bước cấu hình trên Vercel
1. Upload project lên GitHub hoặc import trực tiếp vào Vercel
2. Vào **Project > Settings > Environment Variables**
3. Tạo biến:

```env
GEMINI_API_KEY=your_real_key_here
```

4. Redeploy project

## Chạy local
```bash
npm install
vercel dev
```

Nếu chưa cài Vercel CLI:
```bash
npm i -g vercel
```

## Cách dùng trong chatbox
- Hỏi bài toán bình thường: chat/soạn thảo văn bản
- Gõ `tìm web: bất đẳng thức cauchy lớp 9` để tìm bài tương tự trên web
- Tải ảnh lên để AI nhận diện đề toán trong ảnh
- Tải file `.mp3`, `.wav`, `.m4a`, `.ogg`, `.webm` để AI chép lời
- Bấm nút mic để dùng speech-to-text trực tiếp nếu trình duyệt hỗ trợ

## Lưu ý bảo mật
- Không đặt `GEMINI_API_KEY` trong `config.js` hay bất kỳ file frontend nào
- Nếu key Groq cũ đã từng public, hãy thu hồi/rotate ngay
- `SUPABASE_ANON_KEY` có thể để client nếu RLS được cấu hình đúng
- Không đưa `service_role` lên frontend

## Gợi ý tiếp theo
- Thêm rate limit cho `/api/*`
- Lưu lịch sử hội thoại vào Supabase
- Thêm nút chọn chế độ: Chat / Tìm web / Nhận diện ảnh / Chép lời
