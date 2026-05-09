function adminRenderRestaurantCard(r, categoriesById) {
    const categoryName = categoriesById[String(r.categoryId)]?.name || '-';
    const tagsText = adminFormatTags(r.tags);
    return `
        <div class="admin-card" data-restaurant-id="${adminNormalizeIdString(r.id)}">
            <h3 class="admin-card-title">${r.name}</h3>
            <p class="admin-card-meta">Category: ${categoryName}</p>
            <p class="admin-card-meta">Rating: ${r.rating ?? '-'}</p>
            <p class="admin-card-meta">Tags: ${tagsText || '-'}</p>
            <div class="admin-card-actions">
                <button class="admin-secondary-btn" data-action="edit-restaurant">Edit</button>
                <button class="admin-danger-btn" data-action="delete-restaurant">Delete</button>
            </div>
        </div>
    `;
}

function adminRestaurantFormHtml(r, categories) {
    const categoryOptions = categories.map(c => {
        const selected = String(r?.categoryId) === String(c.id) ? 'selected' : '';
        return `<option value="${c.id}" ${selected}>${c.name}</option>`;
    }).join('');

    return `
        <form id="restaurant-form" class="admin-form">
            <input class="admin-input full" name="name" placeholder="Name" value="${r?.name ?? ''}" required>
            <select class="admin-select full" name="categoryId" required>
                ${categoryOptions}
            </select>
            <input class="admin-input" name="slug" placeholder="Slug" value="${r?.slug ?? ''}" required>
            <input class="admin-input" name="image" placeholder="Image path" value="${r?.image ?? ''}">
            <input class="admin-input" name="rating" placeholder="Rating (e.g. 4.2)" value="${r?.rating ?? ''}">
            <input class="admin-input" name="ratingText" placeholder="Rating text" value="${r?.ratingText ?? ''}">
            <input class="admin-input full" name="tags" placeholder="Tags (comma-separated)" value="${adminFormatTags(r?.tags)}">
            <textarea class="admin-textarea full" name="description" placeholder="Description">${r?.description ?? ''}</textarea>
            <input class="admin-input" name="lat" placeholder="Lat" value="${r?.lat ?? ''}">
            <input class="admin-input" name="lng" placeholder="Lng" value="${r?.lng ?? ''}">
            <label class="admin-label full" style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" name="isNew" ${r?.isNew ? 'checked' : ''}>
                New
            </label>
            <div class="admin-form-actions full">
                <button type="button" class="admin-secondary-btn" id="modal-cancel">Cancel</button>
                <button type="submit" class="admin-primary-btn">Save</button>
            </div>
        </form>
    `;
}

async function adminBindRestaurants(state, refreshUI) {
    adminQs('#add-restaurant-btn').addEventListener('click', async () => {
        adminOpenModal('Add restaurant', adminRestaurantFormHtml(null, state.categories));
        const form = adminQs('#restaurant-form');
        adminQs('#modal-cancel').addEventListener('click', adminCloseModal);
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = adminFormDataToObject(form);
            const payload = {
                id: undefined,
                name: data.name,
                categoryId: Number(data.categoryId),
                slug: data.slug,
                description: data.description,
                rating: data.rating === '' ? 0 : Number(data.rating),
                ratingText: data.ratingText,
                image: data.image,
                tags: adminParseTags(data.tags),
                isNew: !!data.isNew,
                lat: data.lat === '' ? 0 : Number(data.lat),
                lng: data.lng === '' ? 0 : Number(data.lng)
            };
            const created = await adminApiPost('/restaurants', payload);
            state.restaurants.push(created);

            try {
                const notifPayload = {
                    type: 'new_restaurants',
                    title: 'New restaurant',
                    message: `${created.name} is now available`,
                    createdAt: new Date().toISOString(),
                    userId: null,
                    restaurantId: created.id
                };
                const notif = await adminApiPost('/notifications', notifPayload);
                state.notifications = Array.isArray(state.notifications) ? state.notifications : [];
                state.notifications.push(notif);
            } catch (e) {
                console.error('Failed to create new restaurant notification', e);
            }

            adminCloseModal();
            await refreshUI();
        });
    });

    adminQs('#admin-panel').addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;

        const action = btn.dataset.action;
        if (action !== 'edit-restaurant' && action !== 'delete-restaurant') return;

        const card = btn.closest('[data-restaurant-id]');
        const id = card?.dataset.restaurantId;
        const r = state.restaurants.find(x => String(x.id) === String(id));
        if (!r) return;

        if (action === 'delete-restaurant') {
            if (!confirm('Delete restaurant?')) return;
            await adminApiDelete(`/restaurants/${id}`);
            state.restaurants = state.restaurants.filter(x => String(x.id) !== String(id));
            await refreshUI();
            return;
        }

        adminOpenModal('Edit restaurant', adminRestaurantFormHtml(r, state.categories));
        adminQs('#modal-cancel').addEventListener('click', adminCloseModal);
        adminQs('#restaurant-form').addEventListener('submit', async (ev) => {
            ev.preventDefault();
            const data = adminFormDataToObject(adminQs('#restaurant-form'));
            const payload = {
                ...r,
                name: data.name,
                categoryId: Number(data.categoryId),
                slug: data.slug,
                description: data.description,
                rating: data.rating === '' ? 0 : Number(data.rating),
                ratingText: data.ratingText,
                image: data.image,
                tags: adminParseTags(data.tags),
                isNew: !!data.isNew,
                lat: data.lat === '' ? 0 : Number(data.lat),
                lng: data.lng === '' ? 0 : Number(data.lng)
            };
            const updated = await adminApiPut(`/restaurants/${id}`, payload);
            state.restaurants = state.restaurants.map(x => String(x.id) === String(id) ? updated : x);
            adminCloseModal();
            await refreshUI();
        });
    });
}
