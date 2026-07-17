(() => {
  "use strict";

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const INDEX_URL = "/data/search-index.json";
  let indexPromise;

  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const debounce = (fn, delay = 300) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  const normalise = (value = "") => value
    .toLocaleLowerCase("sv")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const getIndex = () => {
    if (!indexPromise) {
      indexPromise = fetch(INDEX_URL, { headers: { Accept: "application/json" } })
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        });
    }
    return indexPromise;
  };

  const header = qs("[data-header]");
  const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 8);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
  qsa("[data-year]").forEach((node) => { node.textContent = new Date().getFullYear(); });

  // Responsive navigation.
  const menuToggle = qs("[data-menu-toggle]");
  const mobileMenu = qs("[data-mobile-menu]");
  const setMenu = (open) => {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.setAttribute("aria-expanded", String(open));
    mobileMenu.hidden = !open;
    document.body.classList.toggle("menu-open", open);
    const label = qs(".menu-toggle__label", menuToggle);
    if (label) label.textContent = open ? "Stäng" : "Meny";
  };
  menuToggle?.addEventListener("click", () => setMenu(menuToggle.getAttribute("aria-expanded") !== "true"));
  qsa("a", mobileMenu || document.createElement("div")).forEach((link) => link.addEventListener("click", () => setMenu(false)));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 896) setMenu(false);
  });

  // Gentle entry animation.
  const revealNodes = qsa(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        instance.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -4%" });
    revealNodes.forEach((node) => observer.observe(node));
  } else {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
  }

  // Need finder on the home page.
  const finderData = {
    position: ["Rekommendation: Positionerat personlarm", "EkoTek och Birdy kan visa var larmet aktiveras och skicka det till rätt mottagare.", "/personlarm/", "Utforska personlarm"],
    call: ["Rekommendation: Hjälpknappen", "En tydlig trådlös knapp gör det enkelt för besökare eller personal att snabbt påkalla hjälp.", "/butik-service/", "Se Hjälpknappen"],
    alone: ["Rekommendation: Ensamarbetarlarm", "Bärbara larm med manuella och automatiska funktioner ger trygghet i riskutsatta miljöer.", "/ekotekfamiljen/", "Läs om ensamarbete"],
    care: ["Rekommendation: Kallelsesignalsystem", "Trådlösa och fasta lösningar kan anpassas för vård, omsorg och stödboenden.", "/vard-och-omsorg/", "Se lösningar för vård"]
  };
  const finderResult = qs("[data-finder-result]");
  qsa("[data-finder]").forEach((button) => {
    button.addEventListener("click", () => {
      qsa("[data-finder]").forEach((item) => item.classList.toggle("is-active", item === button));
      const result = finderData[button.dataset.finder];
      if (!result || !finderResult) return;
      finderResult.innerHTML = `<span>${escapeHtml(result[0])}</span><p>${escapeHtml(result[1])} <a href="${escapeHtml(result[2])}">${escapeHtml(result[3])} →</a></p>`;
    });
  });

  const cardImage = (item, className) => item.image
    ? `<div class="${className}"><img src="${escapeHtml(item.image)}" alt="" loading="lazy"></div>`
    : `<div class="${className}"><span class="archive-card__placeholder">LOTS Security</span></div>`;

  // Home-page product finder backed entirely by the exported local index.
  const productGrid = qs("[data-product-grid]");
  const productSearch = qs("[data-product-search]");
  const productStatus = qs("[data-product-status]");
  let activeProductTerm = "";

  const renderHomeProducts = async (term = "") => {
    if (!productGrid) return;
    productGrid.setAttribute("aria-busy", "true");
    if (productStatus) productStatus.textContent = "Söker…";
    try {
      const index = await getIndex();
      const needle = normalise(term);
      const products = index.items
        .filter((item) => item.type === "product")
        .filter((item) => !needle || item.search.includes(needle))
        .sort((a, b) => b.modified.localeCompare(a.modified))
        .slice(0, 3);

      productGrid.innerHTML = products.length ? products.map((item) => `
        <a class="product-card" href="${escapeHtml(item.path)}">
          ${cardImage(item, "product-card__image")}
          <div class="product-card__body">
            <p class="product-card__meta">${escapeHtml(item.category || "LOTS produkt")}</p>
            <h3>${escapeHtml(item.title)}</h3>
            <span class="text-link">Visa produkt <b aria-hidden="true">↗</b></span>
          </div>
        </a>`).join("") : `<div class="catalog-empty"><strong>Inga produkter hittades.</strong>Prova ett bredare sökord.</div>`;
      if (productStatus) productStatus.textContent = `${products.length} ${products.length === 1 ? "träff" : "träffar"}`;
    } catch {
      productGrid.innerHTML = `<div class="catalog-empty"><strong>Katalogen kunde inte läsas.</strong>Ladda om sidan eller öppna hela produktkatalogen.</div>`;
      if (productStatus) productStatus.textContent = "Kunde inte läsa katalogen";
    } finally {
      productGrid.setAttribute("aria-busy", "false");
    }
  };

  productSearch?.addEventListener("input", debounce(() => {
    activeProductTerm = productSearch.value.trim();
    qsa("[data-product-filter]").forEach((button) => button.classList.toggle("is-active", !activeProductTerm && button.dataset.productFilter === ""));
    renderHomeProducts(activeProductTerm);
  }));
  qsa("[data-product-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activeProductTerm = button.dataset.productFilter || "";
      if (productSearch) productSearch.value = activeProductTerm;
      qsa("[data-product-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
      renderHomeProducts(activeProductTerm);
    });
  });
  if (productGrid) renderHomeProducts();

  // Latest news on the home page.
  const newsGrid = qs("[data-news-grid]");
  const renderLatestNews = async () => {
    if (!newsGrid) return;
    try {
      const index = await getIndex();
      const posts = index.items
        .filter((item) => item.type === "post")
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 3);
      newsGrid.innerHTML = posts.map((item) => `
        <a class="news-card" href="${escapeHtml(item.path)}">
          ${cardImage(item, "news-card__image")}
          <div class="news-card__body">
            <div class="news-card__meta"><span>${escapeHtml(item.category || "Aktuellt")}</span><time>${escapeHtml(item.dateFormatted)}</time></div>
            <h3>${escapeHtml(item.title)}</h3>
            <span class="text-link">Läs mer <b aria-hidden="true">↗</b></span>
          </div>
        </a>`).join("");
    } catch {
      newsGrid.innerHTML = `<div class="archive-empty">Nyheterna kunde inte läsas just nu.</div>`;
    } finally {
      newsGrid.setAttribute("aria-busy", "false");
    }
  };
  if (newsGrid) renderLatestNews();

  // Generic archives, taxonomy pages and full-site search.
  const archiveRoot = qs("[data-archive]");
  if (archiveRoot) {
    const archiveGrid = qs("[data-archive-grid]", archiveRoot);
    const archiveInput = qs("[data-archive-search]", archiveRoot);
    const archiveCount = qs("[data-archive-count]", archiveRoot);
    const archivePagination = qs("[data-archive-pagination]", archiveRoot);
    const type = archiveRoot.dataset.type || "all";
    const taxonomy = archiveRoot.dataset.taxonomy || "";
    const pageSize = Number(archiveRoot.dataset.pageSize || 18);
    let currentPage = 1;
    let allItems = [];

    const matchesArchive = (item, query) => {
      if (type !== "all" && item.type !== type) return false;
      if (taxonomy && !item.termKeys.includes(taxonomy)) return false;
      return !query || item.search.includes(normalise(query));
    };

    const renderArchive = () => {
      const query = archiveInput?.value.trim() || "";
      const matches = allItems.filter((item) => matchesArchive(item, query));
      const pages = Math.max(1, Math.ceil(matches.length / pageSize));
      currentPage = Math.min(currentPage, pages);
      const start = (currentPage - 1) * pageSize;
      const pageItems = matches.slice(start, start + pageSize);

      if (archiveCount) archiveCount.textContent = `${matches.length} ${matches.length === 1 ? "träff" : "träffar"}`;
      if (archiveGrid) {
        archiveGrid.innerHTML = pageItems.length ? pageItems.map((item) => `
          <a class="archive-card ${item.type === "product" ? "archive-card--product" : ""}" href="${escapeHtml(item.path)}">
            ${cardImage(item, "archive-card__image")}
            <div class="archive-card__body">
              <div class="archive-card__meta"><span>${escapeHtml(item.category || item.typeLabel)}</span>${item.dateFormatted ? `<time>${escapeHtml(item.dateFormatted)}</time>` : ""}</div>
              <h2>${escapeHtml(item.title)}</h2>
              <p>${escapeHtml(item.excerpt)}</p>
              <span class="text-link">${item.type === "product" ? "Visa produkt" : "Läs mer"} <b aria-hidden="true">↗</b></span>
            </div>
          </a>`).join("") : `<div class="archive-empty"><strong>Inga träffar.</strong><br>Prova ett annat sökord.</div>`;
      }

      if (archivePagination) {
        const visiblePages = [];
        for (let page = 1; page <= pages; page += 1) {
          if (page === 1 || page === pages || Math.abs(page - currentPage) <= 2) visiblePages.push(page);
        }
        archivePagination.innerHTML = visiblePages.map((page, index) => {
          const previous = visiblePages[index - 1];
          const gap = previous && page - previous > 1 ? `<span aria-hidden="true">…</span>` : "";
          return `${gap}<button type="button" class="${page === currentPage ? "is-active" : ""}" data-page="${page}" aria-label="Sida ${page}">${page}</button>`;
        }).join("");
        qsa("[data-page]", archivePagination).forEach((button) => button.addEventListener("click", () => {
          currentPage = Number(button.dataset.page);
          renderArchive();
          archiveRoot.scrollIntoView({ behavior: "smooth", block: "start" });
        }));
      }
    };

    const params = new URLSearchParams(window.location.search);
    if (archiveInput && params.get("q")) archiveInput.value = params.get("q");
    archiveInput?.addEventListener("input", debounce(() => {
      currentPage = 1;
      const value = archiveInput.value.trim();
      const next = new URL(window.location.href);
      if (value) next.searchParams.set("q", value); else next.searchParams.delete("q");
      history.replaceState({}, "", next);
      renderArchive();
    }));

    getIndex().then((index) => {
      allItems = index.items;
      renderArchive();
      archiveRoot.setAttribute("aria-busy", "false");
    }).catch(() => {
      if (archiveGrid) archiveGrid.innerHTML = `<div class="archive-empty">Innehållet kunde inte läsas. Försök ladda om sidan.</div>`;
      archiveRoot.setAttribute("aria-busy", "false");
    });
  }
})();
