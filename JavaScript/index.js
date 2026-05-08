// ============================
// СЛАЙДЕРЫ
// ============================

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
    
    window.addEventListener('resize', () => {
        updateArrows(container, leftBtn, rightBtn);
    });
}

// ============================
// КАРТОЧКИ РЕСТОРАНОВ
// ============================

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

// ============================
// ЗАГРУЗКА РЕСТОРАНОВ
// ============================

async function loadRestaurants() {
    try {
        const response = await fetch(`${API_URL}/restaurants`);
        const restaurants = await response.json();

        // Picks
        const picksGrid = document.querySelector('.picks .slider-track');
        if (picksGrid) {
            picksGrid.innerHTML = '';
            const picks = restaurants.slice(0, 6);
            picks.forEach(rest => {
                picksGrid.appendChild(createRestaurantCard(rest));
            });

            const picksContainer = document.querySelector('.picks .slider-container');
            const picksLeft = picksContainer?.querySelector('.slider-arrow-left') || document.querySelector('.picks .slider-arrow-left');
            const picksRight = picksContainer?.querySelector('.slider-arrow-right') || document.querySelector('.picks .slider-arrow-right');
            
            if (picksLeft && picksRight) {
                initSlider(picksGrid, picksLeft, picksRight);
            }
        }

        // Arrivals
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

            const arrivalsContainer = document.querySelector('.arrivals .slider-container');
            const arrivalsLeft = arrivalsContainer?.querySelector('.slider-arrow-left') || document.querySelector('.arrivals .slider-arrow-left');
            const arrivalsRight = arrivalsContainer?.querySelector('.slider-arrow-right') || document.querySelector('.arrivals .slider-arrow-right');
            
            if (arrivalsLeft && arrivalsRight) {
                initSlider(arrivalsGrid, arrivalsLeft, arrivalsRight);
            }
        }

    } catch (error) {
        console.error('Ошибка загрузки ресторанов:', error);
    }
}

// ============================
// ЗАГРУЗКА КАТЕГОРИЙ
// ============================

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

// ============================
// КОРЗИНА
// ============================

// ============================
// ОБРАБОТЧИКИ СОБЫТИЙ
// ============================

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

document.addEventListener('DOMContentLoaded', async () => {
    // Проверяем, что API_URL определена
    if (typeof API_URL === 'undefined') {
        console.error('API_URL не определена! Проверьте подключение auth.js');
        return;
    }
    
    await loadCategories();
    await loadRestaurants();
});