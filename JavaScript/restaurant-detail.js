let isCartSidebarOpen = false;
let selectedFood = null;
let foodQuantity = 1;


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

        const resRestaurants = await fetch('http://localhost:3000/restaurants');
        const restaurants = await resRestaurants.json();
        const restaurant = restaurants.find(r => r.id == restaurantId);

        if (!restaurant) {
            console.error('Ресторан не найден');
            window.location.href = 'Categories.html';
            return;
        }


        const resMenu = await fetch('http://localhost:3000/menuItems');
        const allMenuItems = await resMenu.json();
        const restaurantMenu = allMenuItems.filter(item => item.restaurantId == restaurantId);


        const resCart = await fetch('http://localhost:3000/carts');
        const allCarts = await resCart.json();
        

        let allItems = [];
        allCarts.forEach(cart => {
            if (cart.items) {
                cart.items.forEach(item => {
                    allItems.push({
                        ...item,
                        cartId: cart.id,
                        restaurantId: cart.restaurantId
                    });
                });
            }
        });
        const cart = { 
            items: allItems, 
            total: allItems.reduce((sum, i) => sum + i.price * i.quantity, 0) 
        };


        updateRestaurantPage(restaurant, restaurantMenu, cart);

    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
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
                const cartItem = cart.items.find(c => c.id === item.id && c.restaurantId === restaurant.id);
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
    const restaurantId = getRestaurantIdFromURL();
    if (!restaurantId) return;

    const resCart = await fetch('http://localhost:3000/carts');
    const carts = await resCart.json();
    
    let cart = carts.find(c => c.restaurantId == restaurantId);

    if (!cart) {
        const newCart = {
            restaurantId: parseInt(restaurantId),
            items: [],
            total: 0
        };
        const createRes = await fetch('http://localhost:3000/carts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCart)
        });
        cart = await createRes.json();
    }

    const existingItem = cart.items.find(c => c.id === item.id);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.items.push({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            quantity: quantity
        });
    }

    cart.total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    await fetch(`http://localhost:3000/carts/${cart.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cart)
    });

    const resAllCarts = await fetch('http://localhost:3000/carts');
    const allCarts = await resAllCarts.json();
    let allItems = [];
    allCarts.forEach(c => {
        if (c.items) {
            c.items.forEach(item => {
                allItems.push({
                    ...item,
                    cartId: c.id,
                    restaurantId: c.restaurantId
                });
            });
        }
    });
    const newCart = { 
        items: allItems, 
        total: allItems.reduce((sum, i) => sum + i.price * i.quantity, 0) 
    };

    updateCartUI(newCart);
    updateMenuBadges(newCart);
    updateHeaderCartTotal(newCart);
}

async function removeFromCart(itemId) {
    const restaurantId = getRestaurantIdFromURL();
    if (!restaurantId) return;

    const resCart = await fetch(`http://localhost:3000/carts`);
    const carts = await resCart.json();
    let cart = carts.find(c => c.restaurantId == restaurantId);

    if (!cart) return;

    const index = cart.items.findIndex(c => c.id === itemId);
    if (index !== -1) {
        if (cart.items[index].quantity > 1) {
            cart.items[index].quantity--;
        } else {
            cart.items.splice(index, 1);
        }
    }

    cart.total = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    await fetch(`http://localhost:3000/carts/${cart.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cart)
    });

    const resAllCarts = await fetch('http://localhost:3000/carts');
    const allCarts = await resAllCarts.json();
    let allItems = [];
    allCarts.forEach(c => {
        if (c.items) {
            c.items.forEach(item => {
                allItems.push({
                    ...item,
                    cartId: c.id,
                    restaurantId: c.restaurantId
                });
            });
        }
    });
    const newCart = { 
        items: allItems, 
        total: allItems.reduce((sum, i) => sum + i.price * i.quantity, 0) 
    };

    updateCartUI(newCart);
    updateMenuBadges(newCart);
    updateHeaderCartTotal(newCart);
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
            if (newQuantity > 0) {
                const cartId = item.cartId;
                const resCart = await fetch(`http://localhost:3000/carts/${cartId}`);
                const currentCart = await resCart.json();
                if (currentCart) {
                    const cartItem = currentCart.items.find(c => c.id === item.id);
                    if (cartItem) {
                        cartItem.quantity = newQuantity;
                        currentCart.total = currentCart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
                        await fetch(`http://localhost:3000/carts/${cartId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(currentCart)
                        });

                        const resAll = await fetch('http://localhost:3000/carts');
                        const allCarts = await resAll.json();
                        let allItems = [];
                        allCarts.forEach(c => {
                            if (c.items) {
                                c.items.forEach(i => {
                                    allItems.push({
                                        ...i,
                                        cartId: c.id,
                                        restaurantId: c.restaurantId
                                    });
                                });
                            }
                        });
                        const newCart = { 
                            items: allItems, 
                            total: allItems.reduce((sum, i) => sum + i.price * i.quantity, 0) 
                        };
                        updateCartUI(newCart);
                        updateHeaderCartTotal(newCart);
                    }
                }
            } else if (newQuantity === 0) {
                // Удаляем товар
                const cartId = item.cartId;
                const resCart = await fetch(`http://localhost:3000/carts/${cartId}`);
                const currentCart = await resCart.json();
                if (currentCart) {
                    const index = currentCart.items.findIndex(c => c.id === item.id);
                    if (index !== -1) {
                        currentCart.items.splice(index, 1);
                        currentCart.total = currentCart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
                        await fetch(`http://localhost:3000/carts/${cartId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(currentCart)
                        });
                        // Перезагружаем все данные
                        const resAll = await fetch('http://localhost:3000/carts');
                        const allCarts = await resAll.json();
                        let allItems = [];
                        allCarts.forEach(c => {
                            if (c.items) {
                                c.items.forEach(i => {
                                    allItems.push({
                                        ...i,
                                        cartId: c.id,
                                        restaurantId: c.restaurantId
                                    });
                                });
                            }
                        });
                        const newCart = { 
                            items: allItems, 
                            total: allItems.reduce((sum, i) => sum + i.price * i.quantity, 0) 
                        };
                        updateCartUI(newCart);
                        updateHeaderCartTotal(newCart);
                    }
                }
            }
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
        const restaurantId = parseInt(getRestaurantIdFromURL());
        
        let quantity = 0;
        if (cart && cart.items) {
            const cartItem = cart.items.find(c => c.name === itemName && c.restaurantId === restaurantId);
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
function toggleCartSidebar() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    
    if (!isCartSidebarOpen) {
        sidebar.style.display = 'flex';
        overlay.style.display = 'block';
        isCartSidebarOpen = true;

        // Загружаем все корзины
        fetch('http://localhost:3000/carts')
            .then(res => res.json())
            .then(carts => {
                let allItems = [];
                let total = 0;
                carts.forEach(cart => {
                    if (cart.items) {
                        cart.items.forEach(item => {
                            allItems.push({
                                ...item,
                                cartId: cart.id,
                                restaurantId: cart.restaurantId
                            });
                            total += item.price * item.quantity;
                        });
                    }
                });
                const newCart = { 
                    items: allItems, 
                    total: total 
                };
                updateCartUI(newCart);
                updateHeaderCartTotal(newCart);
            });
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