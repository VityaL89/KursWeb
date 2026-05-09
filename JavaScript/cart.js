// JavaScript/cart.js
const CART_API_URL = 'http://localhost:3000';

let isCartSidebarOpen = false;

// ============================
// ОБНОВЛЕНИЕ ЦЕНЫ В ХЕДЕРЕ
// ============================

async function updateHeaderCartTotalFromServer() {
    const user = getCurrentUser();
    const headerTotal = document.getElementById('header-cart-total');
    if (!headerTotal) return;
    
    if (!user) {
        const guestCart = getGuestCart();
        headerTotal.textContent = `€ ${(guestCart.total || 0).toFixed(2)}`;
        return;
    }
    
    try {
        const res = await fetch(`${CART_API_URL}/carts?userId=${user.id}`);
        const carts = await res.json();
        const cart = carts.length > 0 ? carts[0] : null;
        const total = cart ? cart.total : 0;
        headerTotal.textContent = `€ ${total.toFixed(2)}`;
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
    }
}

// ============================
// ПЕРЕКЛЮЧЕНИЕ САЙДБАРА КОРЗИНЫ
// ============================

function toggleCartSidebar() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');

    if (!sidebar || !overlay) return;
    
    if (!isCartSidebarOpen) {
        sidebar.style.display = 'flex';
        overlay.style.display = 'block';
        isCartSidebarOpen = true;
        loadCartData();
    } else {
        sidebar.style.display = 'none';
        overlay.style.display = 'none';
        isCartSidebarOpen = false;
    }
}

// ============================
// ЗАГРУЗКА ДАННЫХ КОРЗИНЫ
// ============================

async function loadCartData() {
    const user = getCurrentUser();
    const cartContainer = document.getElementById('cart-items-container');
    const totalElement = document.getElementById('cart-total-price');
    
    if (!cartContainer) return;
    
    if (!user) {
        const guestCart = getGuestCart();
        updateCartUI(guestCart);
        return;
    }
    
    try {
        const res = await fetch(`${CART_API_URL}/carts?userId=${user.id}`);
        const carts = await res.json();
        const cart = carts.length > 0 ? carts[0] : { items: [], total: 0 };
        
        updateCartUI(cart);
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
    }
}

// ============================
// ОБНОВЛЕНИЕ UI КОРЗИНЫ
// ============================

function updateCartUI(cart) {
    const cartContainer = document.getElementById('cart-items-container');
    const totalElement = document.getElementById('cart-total-price');
    
    if (!cartContainer) return;
    
    cartContainer.innerHTML = '';
    
    if (!cart || cart.items.length === 0) {
        cartContainer.innerHTML = '<p style="text-align: center; color: #6B7280; padding: 20px;">Your cart is empty</p>';
        if (totalElement) totalElement.textContent = '€ 0,00';
        return;
    }
    
    cart.items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-description">${item.description || ''}</div>
                <div class="cart-item-price">€ ${(item.price * item.quantity).toFixed(2)}</div>
            </div>
            <div class="cart-item-controls">
                <select class="cart-item-quantity">
                    ${Array.from({length: 11}, (_, i) => `<option value="${i}" ${i === item.quantity ? 'selected' : ''}>${i}</option>`).join('')}
                </select>
            </div>
        `;
        
        const select = itemElement.querySelector('.cart-item-quantity');
        select.addEventListener('change', async function() {
            const newQuantity = parseInt(this.value);
            const user = getCurrentUser();
            if (!user) {
                const guestCart = getGuestCart();
                const existing = guestCart.items.find(c => String(c.id) === String(item.id));
                if (!existing) return;

                if (newQuantity > 0) {
                    existing.quantity = newQuantity;
                } else {
                    const idx = guestCart.items.findIndex(c => String(c.id) === String(item.id));
                    if (idx !== -1) guestCart.items.splice(idx, 1);
                }
                setGuestCart({ items: guestCart.items });
                loadCartData();
                updateHeaderCartTotalFromServer();
                return;
            }
            
            if (newQuantity > 0) {
                const resCart = await fetch(`${CART_API_URL}/carts?userId=${user.id}`);
                const carts = await resCart.json();
                const currentCart = carts[0];
                
                if (currentCart) {
                    const cartItem = currentCart.items.find(c => c.id === item.id);
                    if (cartItem) {
                        cartItem.quantity = newQuantity;
                        currentCart.total = currentCart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
                        await fetch(`${CART_API_URL}/carts/${currentCart.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(currentCart)
                        });
                        loadCartData();
                        updateHeaderCartTotalFromServer();
                    }
                }
            } else if (newQuantity === 0) {
                const resCart = await fetch(`${CART_API_URL}/carts?userId=${user.id}`);
                const carts = await resCart.json();
                const currentCart = carts[0];
                
                if (currentCart) {
                    const index = currentCart.items.findIndex(c => c.id === item.id);
                    if (index !== -1) {
                        currentCart.items.splice(index, 1);
                        currentCart.total = currentCart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
                        await fetch(`${CART_API_URL}/carts/${currentCart.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(currentCart)
                        });
                        loadCartData();
                        updateHeaderCartTotalFromServer();
                    }
                }
            }
        });
        
        cartContainer.appendChild(itemElement);
    });
    
    if (totalElement) {
        totalElement.textContent = `€ ${cart.total.toFixed(2)}`;
    }
}

async function loadCurrentCart() {
    const user = getCurrentUser();
    if (!user) return getGuestCart();

    try {
        const res = await fetch(`${CART_API_URL}/carts?userId=${user.id}`);
        if (!res.ok) {
            const text = await res.text();
            console.error('Не удалось загрузить корзину:', res.status, text);
            return { items: [], total: 0 };
        }
        const carts = await res.json();
        const cart = carts.length > 0 ? carts[0] : null;
        return cart ? cart : { items: [], total: 0 };
    } catch (e) {
        console.error('Ошибка загрузки корзины:', e);
        return { items: [], total: 0 };
    }
}

async function saveCurrentCart(cart) {
    const user = getCurrentUser();
    if (!user) {
        setGuestCart(cart);
        return;
    }

    try {
        const res = await fetch(`${CART_API_URL}/carts?userId=${user.id}`);
        if (!res.ok) {
            const text = await res.text();
            console.error('Не удалось получить корзины пользователя:', res.status, text);
            return;
        }
        const carts = await res.json();
        let currentCart = carts.length > 0 ? carts[0] : null;

        if (!currentCart) {
            const createRes = await fetch(`${CART_API_URL}/carts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    restaurantId: null,
                    items: [],
                    total: 0
                })
            });
            if (!createRes.ok) {
                const text = await createRes.text();
                console.error('Не удалось создать корзину:', createRes.status, text);
                return;
            }
            currentCart = await createRes.json();
        }

        currentCart.items = Array.isArray(cart.items) ? cart.items : [];
        currentCart.total = currentCart.items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);

        const putRes = await fetch(`${CART_API_URL}/carts/${currentCart.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentCart)
        });
        if (!putRes.ok) {
            const text = await putRes.text();
            console.error('Не удалось сохранить корзину:', putRes.status, text);
        }
    } catch (e) {
        console.error('Ошибка сохранения корзины:', e);
    }
}

async function clearCurrentCart() {
    const user = getCurrentUser();
    if (!user) {
        clearGuestCart();
        return;
    }

    try {
        const res = await fetch(`${CART_API_URL}/carts?userId=${user.id}`);
        if (!res.ok) {
            const text = await res.text();
            console.error('Не удалось получить корзины пользователя для очистки:', res.status, text);
            return;
        }
        const carts = await res.json();
        const cart = carts.length > 0 ? carts[0] : null;
        if (!cart) return;

        cart.items = [];
        cart.total = 0;

        const putRes = await fetch(`${CART_API_URL}/carts/${cart.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cart)
        });

        if (!putRes.ok) {
            const text = await putRes.text();
            console.error('Не удалось очистить корзину:', putRes.status, text);
            return;
        }
    } catch (e) {
        console.error('Ошибка очистки корзины:', e);
    }
}

async function addItemToCurrentCart(item, quantity) {
    const cart = await loadCurrentCart();
    cart.items = Array.isArray(cart.items) ? cart.items : [];

    const existing = cart.items.find(c => String(c.id) === String(item.id));
    if (existing) {
        existing.quantity = (Number(existing.quantity) || 0) + (Number(quantity) || 0);
    } else {
        cart.items.push({
            id: item.id,
            name: item.name,
            description: item.description,
            price: Number(item.price) || 0,
            quantity: Number(quantity) || 0
        });
    }

    cart.total = cart.items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
    await saveCurrentCart(cart);
    updateHeaderCartTotalFromServer();
}

async function removeItemFromCurrentCart(itemId) {
    const cart = await loadCurrentCart();
    cart.items = Array.isArray(cart.items) ? cart.items : [];

    const index = cart.items.findIndex(c => String(c.id) === String(itemId));
    if (index !== -1) {
        if ((Number(cart.items[index].quantity) || 0) > 1) {
            cart.items[index].quantity = (Number(cart.items[index].quantity) || 0) - 1;
        } else {
            cart.items.splice(index, 1);
        }
    }

    cart.total = cart.items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
    await saveCurrentCart(cart);
    updateHeaderCartTotalFromServer();
}

// ============================
// ОБНОВЛЕНИЕ БЕЙДЖЕЙ (для страниц ресторанов)
// ============================

async function updateMenuBadges(cart) {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        const nameElement = item.querySelector('.menu-item-name');
        if (!nameElement) return;
        
        const itemName = nameElement.textContent;
        
        let quantity = 0;
        if (cart && cart.items) {
            const cartItem = cart.items.find(c => c.name === itemName);
            if (cartItem) {
                quantity = cartItem.quantity;
            }
        }
        
        const oldBadge = item.querySelector('.menu-item-quantity-badge');
        if (oldBadge) {
            oldBadge.remove();
        }
        
        if (quantity > 0) {
            const badge = document.createElement('span');
            badge.className = 'menu-item-quantity-badge';
            badge.textContent = quantity;
            item.appendChild(badge);
        }
    });
}

// ============================
// ИНИЦИАЛИЗАЦИЯ
// ============================

document.addEventListener('DOMContentLoaded', function() {
    // Обновляем корзину при загрузке страницы
    updateHeaderCartTotalFromServer();
    
    // Обработчики событий корзины
    const cartButton = document.getElementById('header-cart-btn') || document.querySelector('.nav-cart');
    if (cartButton) {
        cartButton.addEventListener('click', toggleCartSidebar);
    }
    
    const closeBtn = document.getElementById('cart-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', toggleCartSidebar);
    }
    
    const overlay = document.getElementById('cart-overlay');
    if (overlay) {
        overlay.addEventListener('click', toggleCartSidebar);
    }
    
    // Обработчик кнопки Checkout
    const checkoutBtn = document.getElementById('cart-checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            const user = getCurrentUser();
            if (!user) {
                alert('Please sign in to checkout');
                window.location.href = 'Login.html';
                return;
            }
            window.location.href = 'OrderFormStep1.html';
        });
    }
});