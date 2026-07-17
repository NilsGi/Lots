(() => {
  "use strict";

  const API_BASE = "https://www.lotsab.se/wp-json/wp/v2";
  const PRODUCT_PLACEHOLDER = "https://www.lotsab.se/wp-content/uploads/LOTS-logo-web_340x156.png";

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const decodeEntities = (value = "") => {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = value;
    return textarea.value;
  };

  const textOnly = (html = "") => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  };

  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const debounce = (fn, delay = 350) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  // Sticky header and footer year
  const header = qs("[data-header]");
  const updateHeader = () => header?.classList.toggle("is-scrolled", window.scrollY > 8);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
  qsa("[data-year]").forEach((node) => { node.textContent = new Date().getFullYear(); });

  // Mobile navigation
  const menuToggle = qs("[data-menu-toggle]");
  const mobileMenu = qs("[data-mobile-menu]");

  const setMenu = (open) => {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.setAttribute("aria-expanded", String(open));
    mobileMenu.hidden = !open;
    document.body.classList.toggle("menu-open", open);
    qs(".menu-toggle__label", menuToggle).textContent = open ? "Stäng" : "Meny";
  };

  menuToggle?.addEventListener("click", () => setMenu(menuToggle.getAttribute("aria-expanded") !== "true"));
  qsa("a", mobileMenu || document.createElement("div")).forEach((link) => link.addEventListener("click", () => setMenu(false)));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 896) setMenu(false);
  });

  // Entry animation, with a safe no-JS-looking fallback
  const revealNodes = qsa(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -5%" });
    revealNodes.forEach((node) => revealObserver.observe(node));
  } else {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
  }

  // Quick needs finder
  const finderData = {
    position: {
      label: "Rekommendation: Positionerat personlarm",
      text: "EkoTek och Birdy kan visa var larmet aktiveras och skicka det vidare till rätt mottagare.",
      url: "https://www.lotsab.se/personlarm/",
      link: "Utforska personlarm"
    },
    call: {
      label: "Rekommendation: Hjälpknappen",
      text: "En tydlig trådlös knapp gör det enkelt för besökare eller personal att snabbt påkalla hjälp.",
      url: "https://www.lotsab.se/butik-service/",
      link: "Se Hjälpknappen"
    },
    alone: {
      label: "Rekommendation: Ensamarbetarlarm",
      text: "Bärbara larm med manuella och automatiska funktioner ger trygghet i riskutsatta miljöer.",
      url: "https://www.lotsab.se/ekotekfamiljen/",
      link: "Läs om ensamarbete"
    },
    care: {
      label: "Rekommendation: Kallelsesignalsystem",
      text: "Trådlösa och fasta lösningar kan anpassas för vård, omsorg och stödboenden.",
      url: "https://www.lotsab.se/vard-och-omsorg/",
      link: "Se lösningar för vård"
    }
  };

  const finderResult = qs("[data-finder-result]");
  qsa("[data-finder]").forEach((button) => {
    button.addEventListener("click", () => {
      qsa("[data-finder]").forEach((item) => item.classList.toggle("is-active", item === button));
      const result = finderData[button.dataset.finder];
      if (!result || !finderResult) return;
      finderResult.innerHTML = `
        <span>${escapeHtml(result.label)}</span>
        <p>${escapeHtml(result.text)} <a href="${escapeHtml(result.url)}">${escapeHtml(result.link)} →</a></p>`;
    });
  });

  // Live product catalog from the existing WordPress/WooCommerce content
  const productGrid = qs("[data-product-grid]");
  const productSearch = qs("[data-product-search]");
  const productStatus = qs("[data-product-status]");
  let productController;
  let activeProductTerm = "";

  const fallbackProducts = [
    {
      title: "MY Salcom larmknapp – 1 knapp",
      link: "https://www.lotsab.se/produkt/my-barbar-salcom-larmknapp-1-knapp/",
      image: "https://www.lotsab.se/wp-content/uploads/Salcom-singelknapp-utan-bakgrund-1-708x1030.png",
      category: "MY larmsystem"
    },
    {
      title: "WP 100 Textmottagare för handled UHF",
      link: "https://www.lotsab.se/produkt/wp-100-textmottagare-for-handled-uhf/",
      image: "https://www.lotsab.se/wp-content/uploads/WP-100_01.png",
      category: "Personsökning"
    },
    {
      title: "Birdy IoT – positionerat larmsystem",
      link: "https://www.lotsab.se/birdy-iot-larmsystem-med-positionering-och-dubbelriktad-kommunikation/",
      image: "https://www.lotsab.se/wp-content/uploads/Front-roddisplay_500.png",
      category: "Personlarm"
    }
  ];

  const embeddedImage = (item) => {
    const media = item?._embedded?.["wp:featuredmedia"]?.[0];
    return media?.media_details?.sizes?.medium?.source_url
      || media?.media_details?.sizes?.woocommerce_thumbnail?.source_url
      || media?.source_url
      || "";
  };

  const embeddedCategory = (item) => {
    const termGroups = item?._embedded?.["wp:term"] || [];
    const terms = termGroups.flat().filter(Boolean);
    const useful = terms.find((term) => term.taxonomy === "product_cat" && !/uncategorized/i.test(term.name));
    return useful?.name || "LOTS produkt";
  };

  const normaliseProduct = (item) => ({
    title: decodeEntities(textOnly(item?.title?.rendered || "Produkt")),
    link: item?.link || "https://www.lotsab.se/produktkatalog/",
    image: embeddedImage(item),
    category: decodeEntities(embeddedCategory(item))
  });

  const renderProducts = (products, isFallback = false) => {
    if (!productGrid) return;
    productGrid.setAttribute("aria-busy", "false");
    if (!products.length) {
      productGrid.innerHTML = `
        <div class="catalog-empty">
          <strong>Inga produkter hittades.</strong>
          Prova ett bredare sökord eller öppna hela produktkatalogen.
        </div>`;
      return;
    }

    productGrid.innerHTML = products.map((product) => `
      <a class="product-card" href="${escapeHtml(product.link)}">
        <div class="product-card__image">
          ${product.image
            ? `<img src="${escapeHtml(product.image)}" alt="" loading="lazy" onerror="this.closest('.product-card__image').innerHTML='<span>LOTS<br>Security</span>'">`
            : "<span>LOTS<br>Security</span>"}
        </div>
        <div class="product-card__body">
          <p class="product-card__meta">${escapeHtml(product.category)}</p>
          <h3>${escapeHtml(product.title)}</h3>
          <span class="text-link">Visa produkt <b aria-hidden="true">↗</b></span>
        </div>
      </a>`).join("");

    if (productStatus) {
      const suffix = isFallback ? " · sparad reservvisning" : "";
      productStatus.textContent = `${products.length} ${products.length === 1 ? "träff" : "träffar"}${suffix}`;
    }
  };

  const loadProducts = async (term = "") => {
    if (!productGrid) return;
    productController?.abort();
    productController = new AbortController();
    productGrid.setAttribute("aria-busy", "true");
    if (productStatus) productStatus.textContent = "Söker…";

    const params = new URLSearchParams({
      per_page: "6",
      _embed: "1",
      orderby: "modified",
      order: "desc"
    });
    if (term.trim()) params.set("search", term.trim());

    try {
      const response = await fetch(`${API_BASE}/product?${params}`, {
        signal: productController.signal,
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const items = await response.json();
      renderProducts(items.map(normaliseProduct));
    } catch (error) {
      if (error.name === "AbortError") return;
      const filteredFallback = term
        ? fallbackProducts.filter((item) => `${item.title} ${item.category}`.toLocaleLowerCase("sv").includes(term.toLocaleLowerCase("sv")))
        : fallbackProducts;
      renderProducts(filteredFallback.length ? filteredFallback : fallbackProducts, true);
    }
  };

  const runProductSearch = debounce(() => {
    const typed = productSearch?.value.trim() || "";
    activeProductTerm = typed;
    qsa("[data-product-filter]").forEach((button) => button.classList.toggle("is-active", !typed && button.dataset.productFilter === ""));
    loadProducts(typed);
  });

  productSearch?.addEventListener("input", runProductSearch);
  qsa("[data-product-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activeProductTerm = button.dataset.productFilter || "";
      if (productSearch) productSearch.value = activeProductTerm;
      qsa("[data-product-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
      loadProducts(activeProductTerm);
    });
  });
  loadProducts(activeProductTerm);

  // Live news, also backed by local fallbacks for offline previews
  const newsGrid = qs("[data-news-grid]");
  const fallbackNews = [
    {
      title: "Trevlig sommar!",
      link: "https://www.lotsab.se/nyheter/trevlig-sommar-2/",
      image: "https://www.lotsab.se/wp-content/uploads/Designer-14.png",
      date: "30 juni 2026",
      category: "Aktuellt"
    },
    {
      title: "Nyhet för sim- och idrottshallar",
      link: "https://www.lotsab.se/nyheter/%f0%9f%91%89-nyhet-sim-och-idrottshallar/",
      image: "https://www.lotsab.se/wp-content/uploads/N%C3%96DLARM-250x250_2018-1.png",
      date: "22 juni 2026",
      category: "Simhall"
    },
    {
      title: "Nytt samarbete med Alerta",
      link: "https://www.lotsab.se/nyheter/nytt-samarbete-med-alerta-tillbehor-till-kallelsesignalsystem/",
      image: "https://www.lotsab.se/wp-content/uploads/BAM.2-500.jpg",
      date: "16 juni 2026",
      category: "Vård & omsorg"
    }
  ];

  const formatDate = (dateString) => new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(dateString));

  const normaliseNews = (item) => ({
    title: decodeEntities(textOnly(item?.title?.rendered || "Nyhet från LOTS")),
    link: item?.link || "https://www.lotsab.se/nyheter/",
    image: embeddedImage(item) || PRODUCT_PLACEHOLDER,
    date: formatDate(item?.date),
    category: decodeEntities(item?._embedded?.["wp:term"]?.flat()?.find((term) => term?.taxonomy === "category")?.name || "Aktuellt")
  });

  const renderNews = (items) => {
    if (!newsGrid) return;
    newsGrid.setAttribute("aria-busy", "false");
    newsGrid.innerHTML = items.map((item) => `
      <a class="news-card" href="${escapeHtml(item.link)}">
        <div class="news-card__image"><img src="${escapeHtml(item.image)}" alt="" loading="lazy"></div>
        <div class="news-card__body">
          <div class="news-card__meta"><span>${escapeHtml(item.category)}</span><time>${escapeHtml(item.date)}</time></div>
          <h3>${escapeHtml(item.title)}</h3>
          <span class="text-link">Läs mer <b aria-hidden="true">↗</b></span>
        </div>
      </a>`).join("");
  };

  const loadNews = async () => {
    if (!newsGrid) return;
    try {
      const response = await fetch(`${API_BASE}/posts?per_page=3&_embed=1`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const items = await response.json();
      renderNews(items.map(normaliseNews));
    } catch {
      renderNews(fallbackNews);
    }
  };
  loadNews();
})();
