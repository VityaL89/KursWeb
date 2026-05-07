// JavaScript/auth.js
const API_URL = 'http://localhost:3000';

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
    
    return { success: true, user };
}

// Выход пользователя с очисткой корзины
async function logoutUser() {
    const user = getCurrentUser();
    if (user) {
        // Очищаем корзину пользователя
        await clearUserCart(user.id);
    }
    
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
    const authButtons = document.querySelector('.auth-buttons');
    if (!authButtons) return;
    
    const user = getCurrentUser();
    
    if (user) {
        // Пользователь авторизован
        authButtons.innerHTML = `
            <div class="user-info" style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                <span class="user-name" style="font-family:'Hind',sans-serif; font-size:16px; font-weight:500; color:#1A1A1A;">
                    👤 ${user.firstName} ${user.lastName}
                    ${user.role === 'admin' ? ' <span style="background:#E5F8BC; padding:2px 8px; border-radius:4px; font-size:12px;">Admin</span>' : ''}
                </span>
                <button onclick="logoutUser()" class="btn-logout" style="font-family:'Hind',sans-serif; font-size:14px; font-weight:500; color:#B71C1C; background:transparent; border:none; cursor:pointer; text-decoration:underline;">
                    Sign out
                </button>
            </div>
        `;
        
        // Если админ - показываем ссылку на админ-панель
        if (user.role === 'admin') {
            const navLinks = document.querySelector('.nav-links');
            if (navLinks && !navLinks.querySelector('.nav-admin')) {
                const adminLink = document.createElement('li');
                adminLink.innerHTML = `<a href="AdminPanel.html" class="nav-admin" style="display:flex; align-items:center; justify-content:center; height:55px; padding:0 24px; font-family:'Hind',sans-serif; font-size:18px; font-weight:400; color:#1A1A1A; text-decoration:none; white-space:nowrap; margin-right:8px; margin-top:1px;">Admin Panel</a>`;
                navLinks.appendChild(adminLink);
            }
        }
    } else {
        // Пользователь не авторизован
        authButtons.innerHTML = `
            <a href="Login.html" class="btn-login-header">Sign in</a>
            <a href="SignUp.html" class="btn-signup-header">Sign up</a>
        `;
    }
}

// Обновить цену в корзине в хедере
async function updateHeaderCartTotalFromServer() {
    try {
        const res = await fetch(`${API_URL}/carts`);
        const carts = await res.json();
        
        let total = 0;
        carts.forEach(cart => {
            if (cart.items) {
                cart.items.forEach(item => {
                    total += item.price * item.quantity;
                });
            }
        });
        
        const headerTotal = document.getElementById('header-cart-total');
        if (headerTotal) {
            headerTotal.textContent = `€ ${total.toFixed(2)}`;
        }
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    updateHeaderAuthUI();
});