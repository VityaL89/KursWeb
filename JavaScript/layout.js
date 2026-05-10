const LAYOUT_CART_SIDEBAR_HTML = `
<div id="cart-sidebar" class="cart-sidebar" style="display: none;">
    <div class="cart-sidebar-content">
        <div class="cart-sidebar-header">
            <h2 style="font-family: 'Montserrat', sans-serif; font-size: 22.5px; font-weight: 700; margin: 0;">Your order</h2>
            <button id="cart-close-btn" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
        </div>
        <div class="cart-sidebar-body" id="cart-items-container"></div>
        <div class="cart-sidebar-footer">
            <div class="cart-total-row">
                <span style="font-family: 'Hind', sans-serif; font-size: 18px; font-weight: 500;">Total</span>
                <span id="cart-total-price" style="font-family: 'Montserrat', sans-serif; font-size: 22.5px; font-weight: 700;">€ 0,00</span>
            </div>
            <button id="cart-checkout-btn" style="width: 100%; height: 56px; background-color: #202020; color: #ffffff; border: none; border-radius: 4px; font-size: 18px; font-weight: 500; cursor: pointer;">Checkout</button>
        </div>
    </div>
</div>

<div id="cart-overlay" class="cart-overlay" style="display: none;"></div>
`;

const LAYOUT_MOBILE_MENU_OVERLAY_HTML = `
<div id="mobile-menu-overlay" class="mobile-menu-overlay" style="display: none;"></div>
`;

const THEME_STORAGE_KEY = "theme";
const A11Y_STORAGE_KEY = "a11y";

function ensureThemeStyles() {
  if (document.getElementById("layout-theme-styles")) return;
  const link = document.createElement("link");
  link.id = "layout-theme-styles";
  link.rel = "stylesheet";
  link.href = "theme.css";
  document.head.appendChild(link);
}

function ensureA11yStyles() {
  if (document.getElementById("layout-a11y-styles")) return;
  const link = document.createElement("link");
  link.id = "layout-a11y-styles";
  link.rel = "stylesheet";
  link.href = "a11y.css";
  document.head.appendChild(link);
}

function getPreferredTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_STORAGE_KEY, next);
  applyTheme(next);
}

function applyA11y(isOn) {
  document.documentElement.setAttribute("data-a11y", isOn ? "on" : "off");
}

function getPreferredA11y() {
  const saved = localStorage.getItem(A11Y_STORAGE_KEY);
  if (saved === "on") return true;
  if (saved === "off") return false;
  return false;
}

function toggleA11y() {
  const current = document.documentElement.getAttribute("data-a11y") || "off";
  const nextIsOn = current !== "on";
  localStorage.setItem(A11Y_STORAGE_KEY, nextIsOn ? "on" : "off");
  applyA11y(nextIsOn);
}

function ensureGoogleTranslate() {
  if (!window.googleTranslateElementInit) {
    window.googleTranslateElementInit = function () {
      const mount = document.getElementById("google_translate_element");
      if (!mount) return;
      if (mount.childElementCount > 0) return;
      if (!window.google || !window.google.translate || !window.google.translate.TranslateElement) return;

      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,ru",
          autoDisplay: false,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        },
        "google_translate_element"
      );
    };
  }

  if (!document.getElementById("google-translate-script")) {
    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.head.appendChild(script);
  } else {
    if (typeof window.googleTranslateElementInit === "function") {
      window.googleTranslateElementInit();
    }
  }
}

function getCookieValue(name) {
  const cookie = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  if (!cookie) return "";
  return decodeURIComponent(cookie.split("=").slice(1).join("="));
}

function setGoogleTranslateLanguage(lang) {
  const value = lang === "ru" ? "/en/ru" : "/en/en";
  document.cookie = `googtrans=${encodeURIComponent(value)};path=/`;
  document.cookie = `googtrans=${encodeURIComponent(value)};path=/;SameSite=Lax`;
  window.location.reload();
}

function renderSiteHeader() {
  return `
<header class="header">
    <div class="container">
        <button class="burger-menu" aria-label="Открыть меню">
            <span class="burger-line"></span>
            <span class="burger-line"></span>
            <span class="burger-line"></span>
        </button>

        <a href="index.html" class="logo">
            <img src="images/Logo.png" alt="MealDrop Logo" class="logo-icon">
            <span>MealDrop</span>
        </a>

        <nav class="nav-wrapper">

            <div class="nav-actions">
                <button class="theme-toggle" id="theme-toggle" type="button" aria-label="Toggle theme">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79Z" stroke="#1A1A1A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>

                <button class="a11y-toggle" id="a11y-toggle" type="button" aria-label="Accessibility mode">
                    A
                </button>

                <select class="lang-select" id="lang-select" aria-label="Language">
                    <option value="en">EN</option>
                    <option value="ru">RU</option>
                </select>


                <button class="btn-profile-header" id="header-profile-btn" type="button" aria-label="Profile">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 21C20 18.7909 16.4183 17 12 17C7.58172 17 4 18.7909 4 21" stroke="#1A1A1A" stroke-width="2" stroke-linecap="round"/>
                        <path d="M12 14C14.2091 14 16 12.2091 16 10C16 7.79086 14.2091 6 12 6C9.79086 6 8 7.79086 8 10C8 12.2091 9.79086 14 12 14Z" stroke="#1A1A1A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>

            <div id="google_translate_element" style="display:none"></div>
            
            <ul class="nav-links">
                <li><a href="index.html" class="nav-home">Home</a></li>
                <li><a href="Restaurants.html" class="nav-all">All restaurants</a></li>
            </ul>

            <button class="nav-cart is-empty" id="header-cart-btn" aria-label="Cart">
                <img src="images/ShoppingCart.png" alt="Cart" class="cart-icon">
                <span class="cart-total-wrapper" aria-hidden="true">
                    <span class="cart-total-label">Order</span>
                    <span class="cart-total" id="header-cart-total">€ 0,00</span>
                </span>
            </button>
        </nav>
    </div>
</header>
`;
}

function renderSiteFooter() {
  return `
<footer class="footer">
    <div class="container">
        <div class="footer-content">
            <div class="footer-logo">
                <a href="index.html">
                    <img src="images/logoFooter.png" alt="MealDrop Logo" class="footer-logo-img">
                </a>
            </div>

            <div class="footer-nav">
                <div class="footer-column">
                    <h4 class="footer-col-title">Discover us</h4>
                    <ul class="footer-links">
                        <li><a href="index.html">Home</a></li>
                        <li><a href="Categories.html">Categories</a></li>
                        <li><a href="About.html">About</a></li>
                    </ul>
                </div>
                <div class="footer-column">
                    <h4 class="footer-col-title">Our social media</h4>
                    <ul class="footer-links">
                        <li><a href="#">Facebook</a></li>
                        <li><a href="#">Instagram</a></li>
                        <li><a href="#">Twitter</a></li>
                    </ul>
                </div>
                <div class="footer-column">
                    <h4 class="footer-col-title">Check our apps</h4>
                    <ul class="footer-links">
                        <li><a href="#">Link</a></li>
                        <li><a href="#">Link</a></li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</footer>
`;
}

function injectLayout() {
  ensureThemeStyles();
  applyTheme(getPreferredTheme());

  ensureA11yStyles();
  applyA11y(getPreferredA11y());

  ensureGoogleTranslate();

  if (!document.getElementById("layout-cart-styles")) {
    const link = document.createElement("link");
    link.id = "layout-cart-styles";
    link.rel = "stylesheet";
    link.href = "cart-sidebar.css";
    document.head.appendChild(link);
  }

  const pathname = (window.location && window.location.pathname) ? window.location.pathname : "";
  const isCategoriesChildPage = pathname.toLowerCase().endsWith("/categorieschild.html") ||
    pathname.toLowerCase().endsWith("\\categorieschild.html") ||
    pathname.toLowerCase().endsWith("categorieschild.html");

  const headerMount = document.getElementById("site-header");
  if (headerMount) {
    headerMount.outerHTML = renderSiteHeader();
  }

  const footerMount = document.getElementById("site-footer");
  if (footerMount) {
    footerMount.outerHTML = renderSiteFooter();
  }

  if (
    !document.getElementById("cart-sidebar") &&
    !document.getElementById("cart-overlay")
  ) {
    document.body.insertAdjacentHTML("beforeend", LAYOUT_CART_SIDEBAR_HTML);
  }

  if (isCategoriesChildPage) {
    const existingOverlay = document.getElementById("mobile-menu-overlay");
    if (existingOverlay) existingOverlay.remove();
  } else if (!document.getElementById("mobile-menu-overlay")) {
    document.body.insertAdjacentHTML("beforeend", LAYOUT_MOBILE_MENU_OVERLAY_HTML);
  }

  const nav = document.querySelector(".nav-wrapper");
  const burger = document.querySelector(".burger-menu");
  const closeBtn = document.querySelector(".mobile-menu-close");
  const mobileOverlay = document.getElementById("mobile-menu-overlay");
  const themeToggle = document.getElementById("theme-toggle");
  const a11yToggle = document.getElementById("a11y-toggle");
  const langSelect = document.getElementById("lang-select");

  const setMenuOpen = (isOpen) => {
    if (!nav) return;
    nav.classList.toggle("open", isOpen);
    document.body.classList.toggle("menu-open", isOpen);

    if (mobileOverlay) {
      mobileOverlay.style.display = isOpen ? "block" : "none";
    }
  };

  if (burger) {
    burger.addEventListener("click", () => {
      if (!nav) return;
      setMenuOpen(!nav.classList.contains("open"));
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => setMenuOpen(false));
  }

  if (mobileOverlay) {
    mobileOverlay.addEventListener("click", () => setMenuOpen(false));
  }

  if (nav) {
    nav.addEventListener("click", (e) => {
      const link = e.target && e.target.closest ? e.target.closest(".nav-links a") : null;
      if (link) setMenuOpen(false);
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  if (a11yToggle) {
    a11yToggle.addEventListener("click", toggleA11y);
  }

  if (langSelect) {
    const current = getCookieValue("googtrans");
    langSelect.value = current === "/en/ru" ? "ru" : "en";

    langSelect.addEventListener("change", () => {
      setGoogleTranslateLanguage(langSelect.value);
    });
  }
}

document.addEventListener("DOMContentLoaded", injectLayout);
