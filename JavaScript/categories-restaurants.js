const CATEGORIES_RESTAURANTS_API_URL = 'http://localhost:3000';

function getSearchHistoryStorageKey() {
    const raw = sessionStorage.getItem('currentUser');
    if (raw) {
        try {
            const user = JSON.parse(raw);
            if (user?.id != null) return `restaurantSearchHistory_user_${user.id}`;
        } catch (e) {
            console.error('Failed to parse currentUser from sessionStorage', e);
        }
    }
    return 'restaurantSearchHistory_guest';
}

function loadSearchHistory() {
    const key = getSearchHistoryStorageKey();
    try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string') : [];
    } catch (e) {
        console.error('Failed to load search history', e);
        return [];
    }
}

function saveSearchHistory(list) {
    const key = getSearchHistoryStorageKey();
    try {
        localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {
        console.error('Failed to save search history', e);
    }
}

function addQueryToHistory(query) {
    const q = String(query || '').trim();
    if (!q) return;

    const maxItems = 8;
    const history = loadSearchHistory();
    const normalized = q.toLowerCase();

    const next = [q, ...history.filter(x => String(x).toLowerCase() !== normalized)].slice(0, maxItems);
    saveSearchHistory(next);
}

function renderSearchHistoryDatalist() {
    const datalist = document.getElementById('restaurants-search-history');
    if (!datalist) return;

    const history = loadSearchHistory();
    datalist.innerHTML = history.map(q => {
        const safe = String(q).split('"').join('&quot;');
        return `<option value="${safe}"></option>`;
    }).join('');
}

function parseMinRating(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function getRestaurantCategoryName(restaurant, categoriesById) {
    const byId = categoriesById[String(restaurant.categoryId)]?.name;
    if (byId) return byId;

    const tag = Array.isArray(restaurant.tags) ? restaurant.tags[0] : null;
    return tag || '';
}

function createRestaurantCardForCategories(restaurant, categoriesById) {
    const categoryName = getRestaurantCategoryName(restaurant, categoriesById);

    const card = document.createElement('div');
    card.className = 'restaurant-card';
    card.innerHTML = `
        <img src="${restaurant.image}" alt="${restaurant.name}" class="card-img">
        <div class="card-content">
            <h3 class="card-title">${restaurant.name}</h3>
            <div class="card-review">
                <img src="images/Star.png" class="star-icon" alt="star">
                <span class="review-score">${restaurant.rating ?? ''}</span>
                <span class="review-text">${restaurant.ratingText || 'Very Good'}</span>
            </div>
            <p class="card-desc">${restaurant.description || ''}</p>
            <div class="card-category">${categoryName || 'Food'}</div>
        </div>
    `;

    card.addEventListener('click', () => {
        window.location.href = `RestaurantDetail.html?id=${restaurant.id}`;
    });

    return card;
}

async function loadCategoriesRestaurantsData() {
    const [restaurantsRes, categoriesRes] = await Promise.all([
        fetch(`${CATEGORIES_RESTAURANTS_API_URL}/restaurants`),
        fetch(`${CATEGORIES_RESTAURANTS_API_URL}/categories`)
    ]);

    if (!restaurantsRes.ok) throw new Error(`Failed to load restaurants: ${restaurantsRes.status}`);
    if (!categoriesRes.ok) throw new Error(`Failed to load categories: ${categoriesRes.status}`);

    const restaurants = await restaurantsRes.json();
    const categories = await categoriesRes.json();

    const categoriesById = Object.fromEntries(categories.map(c => [String(c.id), c]));
    return { restaurants, categories, categoriesById };
}

function buildCategoryOptions(categories) {
    return categories
        .map(c => `<option value="${c.id}">${c.name}</option>`)
        .join('');
}

function applyRestaurantFilters({ restaurants, categoriesById }, filters) {
    const q = (filters.query || '').trim().toLowerCase();
    const categoryId = filters.categoryId ? String(filters.categoryId) : '';
    const minRating = parseMinRating(filters.minRating);
    const onlyNew = !!filters.onlyNew;

    return restaurants.filter(r => {
        if (categoryId && String(r.categoryId) !== categoryId) return false;
        if (onlyNew && !r.isNew) return false;
        if (minRating !== null && Number(r.rating || 0) < minRating) return false;

        if (!q) return true;

        const name = String(r.name || '').toLowerCase();
        const categoryName = getRestaurantCategoryName(r, categoriesById).toLowerCase();

        return name.includes(q) || categoryName.includes(q);
    });
}

function renderRestaurantsList(container, restaurants, categoriesById) {
    container.innerHTML = '';

    if (!restaurants.length) {
        const empty = document.createElement('div');
        empty.className = 'restaurants-empty';
        empty.textContent = 'No restaurants found.';
        container.appendChild(empty);
        return;
    }

    restaurants.forEach(r => {
        container.appendChild(createRestaurantCardForCategories(r, categoriesById));
    });
}

async function initCategoriesRestaurantsBlock() {
    const block = document.getElementById('restaurants-browser');
    if (!block) return;

    const queryInput = document.getElementById('restaurants-search');
    const searchHistoryDatalist = document.getElementById('restaurants-search-history');
    const categorySelect = document.getElementById('restaurants-filter-category');
    const ratingSelect = document.getElementById('restaurants-filter-rating');
    const isNewCheckbox = document.getElementById('restaurants-filter-new');
    const clearBtn = document.getElementById('restaurants-filter-clear');
    const list = document.getElementById('restaurants-list');

    if (!queryInput || !searchHistoryDatalist || !categorySelect || !ratingSelect || !isNewCheckbox || !clearBtn || !list) {
        console.error('Restaurants browser: some elements are missing');
        return;
    }

    const data = await loadCategoriesRestaurantsData();

    categorySelect.innerHTML = `<option value="">All categories</option>` + buildCategoryOptions(data.categories);

    renderSearchHistoryDatalist();

    const getFilters = () => ({
        query: queryInput.value,
        categoryId: categorySelect.value,
        minRating: ratingSelect.value,
        onlyNew: isNewCheckbox.checked
    });

    const update = () => {
        const filtered = applyRestaurantFilters(data, getFilters());
        renderRestaurantsList(list, filtered, data.categoriesById);
    };

    queryInput.addEventListener('input', update);
    queryInput.addEventListener('focus', renderSearchHistoryDatalist);
    queryInput.addEventListener('change', () => {
        addQueryToHistory(queryInput.value);
        renderSearchHistoryDatalist();
        update();
    });
    queryInput.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        addQueryToHistory(queryInput.value);
        renderSearchHistoryDatalist();
        update();
    });
    categorySelect.addEventListener('change', update);
    ratingSelect.addEventListener('change', update);
    isNewCheckbox.addEventListener('change', update);

    clearBtn.addEventListener('click', () => {
        queryInput.value = '';
        categorySelect.value = '';
        ratingSelect.value = '';
        isNewCheckbox.checked = false;
        renderSearchHistoryDatalist();
        update();
    });

    update();
}

document.addEventListener('DOMContentLoaded', () => {
    initCategoriesRestaurantsBlock().catch(err => {
        console.error(err);
    });
});
