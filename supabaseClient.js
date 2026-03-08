// supabaseClient.js
// Yêu cầu: file này được load SAU khi supabase SDK (UMD) đã được load,
// và SAU config.js (window.SUPABASE_URL, window.SUPABASE_ANON_KEY).

if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in config.js");
} else if (!window.supabase || typeof window.supabase.createClient !== "function") {
  console.error("Supabase SDK not loaded or incorrect. Make sure you included the UMD CDN before this script.");
} else {
  // Tạo client và gán vào window.supabaseClient để client code dùng
  const _client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  // Expose rõ ràng cho các file khác:
  window.supabaseClient = _client;
  // Nếu bạn muốn sử dụng tên `supabase` trực tiếp trong admin.js (như trước),
  // bạn cũng có thể gán window.supabase = _client;
  window.supabase = _client;
  console.log("Supabase client initialized");
}
