const CHUNK_SIZE = 45;
let allVideos = [], displayedVideos = [], currentIndex = 0;
let debounceTimer, isLoading = false, isSearchMode = false;

fetchVideos();
window.addEventListener("scroll", handleScroll);
if (window.innerWidth > 768) {
  document.getElementById("search").focus();
}
document.getElementById("search").addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(searchVideos, 300);
});

async function fetchVideos() {
  try {
    const res = await fetch("https://raw.githubusercontent.com/tvBeautifully/assets/refs/heads/main/BeautifulVideos.json");
    if (!res.ok) throw new Error("Network response failed");
    const data = await res.json();
    if (!Array.isArray(data.videos) || !data.videos.length) throw new Error("No video data");
    allVideos = data.videos;
  } catch (error) {
    console.error("Failed to fetch video list:", error);
    allVideos = [{
      id: 1,
      url: "https://raw.githubusercontent.com/PickleTv-com/PickleTv-Videos/main/file_example_MP4_1920_18MG.mp4",
      poster: "https://raw.githubusercontent.com/PickleTv-com/PickleTv-Videos/main/file_00000000e3ec61f7afe98d79792a89e9%20(1).png",
      title: "Failed to load video data",
      channel: "Beautifully Originals",
      likes: 0,
      description: "Maybe the server is busy, or your internet is causing problems."
    }];
    renderVideos(allVideos);
  }
  markLiked();
  loadNextVideos();
}

function markLiked() {
  const liked = JSON.parse(localStorage.getItem("likedVideos") || "[]");
  allVideos.forEach(v => { if (liked.includes(v.id)) v.liked = true; });
}

function loadNextVideos() {
  if (isLoading || currentIndex >= allVideos.length) return;
  isLoading = true;
  try {
    const nextChunk = allVideos.slice(currentIndex, currentIndex + CHUNK_SIZE);
    displayedVideos = displayedVideos.concat(nextChunk);
    currentIndex += CHUNK_SIZE;
    renderVideos(nextChunk);
  } finally {
    isLoading = false;
  }
}

function renderVideos(videos) {
  const container = document.getElementById("video-list");
  document.querySelector(".loading")?.remove();
  if (currentIndex === CHUNK_SIZE || isSearchMode) container.innerHTML = "";

  if (!videos.length) {
    const p = document.createElement("p");
    p.textContent = "No videos found.";
    p.style.textAlign = "center";
    p.style.padding = "40px";
    p.style.color = "#aaa";
    container.appendChild(p);
    return;
  }

  videos.forEach(video => {
    if (!video.id) return;
    const card = document.createElement("div");
    card.className = "video-card";

    const thumb = document.createElement("div");
    thumb.className = "video-thumb-container";

    const img = document.createElement("img");
    img.src = video.poster || "https://via.placeholder.com/320x180.png?text=No+Image";
    img.alt = video.title || "Video thumbnail";
    img.loading = "lazy";

    const vid = document.createElement("video");
    vid.src = video.url;
    vid.poster = video.poster;
    vid.controls = true;
    vid.muted = true;
    vid.preload = "none";
    vid.title = video.title;
    vid.setAttribute("controlsList", "nodownload");
    vid.style.display = "none";

    let hoverTimer;
    if (window.innerWidth > 768) {
      thumb.onmouseenter = () => {
        hoverTimer = setTimeout(() => {
          vid.style.display = "block";
          img.style.display = "none";
          vid.play().catch(() => {});
        }, 300);
      };
      thumb.onmouseleave = () => {
        clearTimeout(hoverTimer);
        vid.pause();
        vid.currentTime = 0;
        vid.style.display = "none";
        img.style.display = "block";
      };
    }

    thumb.appendChild(img);
    thumb.appendChild(vid);
    card.appendChild(thumb);

    const info = document.createElement("div");
    info.className = "video-info";

    const title = document.createElement("h3");
    title.textContent = video.title;

    const channel = document.createElement("p");
    channel.textContent = `${video.channel || "Unknown"} • ${video.likes} likes`;
    channel.id = `like-${video.id}`;

    const desc = document.createElement("p");
    const descText = video.description || "";
    desc.textContent = descText.length > 68 ? descText.slice(0, 68) + "..." : descText;

    const btnGroup = document.createElement("div");
    btnGroup.className = "btn-group";

    const likeBtn = document.createElement("button");
    likeBtn.className = "btn";
    likeBtn.type = "button";
    likeBtn.textContent = "Like";
    likeBtn.setAttribute("aria-label", "Like this video");
    if (video.liked) likeBtn.classList.add("liked");
    likeBtn.onclick = () => likeVideo(video.id, likeBtn);

    const downloadBtn = document.createElement("button");
    downloadBtn.className = "btn";
    downloadBtn.type = "button";
    downloadBtn.textContent = "Download";
    downloadBtn.setAttribute("aria-label", "Download this video");
    const adUrl = video.adUrl && video.adUrl.startsWith("http") ? video.adUrl : "";
    downloadBtn.onclick = () => playAdThenDownload(adUrl, video.url);

    btnGroup.appendChild(likeBtn);
    btnGroup.appendChild(downloadBtn);

    info.appendChild(title);
    info.appendChild(channel);
    info.appendChild(desc);
    info.appendChild(btnGroup);
    card.appendChild(info);
    container.appendChild(card);
  });
}

function likeVideo(id, btn) {
  const liked = JSON.parse(localStorage.getItem("likedVideos") || "[]");
  const video = allVideos.find(v => v.id === id);
  const index = liked.indexOf(id);

  if (index !== -1) {
    liked.splice(index, 1);
    if (video) {
      video.likes--;
      video.liked = false;
      document.getElementById("like-" + id).textContent = `${video.channel || "Unknown"} • ${video.likes} likes`;
    }
    btn.classList.remove("liked");
  } else {
    liked.push(id);
    if (video) {
      video.likes++;
      video.liked = true;
      document.getElementById("like-" + id).textContent = `${video.channel || "Unknown"} • ${video.likes} likes`;
    }
    btn.classList.add("liked");
  }

  localStorage.setItem("likedVideos", JSON.stringify(liked));
}

function playAdThenDownload(adUrl, downloadUrl) {
  if (!adUrl) {
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  const overlay = document.getElementById("video-ad-overlay");
  const adVideo = document.getElementById("video-ad");
  adVideo.src = adUrl;
  adVideo.currentTime = 0;
  adVideo.controls = false;
  adVideo.autoplay = true;
  overlay.style.display = "flex";
  adVideo.onended = () => {
    overlay.style.display = "none";
    adVideo.src = "";
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
}

function handleScroll() {
  if (isSearchMode) return;
  const scrollY = window.scrollY;
  const windowHeight = window.innerHeight;
  const fullHeight = document.body.offsetHeight;
  if (scrollY + windowHeight >= fullHeight - 100) loadNextVideos();
}

function searchVideos() {
  const term = document.getElementById("search").value.trim().toLowerCase();
  const container = document.getElementById("video-list");
  container.innerHTML = "";
  isSearchMode = !!term;

  if (!term) {
    displayedVideos = [];
    currentIndex = 0;
    isSearchMode = false;
    loadNextVideos();
    return;
  }

  const filtered = allVideos.filter(v =>
    (v.title || "").toLowerCase().includes(term) ||
    (v.channel || "").toLowerCase().includes(term) ||
    (v.description || "").toLowerCase().includes(term)
  );

  displayedVideos = filtered;
  currentIndex = filtered.length;
  renderVideos(displayedVideos);
}
