// LẤY BÀI VIẾT
let posts = JSON.parse(localStorage.getItem("posts"));
if (posts === null) {
    posts = [];
}

// HIỂN THỊ BÀI THEO CHỦ ĐỀ
function showCategory(category) {
    let list = document.getElementById("post-list");
    list.innerHTML = "";

    for (let i = 0; i < posts.length; i++) {
        if (posts[i].category === category) {
            list.innerHTML += `
                <div class="post">
                    <div class="post-title">
                        <a href="post.html?id=${i}">
                            ${posts[i].title}
                        </a>
                    </div>
                    <div class="post-info">
                        ${posts[i].author}
                    </div>
                </div>
            `;
        }
    }

    if (list.innerHTML === "") {
        list.innerHTML = "Chưa có bài viết.";
    }
}
