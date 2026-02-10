(async function () {
  const listEl = document.getElementById("posts-list");
  const pagEl = document.getElementById("posts-pagination");
  if (!listEl || !pagEl) return;

  const perPage = parseInt(listEl.dataset.perPage || "10", 10);

  // مسیر base برای وقتی که سایت زیرمسیر (repo) هاست می‌شود
  const canonical = document.querySelector('link[rel="canonical"]')?.href;
  const base = canonical ? new URL(canonical).pathname.replace(/\/$/, "") : "";
  const idxUrl = `${base}/search/search_index.json`;

  function getPageFromHash() {
    const m = (location.hash || "").match(/page=(\d+)/);
    return m ? Math.max(1, parseInt(m[1], 10)) : 1;
  }

  function setPageHash(p) {
    location.hash = `page=${p}`;
  }

  function extractDate(loc) {
    // چون post_url_format شما {date}/{slug} است، تاریخ در URL می‌آید
    const m = loc.match(/(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : "0000-00-00";
  }
function isPost(loc) {
  return loc.startsWith("blog/");
}


  function renderPage(posts, page) {
    const totalPages = Math.max(1, Math.ceil(posts.length / perPage));
    page = Math.min(Math.max(1, page), totalPages);

    const start = (page - 1) * perPage;
    const chunk = posts.slice(start, start + perPage);

    // لیست
    if (!chunk.length) {
      listEl.innerHTML = "<em>فعلاً پستی پیدا نشد.</em>";
    } else {
      const ul = document.createElement("ul");
      chunk.forEach(p => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = `${base}/${p.location}`.replace(/\/+/, "/");
        a.textContent = p.title || p.location;

        const small = document.createElement("small");
        small.style.marginRight = "0.5rem";
        small.textContent = `(${p.date})`;

        li.appendChild(a);
        li.appendChild(document.createTextNode(" "));
        li.appendChild(small);

        // خلاصه کوتاه (اختیاری)
        if (p.text) {
          const excerpt = p.text.trim().replace(/\s+/g, " ").slice(0, 140);
          if (excerpt) {
            const div = document.createElement("div");
            div.textContent = excerpt + (p.text.length > 140 ? "…" : "");
            li.appendChild(div);
          }
        }

        ul.appendChild(li);
      });
      listEl.innerHTML = "";
      listEl.appendChild(ul);
    }

    // صفحه‌بندی
    pagEl.innerHTML = "";
    const nav = document.createElement("div");

    const prev = document.createElement("button");
    prev.textContent = "قبلی";
    prev.disabled = page <= 1;
    prev.onclick = () => setPageHash(page - 1);

    const next = document.createElement("button");
    next.textContent = "بعدی";
    next.disabled = page >= totalPages;
    next.onclick = () => setPageHash(page + 1);

    const info = document.createElement("span");
    info.style.margin = "0 0.75rem";
    info.textContent = `صفحه ${page} از ${totalPages}`;

    nav.appendChild(prev);
    nav.appendChild(info);
    nav.appendChild(next);

    pagEl.appendChild(nav);
  }

  try {
    const res = await fetch(idxUrl, { cache: "no-cache" });
    if (!res.ok) throw new Error("search index fetch failed");
    const data = await res.json();

    const docs = Array.isArray(data.docs) ? data.docs : [];

    let posts = docs
      .filter(d => d && typeof d.location === "string")
      .filter(d => isPost(d.location))
      .map(d => ({
        title: d.title,
        location: d.location,
        text: d.text || "",
        date: extractDate(d.location),
      }));

    // جدید به قدیم
    posts.sort((a, b) => b.date.localeCompare(a.date));

    // اولین رندر
    renderPage(posts, getPageFromHash());

    // وقتی صفحه عوض شد
    window.addEventListener("hashchange", () => {
      renderPage(posts, getPageFromHash());
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  } catch (e) {
    listEl.innerHTML = "<em>نتونستم لیست پست‌ها رو بارگذاری کنم.</em>";
  }
})();
