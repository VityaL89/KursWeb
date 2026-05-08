let isCartSidebarOpen = false;
let selectedFood = null;
let foodQuantity = 1;

const API_URL = 'http://localhost:3000';


function getRestaurantIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}


async function loadRestaurantDetails() {
    const restaurantId = getRestaurantIdFromURL();
    if (!restaurantId) {
        console.error('ID ресторана не указан');
        window.location.href = 'Categories.html';
        return;
    }

    try {

        const resRestaurants = await fetch(`${API_URL}/restaurants`);
        const restaurants = await resRestaurants.json();
        const restaurant = restaurants.find(r => r.id == restaurantId);

        if (!restaurant) {
            console.error('Ресторан не найден');
            window.location.href = 'Categories.html';
            return;
        }


        const resMenu = await fetch(`${API_URL}/menuItems`);
        const allMenuItems = await resMenu.json();
        const restaurantMenu = allMenuItems.filter(item => item.restaurantId == restaurantId);

        const cart = await loadCurrentCart();
        updateRestaurantPage(restaurant, restaurantMenu, cart);

    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

function getGuestCart() {
    try {
        const raw = localStorage.getItem('guestCart');
        const parsed = raw ? JSON.parse(raw) : null;
        if (!parsed || !Array.isArray(parsed.items)) return { items: [], total: 0 };
        const total = parsed.items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
        return { items: parsed.items, total };
    } catch {
        return { items: [], total: 0 };
    }
}

function setGuestCart(cart) {
    const safeItems = cart && Array.isArray(cart.items) ? cart.items : [];
    const total = safeItems.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
    localStorage.setItem('guestCart', JSON.stringify({ items: safeItems, total }));
}

function getCurrentUser() {
    const userJson = sessionStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
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

async function loadCurrentCart() {
    const user = getCurrentUser();
    if (!user) return getGuestCart();

    try {
        const res = await fetch(`${API_URL}/carts?userId=${user.id}`);
        const carts = await res.json();
        const cart = carts.length > 0 ? carts[0] : null;
        return cart ? cart : { items: [], total: 0 };
    } catch {
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
        const res = await fetch(`${API_URL}/carts?userId=${user.id}`);
        const carts = await res.json();
        let currentCart = carts.length > 0 ? carts[0] : null;

        if (!currentCart) {
            const createRes = await fetch(`${API_URL}/carts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    restaurantId: null,
                    items: [],
                    total: 0
                })
            });
            currentCart = await createRes.json();
        }

        currentCart.items = Array.isArray(cart.items) ? cart.items : [];
        currentCart.total = currentCart.items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);

        await fetch(`${API_URL}/carts/${currentCart.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentCart)
        });
    } catch (error) {
        console.error('Ошибка сохранения корзины:', error);
    }
}


function updateRestaurantPage(restaurant, menuItems, cart) {

    document.getElementById('restaurant-name').textContent = restaurant.name;
    document.getElementById('restaurant-breadcrumb').textContent = restaurant.name;
    document.getElementById('restaurant-description').textContent = restaurant.description;


    const ratingValue = document.getElementById('rating-value');
    const ratingLabel = document.getElementById('rating-label');
    if (ratingValue && ratingLabel) {
        ratingValue.textContent = restaurant.rating;
        ratingLabel.textContent = restaurant.ratingText || 'Very Good';
    }


    const tagsContainer = document.getElementById('tags-container');
    if (tagsContainer) {
        tagsContainer.innerHTML = '';
        if (restaurant.tags) {
            restaurant.tags.forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'tag';
                tagSpan.textContent = tag;
                tagsContainer.appendChild(tagSpan);
            });
        }
    }


    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) {
        breadcrumb.innerHTML = `
            <a href="Categories.html" class="breadcrumb-link">categories</a>
            <span class="separator">/</span>
            <span class="current">${restaurant.name}</span>
        `;
    }


    const menuContainer = document.getElementById('menu-container');
    if (!menuContainer) return;
    menuContainer.innerHTML = '';

    const categories = ['To eat', 'Dessert', 'To drink'];
    
    categories.forEach(categoryName => {
        const itemsInCategory = menuItems.filter(item => item.category === categoryName);
        if (itemsInCategory.length === 0) return;

        const categorySection = document.createElement('div');
        categorySection.className = 'menu-category';
        
        const title = document.createElement('h2');
        title.className = 'menu-category-title';
        title.textContent = categoryName;
        categorySection.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'menu-grid';
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        grid.style.gap = '24px';
        grid.style.padding = '0 56px';
        grid.style.maxWidth = '1327px';
        grid.style.margin = '0 auto';

        itemsInCategory.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item';
            menuItem.style.backgroundColor = '#ffffff';
            menuItem.style.borderRadius = '8px';
            menuItem.style.padding = '24px';
            menuItem.style.minHeight = '162px';
            menuItem.style.width = '427px';
            menuItem.style.cursor = 'pointer';
            menuItem.style.display = 'flex';
            menuItem.style.flexDirection = 'column';
            menuItem.style.justifyContent = 'center';
            menuItem.style.position = 'relative';


            let quantity = 0;
            if (cart && cart.items) {
                const cartItem = cart.items.find(c => String(c.id) === String(item.id));
                if (cartItem) {
                    quantity = cartItem.quantity;
                }
            }

            menuItem.innerHTML = `
                <h3 class="menu-item-name" style="font-family: 'Montserrat', sans-serif; font-size: 22.5px; font-weight: 700; color: #1A1A1A; margin: 0 0 8px 0;">${item.name}</h3>
                ${item.description ? `<p class="menu-item-description" style="font-family: 'Hind', sans-serif; font-size: 18px; font-weight: 400; color: #6B7280; margin: 0 0 16px 0;">${item.description}</p>` : ''}
                <span class="menu-item-price" style="font-family: 'Hind', sans-serif; font-size: 18px; font-weight: 500; color: #1A1A1A;">€ ${item.price.toFixed(2)}</span>
                ${quantity > 0 ? `<span class="menu-item-quantity-badge">${quantity}</span>` : ''}
            `;

            menuItem.addEventListener('click', function() {
                openFoodModal(item);
            });

            grid.appendChild(menuItem);
        });

        categorySection.appendChild(grid);
        menuContainer.appendChild(categorySection);
    });

    if (cart) {
        updateCartUI(cart);
        updateHeaderCartTotal(cart);
        updateMenuBadges(cart); 
    }
}

function openFoodModal(item) {
    selectedFood = item;
    foodQuantity = 1;
    
    document.getElementById('modal-food-name').textContent = item.name;
    document.getElementById('modal-food-description').textContent = item.description || '';
    document.getElementById('modal-quantity').textContent = 1;
    document.getElementById('modal-add-btn').textContent = `add for ${(item.price * 1).toFixed(2)} €`;
    
    document.getElementById('food-modal').style.display = 'flex';
}

function closeFoodModal() {
    document.getElementById('food-modal').style.display = 'none';
    selectedFood = null;
    foodQuantity = 1;
}

function updateModalQuantity() {
    document.getElementById('modal-quantity').textContent = foodQuantity;
    if (selectedFood) {
        document.getElementById('modal-add-btn').textContent = `add for ${(selectedFood.price * foodQuantity).toFixed(2)} €`;
    }
}

async function addToCart(item, quantity) {
    const cart = await loadCurrentCart();

    cart.items = Array.isArray(cart.items) ? cart.items : [];
    const existingItem = cart.items.find(c => String(c.id) === String(item.id));
    if (existingItem) {
        existingItem.quantity = (Number(existingItem.quantity) || 0) + quantity;
    } else {
        cart.items.push({
            id: item.id,
            name: item.name,
            description: item.description,
            price: Number(item.price) || 0,
            quantity: quantity
        });
    }

    cart.items = mergeCartItems([], cart.items);
    cart.total = cart.items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
    await saveCurrentCart(cart);

    updateCartUI(cart);
    updateMenuBadges(cart);
    updateHeaderCartTotal(cart);
}

async function removeFromCart(itemId) {
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

    updateCartUI(cart);
    updateMenuBadges(cart);
    updateHeaderCartTotal(cart);
}

async function updateCartUI(cart) {
    if (!isCartSidebarOpen) {
        updateHeaderCartTotal(cart);
        return;
    }

    const cartContainer = document.getElementById('cart-items-container');
    const totalElement = document.getElementById('cart-total-price');
    
    cartContainer.innerHTML = '';
    
    if (!cart || cart.items.length === 0) {
        cartContainer.innerHTML = '<p style="text-align: center; color: #6B7280; padding: 20px;">Your cart is empty</p>';
        totalElement.textContent = '€ 0,00';
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
            const currentCart = await loadCurrentCart();
            currentCart.items = Array.isArray(currentCart.items) ? currentCart.items : [];

            const existing = currentCart.items.find(c => String(c.id) === String(item.id));
            if (!existing) return;

            if (newQuantity > 0) {
                existing.quantity = newQuantity;
            } else {
                const idx = currentCart.items.findIndex(c => String(c.id) === String(item.id));
                if (idx !== -1) currentCart.items.splice(idx, 1);
            }

            currentCart.total = currentCart.items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
            await saveCurrentCart(currentCart);

            updateCartUI(currentCart);
            updateHeaderCartTotal(currentCart);
            updateMenuBadges(currentCart);
        });
        
        cartContainer.appendChild(itemElement);
    });
    
    totalElement.textContent = `€ ${cart.total.toFixed(2)}`;
}

// ============================
// Обновление бейджей на карточках
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
        
        // Удаляем старый бейдж, если он есть
        const oldBadge = item.querySelector('.menu-item-quantity-badge');
        if (oldBadge) {
            oldBadge.remove();
        }
        
        // Если количество > 0, создаём новый бейдж
        if (quantity > 0) {
            const badge = document.createElement('span');
            badge.className = 'menu-item-quantity-badge';
            badge.textContent = quantity;
            item.appendChild(badge);
        }
    });
}

// ============================
// Обновление цены в хедере
// ============================
function updateHeaderCartTotal(cart) {
    const headerTotal = document.getElementById('header-cart-total');
    if (headerTotal) {
        const total = cart ? cart.total : 0;
        headerTotal.textContent = `€ ${total.toFixed(2)}`;
    }
}

// ============================
// Переключение сайдбара корзины
// ============================
async function toggleCartSidebar() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    
    if (!isCartSidebarOpen) {
        sidebar.style.display = 'flex';
        overlay.style.display = 'block';
        isCartSidebarOpen = true;

        const cart = await loadCurrentCart();
        updateCartUI(cart);
        updateHeaderCartTotal(cart);
    } else {
        sidebar.style.display = 'none';
        overlay.style.display = 'none';
        isCartSidebarOpen = false;
    }
}

// ============================
// Инициализация событий
// ============================
document.addEventListener('DOMContentLoaded', function() {
    // Обработчики модального окна
    document.getElementById('modal-close-btn').addEventListener('click', closeFoodModal);
    document.getElementById('modal-minus-btn').addEventListener('click', function() {
        if (foodQuantity > 1) {
            foodQuantity--;
            updateModalQuantity();
        }
    });
    document.getElementById('modal-plus-btn').addEventListener('click', function() {
        if (foodQuantity < 10) {
            foodQuantity++;
            updateModalQuantity();
        }
    });
    document.getElementById('modal-add-btn').addEventListener('click', function() {
        if (selectedFood) {
            addToCart(selectedFood, foodQuantity);
        }
    });

    // Обработчики корзины
    document.getElementById('cart-close-btn').addEventListener('click', toggleCartSidebar);
    document.getElementById('cart-overlay').addEventListener('click', toggleCartSidebar);

    // Клик по иконке корзины в хедере
    const cartButton = document.querySelector('.nav-cart');
    if (cartButton) {
        cartButton.addEventListener('click', toggleCartSidebar);
    }

    // Загружаем данные ресторана
    loadRestaurantDetails();
});