async function adminLoadAllData() {
    const [restaurants, menuItems, categories, orders] = await Promise.all([
        adminApiGet('/restaurants'),
        adminApiGet('/menuItems'),
        adminApiGet('/categories'),
        adminApiGet('/orders')
    ]);
    return { restaurants, menuItems, categories, orders };
}

function adminBuildMaps(state) {
    const categoriesById = Object.fromEntries(state.categories.map(c => [String(c.id), c]));
    const restaurantsById = Object.fromEntries(state.restaurants.map(r => [String(r.id), r]));
    return { categoriesById, restaurantsById };
}

async function adminRefreshUI(state) {
    const { categoriesById, restaurantsById } = adminBuildMaps(state);

    adminQs('#restaurants-list').innerHTML = state.restaurants
        .map(r => adminRenderRestaurantCard(r, categoriesById))
        .join('');

    const filter = adminQs('#menu-restaurant-filter');
    const currentValue = filter.value || '';
    filter.innerHTML = `<option value="">All</option>` + state.restaurants
        .map(r => `<option value="${r.id}">${r.name}</option>`)
        .join('');
    if (currentValue) filter.value = currentValue;

    const selectedRestaurantId = filter.value;
    const visibleMenuItems = selectedRestaurantId
        ? state.menuItems.filter(mi => String(mi.restaurantId) === String(selectedRestaurantId))
        : state.menuItems;

    adminQs('#menu-items-list').innerHTML = visibleMenuItems
        .map(mi => adminRenderMenuItemCard(mi, restaurantsById))
        .join('');

    adminQs('#categories-list').innerHTML = state.categories
        .map(c => adminRenderCategoryCard(c))
        .join('');

    const ordersMount = document.getElementById('orders-list');
    if (ordersMount && Array.isArray(state.orders) && typeof adminRenderOrderCard === 'function') {
        ordersMount.innerHTML = state.orders
            .slice()
            .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
            .map(o => adminRenderOrderCard(o))
            .join('');
    }
}
