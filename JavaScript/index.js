const API_URL = 'http://localhost:3000';

function initHorizontalScroll(containerSelector, leftBtnSelector, rightBtnSelector) {
    const container = document.querySelector(containerSelector);
    const leftBtn = document.querySelector(leftBtnSelector);
    const rightBtn = document.querySelector(rightBtnSelector);

    if (!container || !leftBtn || !rightBtn) return;

    
    leftBtn.addEventListener('click', () => {
        container.scrollBy({ left: -320, behavior: 'smooth' });
    });

    
    rightBtn.addEventListener('click', () => {
        container.scrollBy({ left: 320, behavior: 'smooth' });
    });
}


function createRestaurantCard(restaurant) {
    const card = document.createElement('div');
    card.className = 'restaurant-card';
    card.innerHTML = `
        <img src="${restaurant.image}" alt="${restaurant.name}" class="card-img">
        <div class="card-content">
            <h3 class="card-title">${restaurant.name}</h3>
            <div class="card-review">
                <img src="images/Star.png" class="star-icon" alt="star">
                <span class="review-score">${restaurant.rating}</span>
                <span class="review-text">${restaurant.ratingText || 'Very Good'}</span>
            </div>
            <p class="card-desc">${restaurant.description}</p>
            <div class="card-category">${restaurant.tags ? restaurant.tags[0] : 'Food'}</div>
        </div>
    `;

    card.addEventListener('click', () => {
        window.location.href = `RestaurantDetail.html?id=${restaurant.id}`;
    });

    return card;
}


function updateArrows(container, leftBtn, rightBtn) {
    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;

    
    if (scrollLeft > 10) {
        leftBtn.style.opacity = '1';
        leftBtn.style.pointerEvents = 'auto';
    } else {
        leftBtn.style.opacity = '0';
        leftBtn.style.pointerEvents = 'none';
    }

    
    const maxScroll = scrollWidth - clientWidth - 10;
    if (scrollLeft < maxScroll) {
        rightBtn.style.opacity = '1';
        rightBtn.style.pointerEvents = 'auto';
    } else {
        rightBtn.style.opacity = '0';
        rightBtn.style.pointerEvents = 'none';
    }
}

function initSlider(container, leftBtn, rightBtn) {
    if (!container || !leftBtn || !rightBtn) return;

    
    setTimeout(() => {
        updateArrows(container, leftBtn, rightBtn);
    }, 100);

    
    leftBtn.addEventListener('click', () => {
        container.scrollBy({ left: -300, behavior: 'smooth' });
        setTimeout(() => {
            updateArrows(container, leftBtn, rightBtn);
        }, 300);
    });

    
    rightBtn.addEventListener('click', () => {
        container.scrollBy({ left: 300, behavior: 'smooth' });
        setTimeout(() => {
            updateArrows(container, leftBtn, rightBtn);
        }, 300);
    });

    
    container.addEventListener('scroll', () => {
        updateArrows(container, leftBtn, rightBtn);
    });
}

async function loadRestaurants() {
    try {
        const response = await fetch(`${API_URL}/restaurants`);
        const restaurants = await response.json();

        
        const picksGrid = document.querySelector('.picks .slider-track');
        if (picksGrid) {
            picksGrid.innerHTML = ''; 

            const picks = restaurants.slice(0, 6);
            picks.forEach(rest => {
                picksGrid.appendChild(createRestaurantCard(rest));
            });

            
            const picksLeft = document.querySelector('.picks .slider-arrow-left');
            const picksRight = document.querySelector('.picks .slider-arrow-right');
            initSlider(picksGrid, picksLeft, picksRight);
        }

        
        const arrivalsGrid = document.querySelector('.arrivals .slider-track');
        if (arrivalsGrid) {
            arrivalsGrid.innerHTML = '';

            
            const sorted = [...restaurants].sort((a, b) => {
                if (a.isNew === b.isNew) return 0;
                return a.isNew ? -1 : 1;
            });

            
            const arrivals = sorted.slice(0, 6);
            arrivals.forEach(rest => {
                arrivalsGrid.appendChild(createRestaurantCard(rest));
            });

           
            const arrivalsLeft = document.querySelector('.arrivals .slider-arrow-left');
            const arrivalsRight = document.querySelector('.arrivals .slider-arrow-right');
            initSlider(arrivalsGrid, arrivalsLeft, arrivalsRight);
        }

    } catch (error) {
        console.error('Ошибка загрузки ресторанов:', error);
    }
}


async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        const categories = await response.json();

        const categoriesGrid = document.querySelector('.categories-grid');
        if (categoriesGrid) {
            categoriesGrid.innerHTML = '';

            categories.forEach(cat => {
                const card = document.createElement('div');
                card.className = 'category-card';
                card.innerHTML = `
                    <img src="${cat.image}" alt="${cat.name}" class="category-img">
                    <span class="category-name">${cat.name}</span>
                `;

                card.addEventListener('click', () => {
                    window.location.href = `CategoriesChild.html?category=${cat.slug}`;
                });

                categoriesGrid.appendChild(card);
            });
        }

    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
    }
}

async function updateHeaderCartTotalFromServer() {
    try {

        const res = await fetch('http://localhost:3000/carts');
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

let isCartSidebarOpen = false;

function toggleCartSidebar() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    
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

async function loadCartData() {
    try {

        const resRestaurants = await fetch('http://localhost:3000/restaurants');
        const restaurants = await resRestaurants.json();
        
        const res = await fetch('http://localhost:3000/carts');
        const carts = await res.json();

        let allItems = [];
        let total = 0;
        carts.forEach(cart => {
            if (cart.items) {

                const restaurant = restaurants.find(r => r.id === cart.restaurantId);
                const restaurantName = restaurant ? restaurant.name : 'Unknown restaurant';
                
                cart.items.forEach(item => {
                    allItems.push({
                        ...item,
                        cartId: cart.id,
                        restaurantId: cart.restaurantId,
                        restaurantName: restaurantName 
                    });
                    total += item.price * item.quantity;
                });
            }
        });
        updateCartUI(allItems, total);
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
    }
}

function updateCartUI(items, total) {
    const cartContainer = document.getElementById('cart-items-container');
    const totalElement = document.getElementById('cart-total-price');
    
    cartContainer.innerHTML = '';
    
    if (items.length === 0) {
        cartContainer.innerHTML = '<p style="text-align: center; color: #6B7280; padding: 20px;">Your cart is empty</p>';
        totalElement.textContent = '€ 0,00';
        return;
    }
    
    items.forEach(item => {
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

                        loadCartData();
                        updateHeaderCartTotalFromServer();
                    }
                }
            } else if (newQuantity === 0) {

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
                        loadCartData();
                        updateHeaderCartTotalFromServer();
                    }
                }
            }
        });
        
        cartContainer.appendChild(itemElement);
    });
    
    totalElement.textContent = `€ ${total.toFixed(2)}`;
}


document.querySelector('.main-banner-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'Categories.html';
});


document.querySelector('.award-banner-btn')?.addEventListener('click', () => {
    window.location.href = 'Categories.html';
});


document.querySelector('.view-all-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'Categories.html';
});


document.querySelector('.burger-menu')?.addEventListener('click', () => {
    const nav = document.querySelector('.nav-wrapper');
    if (nav) {
        nav.classList.toggle('open');
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    await loadCategories();
    await loadRestaurants();
    await updateHeaderCartTotalFromServer();
    
    const cartButton = document.getElementById('header-cart-btn');
    if (cartButton) {
        cartButton.addEventListener('click', toggleCartSidebar);
    }
});


document.getElementById('cart-close-btn').addEventListener('click', toggleCartSidebar);
document.getElementById('cart-overlay').addEventListener('click', toggleCartSidebar);


document.getElementById('cart-checkout-btn').addEventListener('click', function() {

    alert('Переход к оформлению заказа!');
});

