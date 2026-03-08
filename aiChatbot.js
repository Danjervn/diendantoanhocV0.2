class MathChatbot {
  constructor() {
    this.conversationHistory = [];
    this.currentAttachment = null;
    this.recognition = null;
    this.isRecording = false;
    this.isProcessingAttachment = false;

    this.maxImageSizeBytes = 5 * 1024 * 1024;
    this.maxDocxSizeBytes = 10 * 1024 * 1024;
    this.maxTxtSizeBytes = 2 * 1024 * 1024;
    this.maxAudioSizeBytes = 10 * 1024 * 1024;

    this.setupVoiceRecognition();
    this.initializeListeners();
  }

  setupVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.lang = "vi-VN";
    this.recognition.continuous = false;
    this.recognition.interimResults = false;

    this.recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      const input = document.getElementById("chat-input");
      if (input) {
        input.value += (input.value ? " " : "") + transcript;
      }
    };

    this.recognition.onerror = () => {
      this.stopRecording();
      alert("Không thể nhận diện giọng nói trực tiếp trên trình duyệt. Bạn vẫn có thể tải file audio để AI chép lời.");
    };

    this.recognition.onend = () => {
      this.stopRecording();
    };
  }

  toggleRecording() {
    if (!this.recognition) {
      alert("Trình duyệt của bạn không hỗ trợ SpeechRecognition trực tiếp. Hãy tải file audio lên bằng nút kẹp giấy.");
      return;
    }

    if (this.isRecording) {
      this.recognition.stop();
      return;
    }

    this.recognition.start();
    this.isRecording = true;
    document.getElementById("voice-btn")?.classList.add("recording");
  }

  stopRecording() {
    this.isRecording = false;
    document.getElementById("voice-btn")?.classList.remove("recording");
  }

  async handleFileUpload(file) {
    if (!file) return;

    try {
      this.isProcessingAttachment = true;
      this.showAttachmentPreview(`Đang xử lý: ${file.name}...`, true);

      if (file.type.startsWith("image/")) {
        if (file.size > this.maxImageSizeBytes) {
          alert("Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.");
          this.removeAttachment();
          return;
        }

        const dataUrl = await this.readFileAsDataURL(file);
        const { mimeType, base64 } = this.splitDataUrl(dataUrl);
        this.currentAttachment = {
          type: "image",
          mimeType,
          data: base64,
          name: file.name
        };
        this.showAttachmentPreview(`🖼️ Ảnh: ${file.name}`);
        return;
      }

      if (file.type.startsWith("audio/") || /\.(mp3|wav|m4a|ogg|webm)$/i.test(file.name)) {
        if (file.size > this.maxAudioSizeBytes) {
          alert("File audio quá lớn. Vui lòng chọn file dưới 10MB.");
          this.removeAttachment();
          return;
        }

        const dataUrl = await this.readFileAsDataURL(file);
        const { mimeType, base64 } = this.splitDataUrl(dataUrl);
        this.currentAttachment = {
          type: "audio",
          mimeType,
          data: base64,
          name: file.name
        };
        this.showAttachmentPreview(`🎧 Audio: ${file.name}`);
        return;
      }

      if (file.name.toLowerCase().endsWith(".txt")) {
        if (file.size > this.maxTxtSizeBytes) {
          alert("File TXT quá lớn. Vui lòng chọn file dưới 2MB.");
          this.removeAttachment();
          return;
        }

        const text = await file.text();
        this.currentAttachment = {
          type: "text",
          text: `\n[Nội dung file TXT: ${file.name}]\n${text}`,
          name: file.name
        };
        this.showAttachmentPreview(`📄 Text: ${file.name}`);
        return;
      }

      if (file.name.toLowerCase().endsWith(".docx")) {
        if (file.size > this.maxDocxSizeBytes) {
          alert("File DOCX quá lớn. Vui lòng chọn file dưới 10MB.");
          this.removeAttachment();
          return;
        }

        if (!window.mammoth || typeof window.mammoth.extractRawText !== "function") {
          alert("Thiếu thư viện đọc file DOCX (mammoth). Vui lòng tải lại trang.");
          this.removeAttachment();
          return;
        }

        const arrayBuffer = await file.arrayBuffer();
        const result = await window.mammoth.extractRawText({ arrayBuffer });
        this.currentAttachment = {
          type: "text",
          text: `\n[Nội dung file DOCX: ${file.name}]\n${result.value}`,
          name: file.name
        };
        this.showAttachmentPreview(`📝 Word: ${file.name}`);
        return;
      }

      alert("Định dạng chưa được hỗ trợ. Hãy dùng ảnh, audio, .txt hoặc .docx.");
      this.removeAttachment();
    } catch (error) {
      console.error("File upload error:", error);
      this.removeAttachment();
      alert("Không thể đọc file. Vui lòng thử file khác.");
    } finally {
      this.isProcessingAttachment = false;
    }
  }

  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result || "");
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  splitDataUrl(dataUrl) {
    const [meta, base64] = String(dataUrl || "").split(",");
    const mimeType = meta?.match(/data:(.*);base64/i)?.[1] || "application/octet-stream";
    return { mimeType, base64 };
  }

  showAttachmentPreview(text, processing = false) {
    const preview = document.getElementById("attachment-preview");
    if (!preview) return;

    preview.style.display = "flex";
    preview.innerHTML = processing
      ? `<span>${this.escapeHtml(text)}</span>`
      : `
      <span>${this.escapeHtml(text)}</span>
      <span class="remove-attachment" onclick="window.mathChatbot?.removeAttachment()">✕</span>
    `;
  }

  removeAttachment() {
    this.currentAttachment = null;

    const preview = document.getElementById("attachment-preview");
    if (preview) {
      preview.style.display = "none";
      preview.innerHTML = "";
    }

    const upload = document.getElementById("file-upload");
    if (upload) upload.value = "";
  }

  escapeHtml(text = "") {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  formatMessage(text = "") {
    const safe = this.escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.*?)__/g, "<u>$1</u>")
      .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
      .replace(/\n/g, "<br>");

    return safe.replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
  }

  displayMessage(message, sender) {
    const chatBox = document.getElementById("chat-box");
    if (!chatBox) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = `message message-${sender}`;
    messageDiv.innerHTML = `<div class="message-content">${this.formatMessage(message)}</div>`;

    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  showTyping() {
    const chatBox = document.getElementById("chat-box");
    if (!chatBox) return null;

    const typingDiv = document.createElement("div");
    typingDiv.className = "message message-bot typing";
    typingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    chatBox.appendChild(typingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return typingDiv;
  }

  shouldUseWebSearch(message) {
    const text = String(message || "").trim().toLowerCase();
    if (!text) return false;

    if (text.startsWith("tim web:") || text.startsWith("tìm web:")) return true;

    const webPatterns = [
      "tìm trên web",
      "tim tren web",
      "tìm bài toán",
      "tim bai toan",
      "nguồn tham khảo",
      "nguon tham khao",
      "tài liệu trên mạng",
      "website nào",
      "bài tương tự trên mạng",
      "tim nguon"
    ];

    return webPatterns.some((keyword) => text.includes(keyword));
  }

  normalizeSearchQuery(message) {
    return String(message || "")
      .replace(/^\s*(tim web:|tìm web:)\s*/i, "")
      .trim();
  }

  async callApi(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || "Không gọi được API.");
    }

    return data;
  }

  async askGeminiChat(message) {
    const data = await this.callApi("/api/chat", {
      message,
      history: this.conversationHistory
    });

    return data.text;
  }

  async askGeminiVision(prompt, attachment) {
    const data = await this.callApi("/api/vision", {
      prompt,
      mimeType: attachment.mimeType,
      imageBase64: attachment.data
    });

    return data.text;
  }

  async transcribeAudio(attachment) {
    const data = await this.callApi("/api/transcribe", {
      mimeType: attachment.mimeType,
      audioBase64: attachment.data
    });

    return data.text;
  }

  async searchMathOnWeb(query) {
    const data = await this.callApi("/api/search-math", {
      query,
      history: this.conversationHistory
    });

    let message = data.text || "Không có kết quả.";

    if (Array.isArray(data.sources) && data.sources.length) {
      message += "\n\nNguồn tham khảo:";
      data.sources.slice(0, 8).forEach((source, index) => {
        message += `\n${index + 1}. ${source.title} - ${source.url}`;
      });
    }

    return message;
  }

  async sendMessage() {
    const input = document.getElementById("chat-input");
    if (!input || this.isProcessingAttachment) return;

    const userMessage = input.value.trim();
    if (!userMessage && !this.currentAttachment) return;

    const userDisplay = userMessage || "(Đã gửi file đính kèm)";
    const attachmentHint = this.currentAttachment ? "\n(Đã đính kèm file)" : "";
    this.displayMessage(userDisplay + attachmentHint, "user");
    input.value = "";

    const attachment = this.currentAttachment;
    this.removeAttachment();

    const typing = this.showTyping();

    try {
      let aiResponse = "";

      if (attachment?.type === "image") {
        const prompt = userMessage || "Hãy giải hoặc mô tả nội dung toán học trong ảnh này.";
        aiResponse = await this.askGeminiVision(prompt, attachment);
      } else if (attachment?.type === "audio") {
        const transcript = await this.transcribeAudio(attachment);
        if (userMessage) {
          const followup = `Người dùng đính kèm một file audio. Đây là phần chép lời:\n${transcript}\n\nYêu cầu xử lý tiếp:\n${userMessage}`;
          const answer = await this.askGeminiChat(followup);
          aiResponse = `Bản chép lời:\n${transcript}\n\nPhản hồi:\n${answer}`;
        } else {
          aiResponse = `Bản chép lời:\n${transcript}`;
        }
      } else if (attachment?.type === "text") {
        const finalMessage = `${userMessage}\n${attachment.text}`.trim();
        aiResponse = await this.askGeminiChat(finalMessage);
      } else if (this.shouldUseWebSearch(userMessage)) {
        aiResponse = await this.searchMathOnWeb(this.normalizeSearchQuery(userMessage));
      } else {
        aiResponse = await this.askGeminiChat(userMessage);
      }

      if (userMessage) {
        this.conversationHistory.push({ role: "user", content: userMessage });
      }
      this.conversationHistory.push({ role: "assistant", content: aiResponse });

      this.displayMessage(aiResponse, "bot");
    } catch (error) {
      console.error("sendMessage error:", error);
      this.displayMessage(`Đã có lỗi khi gọi AI: ${error.message}`, "bot");
    } finally {
      if (typing) typing.remove();
    }
  }

  initializeListeners() {
    const sendBtn = document.getElementById("send-btn");
    const input = document.getElementById("chat-input");
    const attachBtn = document.getElementById("attach-btn");
    const fileUpload = document.getElementById("file-upload");
    const voiceBtn = document.getElementById("voice-btn");
    const closeBtn = document.getElementById("close-chat");

    if (sendBtn) sendBtn.addEventListener("click", () => this.sendMessage());

    if (input) {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.sendMessage();
      });
    }

    if (attachBtn && fileUpload) {
      attachBtn.addEventListener("click", () => fileUpload.click());
      fileUpload.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) this.handleFileUpload(file);
      });
    }

    if (voiceBtn) {
      voiceBtn.addEventListener("click", () => this.toggleRecording());
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        const container = document.getElementById("chatbot-container");
        if (container) container.style.display = "none";
      });
    }
  }

  clearHistory() {
    this.conversationHistory = [];
    const chatBox = document.getElementById("chat-box");
    if (!chatBox) return;

    chatBox.innerHTML = `
      <div class="message message-bot welcome">
        <div class="message-content">
          Xin chào! Tôi là trợ lý toán học dùng Gemini. Bạn có thể hỏi bài toán, tải ảnh, tải audio để chép lời, hoặc nhập “tìm web: ...” để tìm bài tương tự trên mạng.
        </div>
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.mathChatbot = new MathChatbot();
});
