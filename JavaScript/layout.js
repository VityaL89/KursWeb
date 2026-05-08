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
            <ul class="nav-links">
                <li><a href="index.html" class="nav-home">Home</a></li>
                <li><a href="Categories.html" class="nav-all">All restaurants</a></li>
            </ul>

            <div class="auth-buttons">
                <a href="Login.html" class="btn-login-header">Sign in</a>
                <a href="SignUp.html" class="btn-signup-header">Sign up</a>
            </div>

            <button class="nav-cart" id="header-cart-btn" aria-label="Cart">
                <img src="images/ShoppingCart.png" alt="Cart" class="cart-icon">
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
    if (!document.getElementById('layout-cart-styles')) {
        const link = document.createElement('link');
        link.id = 'layout-cart-styles';
        link.rel = 'stylesheet';
        link.href = 'cart-sidebar.css';
        document.head.appendChild(link);
    }

    const headerMount = document.getElementById('site-header');
    if (headerMount) {
        headerMount.outerHTML = renderSiteHeader();
    }

    const footerMount = document.getElementById('site-footer');
    if (footerMount) {
        footerMount.outerHTML = renderSiteFooter();
    }

    if (!document.getElementById('cart-sidebar') && !document.getElementById('cart-overlay')) {
        document.body.insertAdjacentHTML('beforeend', LAYOUT_CART_SIDEBAR_HTML);
    }

    const burger = document.querySelector('.burger-menu');
    if (burger) {
        burger.addEventListener('click', () => {
            const nav = document.querySelector('.nav-wrapper');
            if (nav) nav.classList.toggle('open');
        });
    }
}

document.addEventListener('DOMContentLoaded', injectLayout);
