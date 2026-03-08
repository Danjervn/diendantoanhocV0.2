// Admin client dùng Supabase (yêu cầu: supabaseClient.js đã khởi tạo `supabase`)

async function showAdminPosts() {
  const list = document.getElementById("admin-post-list");
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
      const thumbHtml = (p.images && p.images.length) ? `<div style="margin-top:6px;"><img src="${p.images[0]}" alt="thumb" style="height:60px;"></div>` : "";
      list.innerHTML += `
        <div class="post">
          <b>${escapeHtml(p.title)}</b><br>
          <small>${escapeHtml(p.author)} • ${escapeHtml(p.category || "")}</small>
          ${thumbHtml}
          <div style="margin-top:6px;">
            <button onclick="deletePost(${p.id})">Xóa</button>
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error(err);
    list.innerText = "Lỗi tải dữ liệu.";
  }
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function uploadFilesToStorage(files) {
  if (!files || files.length === 0) return null;
  const urls = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileExt = file.name.split('.').pop();
    const filename = `images/${Date.now()}-${Math.random().toString(36).slice(2,9)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("images").upload(filename, file, {
      cacheControl: "3600",
      upsert: false
    });
    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }
    const { data: urlData } = supabase.storage.from("images").getPublicUrl(filename);
    // getPublicUrl trả về object với publicUrl
    urls.push(urlData.publicUrl || urlData.publicURL || urlData);
  }
  return urls;
}

async function addPost() {
  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  const content = document.getElementById("content").value.trim();
  const category = document.getElementById("category").value;
  const fileInput = document.getElementById("image");
  const files = fileInput ? fileInput.files : null;

  if (!title || !author || !content) {
    alert("Vui lòng nhập đầy đủ thông tin (tiêu đề, tác giả, nội dung).");
    return;
  }

  try {
    let images = null;
    if (files && files.length > 0) {
      images = await uploadFilesToStorage(files);
    }

    const { data, error } = await supabase
      .from("posts")
      .insert([{
        title,
        author,
        content,
        category,
        images: images ? images : null
      }]);

    if (error) throw error;
    alert("Đăng bài thành công.");
    document.getElementById("post-form").reset();
    await showAdminPosts();
  } catch (err) {
    console.error(err);
    alert("Lỗi khi gửi bài: " + (err.message || err));
  }
}

async function deletePost(id) {
  if (!confirm("Bạn có chắc muốn xóa bài này?")) return;
  try {
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) throw error;
    await showAdminPosts();
  } catch (err) {
    console.error(err);
    alert("Xóa thất bại.");
  }
}

window.addPost = addPost;
window.deletePost = deletePost;

document.addEventListener("DOMContentLoaded", () => {
  showAdminPosts();
});
