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
            menuItem.dataset.itemId = String(item.id);
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
    await addItemToCurrentCart(item, quantity);
    const updatedCart = await loadCurrentCart();
    updateMenuBadges(updatedCart);
}

async function removeFromCart(itemId) {
    await removeItemFromCurrentCart(itemId);
    const updatedCart = await loadCurrentCart();
    updateMenuBadges(updatedCart);
}

// ============================
// Обновление бейджей на карточках
// ============================
async function updateMenuBadges(cart) {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        const itemId = item.dataset.itemId;
        if (!itemId) return;
        let quantity = 0;
        if (cart && cart.items) {
            const cartItem = cart.items.find(c => String(c.id) === String(itemId));
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

    // Загружаем данные ресторана
    loadRestaurantDetails();
});