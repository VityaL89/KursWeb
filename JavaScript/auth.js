const API_URL = 'http://localhost:3000';

const GUEST_CART_STORAGE_KEY = 'guestCart';

function getGuestCart() {
    try {
        const raw = localStorage.getItem(GUEST_CART_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (!parsed || !Array.isArray(parsed.items)) {
            return { items: [], total: 0 };
        }
        const total = parsed.items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
        return { items: parsed.items, total };
    } catch {
        return { items: [], total: 0 };
    }
}

function setGuestCart(cart) {
    const safeCart = cart && Array.isArray(cart.items) ? cart : { items: [], total: 0 };
    const total = safeCart.items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
    localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify({ items: safeCart.items, total }));
}

function clearGuestCart() {
    localStorage.removeItem(GUEST_CART_STORAGE_KEY);
}

function mergeCartItems(targetItems, incomingItems) {
    const result = Array.isArray(targetItems) ? [...targetItems] : [];
    (Array.isArray(incomingItems) ? incomingItems : []).forEach(inItem => {
        if (!inItem) return;
        const existing = result.find(t => String(t.id) === String(inItem.id));
        if (existing) {
            existing.quantity = (Number(existing.quantity) || 0) + (Number(inItem.quantity) || 0);
        } else {
            result.push({
                id: inItem.id,
                name: inItem.name,
                description: inItem.description,
                price: Number(inItem.price) || 0,
                quantity: Number(inItem.quantity) || 0
            });
        }
    });
    return result.filter(i => (Number(i.quantity) || 0) > 0);
}

async function syncGuestCartToServer(userId) {
    const guestCart = getGuestCart();
    if (!guestCart.items.length) return;

    try {
        const resCart = await fetch(`${API_URL}/carts?userId=${userId}`);
        const carts = await resCart.json();
        let cart = carts.length > 0 ? carts[0] : null;

        if (!cart) {
            const createRes = await fetch(`${API_URL}/carts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    restaurantId: null,
                    items: [],
                    total: 0
                })
            });
            cart = await createRes.json();
        }

        cart.items = mergeCartItems(cart.items, guestCart.items);
        cart.total = cart.items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);

        await fetch(`${API_URL}/carts/${cart.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cart)
        });

        clearGuestCart();
    } catch (error) {
        console.error('Ошибка синхронизации гостевой корзины:', error);
    }
}

// Получить текущего пользователя из sessionStorage
function getCurrentUser() {
    const userJson = sessionStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
}

// Проверить, авторизован ли пользователь
function isAuthenticated() {
    return getCurrentUser() !== null;
}

// Проверить, является ли пользователь админом
function isAdmin() {
    const user = getCurrentUser();
    return user ? user.role === 'admin' : false;
}

// Очистить корзину пользователя
async function clearUserCart(userId) {
    try {
        // Получаем все корзины
        const res = await fetch(`${API_URL}/carts`);
        const carts = await res.json();
        
        // Находим корзину пользователя
        const userCart = carts.find(cart => cart.userId === userId);
        
        if (userCart) {
            // Очищаем корзину
            userCart.items = [];
            userCart.total = 0;
            
            // Сохраняем изменения
            await fetch(`${API_URL}/carts/${userCart.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userCart)
            });
            
            console.log('Корзина очищена');
        }
    } catch (error) {
        console.error('Ошибка при очистке корзины:', error);
    }
}

// Вход пользователя
async function loginUser(email, password) {
    const res = await fetch(`${API_URL}/users?email=${email}`);
    const users = await res.json();
    
    if (users.length === 0) {
        return { success: false, message: 'User not found' };
    }
    
    const user = users[0];
    if (user.password !== password) {
        return { success: false, message: 'Invalid password' };
    }
    
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    await syncGuestCartToServer(user.id);
    return { success: true, user };
}

// Регистрация пользователя
async function registerUser(firstName, lastName, email, password, role = 'user') {
    // Проверка существующего пользователя
    const resCheck = await fetch(`${API_URL}/users?email=${email}`);
    const existing = await resCheck.json();
    if (existing.length > 0) {
        return { success: false, message: 'User already exists' };
    }
    
    // Создание пользователя
    const userRes = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            firstName,
            lastName,
            email,
            password,
            role,
            username: email.split('@')[0],
            phone: ''
        })
    });
    const user = await userRes.json();
    
    // Создание корзины для пользователя
    await fetch(`${API_URL}/carts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: user.id,
            restaurantId: null,
            items: [],
            total: 0
        })
    });
    
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    await syncGuestCartToServer(user.id);
    return { success: true, user };
}

// Выход пользователя с очисткой корзины
async function logoutUser() {
    // Удаляем пользователя из sessionStorage
    sessionStorage.removeItem('currentUser');
    
    // Обновляем UI
    updateHeaderAuthUI();
    updateHeaderCartTotalFromServer();
    
    // Перезагружаем страницу или переходим на главную
    window.location.href = 'index.html';
}

// Обновить UI хедера в зависимости от статуса пользователя
function updateHeaderAuthUI() {
    const user = getCurrentUser();

    const profileBtn = document.getElementById('header-profile-btn');
    if (profileBtn) {
        profileBtn.onclick = () => {
            window.location.href = user ? 'Profile.html' : 'SignUp.html';
        };
    }

    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        const existingAdmin = navLinks.querySelector('.nav-admin');
        if (user && user.role === 'admin') {
            if (!existingAdmin) {
                const adminLink = document.createElement('li');
                adminLink.innerHTML = `<a href="AdminPanel.html" class="nav-admin" style="display:flex; align-items:center; justify-content:center; height:55px; padding:0 24px; font-family:'Hind',sans-serif; font-size:18px; font-weight:400; color:#1A1A1A; text-decoration:none; white-space:nowrap; margin-right:8px; margin-top:1px;">Admin Panel</a>`;
                navLinks.appendChild(adminLink);
            }
        } else {
            if (existingAdmin) {
                existingAdmin.closest('li')?.remove();
            }
        }
    }
}

// Обновить цену в корзине в хедере
async function updateHeaderCartTotalFromServer() {
    const headerTotal = document.getElementById('header-cart-total');
    if (!headerTotal) return;

    const user = getCurrentUser();
    if (!user) {
        const guestCart = getGuestCart();
        headerTotal.textContent = `€ ${(guestCart.total || 0).toFixed(2)}`;
        return;
    }

    try {
        const resCart = await fetch(`${API_URL}/carts?userId=${user.id}`);
        const carts = await resCart.json();
        const cart = carts.length > 0 ? carts[0] : null;
        const total = cart ? (Number(cart.total) || 0) : 0;
        headerTotal.textContent = `€ ${total.toFixed(2)}`;
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    updateHeaderAuthUI();
});