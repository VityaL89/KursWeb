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
            <button class="mobile-menu-close" type="button" aria-label="Close menu" style="display: none;">
                ×
            </button>
            <div class="auth-buttons">
                <button class="btn-profile-header" id="header-profile-btn" type="button" aria-label="Profile">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 21C20 18.7909 16.4183 17 12 17C7.58172 17 4 18.7909 4 21" stroke="#1A1A1A" stroke-width="2" stroke-linecap="round"/>
                        <path d="M12 14C14.2091 14 16 12.2091 16 10C16 7.79086 14.2091 6 12 6C9.79086 6 8 7.79086 8 10C8 12.2091 9.79086 14 12 14Z" stroke="#1A1A1A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
            
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
  if (!document.getElementById("layout-cart-styles")) {
    const link = document.createElement("link");
    link.id = "layout-cart-styles";
    link.rel = "stylesheet";
    link.href = "cart-sidebar.css";
    document.head.appendChild(link);
  }

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

  if (!document.getElementById("mobile-menu-overlay")) {
    document.body.insertAdjacentHTML("beforeend", LAYOUT_MOBILE_MENU_OVERLAY_HTML);
  }

  const nav = document.querySelector(".nav-wrapper");
  const burger = document.querySelector(".burger-menu");
  const closeBtn = document.querySelector(".mobile-menu-close");
  const mobileOverlay = document.getElementById("mobile-menu-overlay");

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
}

document.addEventListener("DOMContentLoaded", injectLayout);
