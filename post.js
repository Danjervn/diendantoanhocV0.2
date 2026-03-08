// post.js (THAY ĐÈ file hiện tại)
// Hiệu năng: fetch 1 post, render feedback, support addFeedback, realtime subscribe (fallback polling)

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

let currentPostId = null;
let realtimeSubscribed = false;
let pollingIntervalId = null;

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  currentPostId = params.get("id"); // KEEP as string — support numeric or uuid in DB

  if (!currentPostId) {
    const titleEl = document.getElementById("post-title");
    if (titleEl) titleEl.innerText = "Bài viết không tồn tại";
    return;
  }

  // load initial post & feedback
  renderPost();

  // try subscribe to realtime updates for this post's feedback
  trySetupRealtime();
});

// --- fetch & render post ---------------------------------------------------
async function renderPost() {
  try {
    // note: do NOT coerce id to Number() — DB may store string/UUID
    const { data: post, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", currentPostId)
      .single();

    if (error || !post) {
      console.error("fetch post error:", error);
      const titleEl = document.getElementById("post-title");
      if (titleEl) titleEl.innerText = "Bài viết không tồn tại";
      return;
    }

    // show meta & content
    const titleEl = document.getElementById("post-title");
    if (titleEl) titleEl.innerText = post.title || "";

    const authorEl = document.getElementById("post-author");
    if (authorEl) authorEl.innerText = post.author || "";

    const categoryEl = document.getElementById("post-category");
    if (categoryEl) categoryEl.innerText = post.category || "";

    const contentEl = document.getElementById("post-content");
    if (contentEl) contentEl.innerHTML = post.content || "";

    // images (if any)
    const imageBox = document.getElementById("image-container");
    if (imageBox) {
      imageBox.innerHTML = "";
      if (Array.isArray(post.images)) {
        post.images.forEach(src => {
          const img = document.createElement("img");
          img.src = src;
          img.loading = "lazy";
          imageBox.appendChild(img);
        });
      }
    }

    // render feedback array (tolerant to undefined/null)
    const feedbackArr = Array.isArray(post.feedback) ? post.feedback : [];
    renderFeedback(feedbackArr);
  } catch (err) {
    console.error("renderPost error:", err);
  }
}

// --- render feedback -------------------------------------------------------
function renderFeedback(list) {
  const listEl = document.getElementById("feedback-list");
  if (!listEl) return;
  listEl.innerHTML = "";

  if (!Array.isArray(list) || list.length === 0) {
    listEl.innerHTML = "<i>Chưa có feedback.</i>";
    return;
  }

  // show newest last (you can reverse if want newest first)
  list.forEach(fb => {
    const div = document.createElement("div");
    div.className = "feedback-item";

    const name = escapeHtml(fb.name || fb.author || "Khách");
    const email = fb.email ? ` (${escapeHtml(fb.email)})` : "";
    const when = fb.created_at ? new Date(fb.created_at).toLocaleString() : "";
    // support both keys: message (new) or content (old)
    const msg = escapeHtml(fb.message ?? fb.content ?? "");

    div.innerHTML = `
      <b>${name}</b>${email} <br>
      <small>${when}</small>
      <p>${msg}</p>
      <hr>
    `;
    listEl.appendChild(div);
  });
}

// --- add feedback (update posts.feedback) ---------------------------------
async function addFeedback() {
  if (!currentPostId) {
    alert("Không tìm thấy bài viết.");
    return;
  }

  const name = (document.getElementById("fb-name")?.value || "").trim();
  const email = (document.getElementById("fb-email")?.value || "").trim();
  const message = (document.getElementById("fb-content")?.value || "").trim();

  if (!name || !email || !message) {
    alert("Vui lòng nhập đầy đủ thông tin");
    return;
  }

  if (!email.endsWith("@gmail.com")) {
    alert("Chỉ chấp nhận email Gmail");
    return;
  }

  const comment = {
    id: crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.floor(Math.random()*1e6)}`,
    name,
    email,
    message,
    created_at: new Date().toISOString()
  };

  try {
    // 1) read current feedback (tolerant if RLS blocks, we'll detect)
    const { data: post, error: selectErr } = await supabase
      .from("posts")
      .select("feedback")
      .eq("id", currentPostId)
      .single();

    if (selectErr) {
      console.error("Lỗi lấy feedback hiện tại:", selectErr);
      alert("Không thể gửi feedback (lỗi khi lấy bài). Nếu bạn dùng RLS, hãy thêm policy FOR UPDATE.");
      return;
    }

    const current = Array.isArray(post.feedback) ? post.feedback : [];
    const updated = [...current, comment];

    // 2) update posts.feedback
    const { error: updateErr } = await supabase
      .from("posts")
      .update({ feedback: updated })
      .eq("id", currentPostId);

    if (updateErr) {
      console.error("Lỗi update feedback:", updateErr);
      alert("Lỗi khi gửi feedback (kiểm tra RLS/policy).");
      return;
    }

    // 3) clear form and immediately render updated comments (fast UX)
    document.getElementById("fb-name").value = "";
    document.getElementById("fb-email").value = "";
    document.getElementById("fb-content").value = "";

    renderFeedback(updated);

    // 4) optionally refetch from DB to ensure canonical state
    //    (some RLS or DB triggers may change stored value)
    setTimeout(() => renderPost(), 500);
  } catch (err) {
    console.error("addFeedback unexpected error:", err);
    alert("Đã xảy ra lỗi khi gửi feedback.");
  }
}

window.addFeedback = addFeedback;

// --- Realtime subscription (preferred) ------------------------------------
async function trySetupRealtime() {
  // if supabase.from(...).on is available (v1): use that; else try channel approach; fallback to polling.
  try {
    // v1 style (supabase-js older)
    if (supabase && typeof supabase.from === "function" && typeof supabase.from("posts")?.on === "function") {
      supabase
        .from(`posts:id=eq.${currentPostId}`)
        .on("UPDATE", payload => {
          if (payload?.new?.feedback) renderFeedback(payload.new.feedback);
        })
        .subscribe();
      realtimeSubscribed = true;
      return;
    }
  } catch (e) {
    // ignore
  }

  try {
    // v2 style: channel + postgres_changes
    if (supabase && typeof supabase.channel === "function") {
      const channel = supabase
        .channel(`posts-feedback-${currentPostId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "posts", filter: `id=eq.${currentPostId}` },
          (payload) => {
            if (payload?.new?.feedback) renderFeedback(payload.new.feedback);
          }
        )
        .subscribe((status) => {
          // status can be "SUBSCRIBED"
          // console.log("realtime status", status);
        });
      realtimeSubscribed = true;
      return;
    }
  } catch (e) {
    // ignore
  }

  // Fallback: polling every 5s
  pollingIntervalId = setInterval(() => {
    // re-fetch only feedback field for minimal payload
    supabase
      .from("posts")
      .select("feedback")
      .eq("id", currentPostId)
      .single()
      .then(({ data, error }) => {
        if (!error && data && Array.isArray(data.feedback)) {
          renderFeedback(data.feedback);
        }
      })
      .catch(err => console.error("Polling error:", err));
  }, 5000);
}
