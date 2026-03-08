// Hiển thị danh sách bài viết từ Supabase

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function showPosts() {
  const list = document.getElementById("post-list");
  if (!list) return;
  list.innerHTML = "Đang tải...";

  try {
    const { data: posts, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!posts || posts.length === 0) {
      list.innerHTML = "Chưa có bài viết.";
      return;
    }

    list.innerHTML = "";
    posts.forEach(p => {
      list.innerHTML += `
        <div class="post">
          <div class="post-title">
            <a href="post.html?id=${p.id}">${escapeHtml(p.title)}</a>
          </div>
          <div class="post-info">Người đăng: ${escapeHtml(p.author)}</div>
        </div>
      `;
    });
  } catch (err) {
    console.error("showPosts error:", err);
    if (list) list.innerText = "Lỗi tải bài viết.";
  }
}

// Hiển thị theo category (dùng cho các trang category)
async function showCategory(category) {
  const list = document.getElementById("post-list");
  if (!list) return;
  list.innerHTML = "Đang tải...";

  try {
    const { data: posts, error } = await supabase
      .from("posts")
      .select("*")
      .eq("category", category)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!posts || posts.length === 0) {
      list.innerHTML = "Chưa có bài viết.";
      return;
    }

    list.innerHTML = "";
    posts.forEach(p => {
      list.innerHTML += `
        <div class="post">
          <div class="post-title">
            <a href="post.html?id=${p.id}">${escapeHtml(p.title)}</a>
          </div>
          <div class="post-info">${escapeHtml(p.author)}</div>
        </div>
      `;
    });
  } catch (err) {
    console.error("showCategory error:", err);
    if (list) list.innerText = "Lỗi tải bài viết.";
  }
}

// Nếu cần chức năng thêm bài (nếu bạn muốn giữ form client-side),
// bạn có thể gọi API Supabase tương tự như trong admin.js.
// Hàm showPosts sẽ chạy tự động nếu gặp element #post-list
document.addEventListener("DOMContentLoaded", () => {
  showPosts();
});

// Cho phép gọi từ các file HTML/category.js
window.showCategory = showCategory;
window.showPosts = showPosts;
