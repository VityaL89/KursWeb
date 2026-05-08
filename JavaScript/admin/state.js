async function adminLoadAllData() {
    const [restaurants, menuItems, categories] = await Promise.all([
        adminApiGet('/restaurants'),
        adminApiGet('/menuItems'),
        adminApiGet('/categories')
    ]);
    return { restaurants, menuItems, categories };
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
}
