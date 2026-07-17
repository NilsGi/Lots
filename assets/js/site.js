(() => {
  "use strict";

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const normalise = (value = "") => String(value).toLocaleLowerCase("sv").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const escapeHtml = (value = "") => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

  const menuButton = qs("[data-menu-button]");
  const mobileNav = qs("[data-mobile-nav]");
  const setMenu = (open) => {
    if (!menuButton || !mobileNav) return;
    menuButton.setAttribute("aria-expanded", String(open));
    mobileNav.hidden = !open;
    document.body.classList.toggle("menu-open", open);
    const label = qs("span", menuButton);
    if (label) label.textContent = open ? "Stäng" : "Meny";
  };
  menuButton?.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
  qsa("a", mobileNav || document.createElement("nav")).forEach((link) => link.addEventListener("click", () => setMenu(false)));
  window.addEventListener("keydown", (event) => { if (event.key === "Escape") setMenu(false); });
  window.addEventListener("resize", () => { if (window.innerWidth > 896) setMenu(false); });

  const archive = qs("[data-archive]");
  if (!archive) return;

  const grid = qs("[data-archive-grid]", archive);
  const input = qs("[data-archive-search]", archive);
  const select = qs("[data-archive-sort]", archive);
  const status = qs("[data-archive-status]", archive);
  const pagination = qs("[data-pagination]", archive);
  const type = archive.dataset.type || "all";
  const taxonomy = archive.dataset.taxonomy || "";
  const initialQuery = archive.dataset.query || "";
  const pageSize = 15;
  let items = [];
  let currentPage = 1;

  if (input) {
    const query = new URLSearchParams(location.search).get("q") || initialQuery;
    input.value = query;
  }

  const card = (item) => `
    <a class="card" href="${escapeHtml(item.path)}">
      ${item.image ? `<div class="card__image"><img src="${escapeHtml(item.image)}" alt="" loading="lazy"></div>` : `<div class="card__image card__image--empty"><span>LOTS</span></div>`}
      <div class="card__body">
        <div class="card__meta"><span>${escapeHtml(item.category || item.typeLabel)}</span>${item.dateFormatted ? `<time>${escapeHtml(item.dateFormatted)}</time>` : ""}</div>
        <h2>${escapeHtml(item.title)}</h2>
        <p>${escapeHtml(item.excerpt || "")}</p>
        <strong>${item.type === "product" ? "Visa produkt" : "Läs mer"} <span aria-hidden="true">→</span></strong>
      </div>
    </a>`;

  const render = () => {
    const needle = normalise(input?.value.trim() || "");
    const sort = select?.value || (type === "product" ? "alpha" : "date");
    const filtered = items.filter((item) => {
      if (type !== "all" && item.type !== type) return false;
      if (taxonomy && !(item.termKeys || []).includes(taxonomy)) return false;
      return !needle || normalise(item.search || `${item.title} ${item.excerpt} ${item.category}`).includes(needle);
    });

    filtered.sort((a, b) => {
      if (sort === "date") return String(b.date || "").localeCompare(String(a.date || ""));
      if (sort === "updated") return String(b.modified || "").localeCompare(String(a.modified || ""));
      return String(a.title || "").localeCompare(String(b.title || ""), "sv", { sensitivity: "base" });
    });

    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    currentPage = Math.min(currentPage, pageCount);
    const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    if (status) status.textContent = `${filtered.length} ${filtered.length === 1 ? "träff" : "träffar"}`;
    if (grid) grid.innerHTML = visible.length ? visible.map(card).join("") : '<div class="archive-empty"><strong>Inga träffar.</strong><br>Prova ett annat sökord.</div>';

    if (pagination) {
      const pages = [];
      for (let page = 1; page <= pageCount; page += 1) {
        if (page === 1 || page === pageCount || Math.abs(page - currentPage) <= 2) pages.push(page);
      }
      pagination.innerHTML = pages.map((page, index) => {
        const gap = index > 0 && page - pages[index - 1] > 1 ? '<span aria-hidden="true">…</span>' : "";
        return `${gap}<button type="button" class="${page === currentPage ? "is-active" : ""}" data-page="${page}" aria-label="Sida ${page}"${page === currentPage ? ' aria-current="page"' : ""}>${page}</button>`;
      }).join("");
      qsa("[data-page]", pagination).forEach((button) => button.addEventListener("click", () => {
        currentPage = Number(button.dataset.page);
        render();
        archive.scrollIntoView({ behavior: "smooth", block: "start" });
      }));
    }
  };

  let searchTimer;
  input?.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentPage = 1;
      const next = new URL(location.href);
      if (input.value.trim()) next.searchParams.set("q", input.value.trim()); else next.searchParams.delete("q");
      history.replaceState({}, "", next);
      render();
    }, 220);
  });
  select?.addEventListener("change", () => { currentPage = 1; render(); });

  fetch("/assets/data/search-index.json", { headers: { Accept: "application/json" } })
    .then((response) => { if (!response.ok) throw new Error(String(response.status)); return response.json(); })
    .then((data) => { items = data.items || []; render(); })
    .catch(() => {
      if (status) status.textContent = "Innehållet kunde inte läsas.";
      if (grid) grid.innerHTML = '<div class="archive-empty">Försök ladda om sidan.</div>';
    });
})();
