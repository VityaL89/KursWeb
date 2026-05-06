// restaurant-detail.js

// Получаем ID ресторана из URL
function getRestaurantIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Загружаем данные о ресторане и его меню
async function loadRestaurantDetails() {
    const restaurantId = getRestaurantIdFromURL();
    if (!restaurantId) {
        console.error('ID ресторана не указан');
        window.location.href = 'Categories.html';
        return;
    }

    try {
        // 1. Загружаем список всех ресторанов
        const resRestaurants = await fetch('http://localhost:3000/restaurants');
        const restaurants = await resRestaurants.json();
        const restaurant = restaurants.find(r => r.id == restaurantId);

        if (!restaurant) {
            console.error('Ресторан не найден');
            window.location.href = 'Categories.html';
            return;
        }

        // 2. Загружаем меню для этого ресторана
        const resMenu = await fetch('http://localhost:3000/menuItems');
        const allMenuItems = await resMenu.json();
        const restaurantMenu = allMenuItems.filter(item => item.restaurantId == restaurantId);

        // 3. Обновляем страницу
        updateRestaurantPage(restaurant, restaurantMenu);

    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

// Обновляем содержимое страницы
function updateRestaurantPage(restaurant, menuItems) {
    // Название и баннер
    document.getElementById('restaurant-name').textContent = restaurant.name;
    document.getElementById('restaurant-breadcrumb').textContent = restaurant.name;
    document.getElementById('restaurant-description').textContent = restaurant.description;

    // Рейтинг
    const ratingValue = document.getElementById('rating-value');
    const ratingLabel = document.getElementById('rating-label');
    if (ratingValue && ratingLabel) {
        ratingValue.textContent = restaurant.rating;
        ratingLabel.textContent = restaurant.ratingText || 'Very Good';
    }

    // Теги
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

    // Хлебные крошки
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) {
        breadcrumb.innerHTML = `
            <a href="Categories.html" class="breadcrumb-link">categories</a>
            <span class="separator">/</span>
            <span class="current">${restaurant.name}</span>
        `;
    }

    // Меню - группируем по категориям
    const menuContainer = document.getElementById('menu-container');
    if (!menuContainer) return;
    menuContainer.innerHTML = '';

    const categories = ['To eat', 'Dessert', 'To drink'];
    
    categories.forEach(categoryName => {
        const itemsInCategory = menuItems.filter(item => item.category === categoryName);
        if (itemsInCategory.length === 0) return;

        // Создаём секцию
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

            menuItem.innerHTML = `
                <h3 class="menu-item-name" style="font-family: 'Montserrat', sans-serif; font-size: 22.5px; font-weight: 700; color: #1A1A1A; margin: 0 0 8px 0;">${item.name}</h3>
                ${item.description ? `<p class="menu-item-description" style="font-family: 'Hind', sans-serif; font-size: 18px; font-weight: 400; color: #6B7280; margin: 0 0 16px 0;">${item.description}</p>` : ''}
                <span class="menu-item-price" style="font-family: 'Hind', sans-serif; font-size: 18px; font-weight: 500; color: #1A1A1A;">€ ${item.price.toFixed(2)}</span>
            `;

            grid.appendChild(menuItem);
        });

        categorySection.appendChild(grid);
        menuContainer.appendChild(categorySection);
    });
}

// Запускаем загрузку при открытии страницы
document.addEventListener('DOMContentLoaded', loadRestaurantDetails);