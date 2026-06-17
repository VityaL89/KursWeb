function adminRenderMenuItemCard(mi, restaurantsById) {
    const restName = restaurantsById[String(mi.restaurantId)]?.name || '-';
    return `
        <div class="admin-card" data-menu-item-id="${adminNormalizeIdString(mi.id)}">
            <h3 class="admin-card-title">${mi.name}</h3>
            <p class="admin-card-meta">Restaurant: ${restName}</p>
            <p class="admin-card-meta">Category: ${mi.category || '-'}</p>
            <p class="admin-card-meta">Price: € ${Number(mi.price || 0).toFixed(2)}</p>
            <div class="admin-card-actions">
                <button class="admin-secondary-btn" data-action="edit-menu-item">Edit</button>
                <button class="admin-danger-btn" data-action="delete-menu-item">Delete</button>
            </div>
        </div>
    `;
}

function adminMenuItemFormHtml(mi, restaurants) {
    const restaurantOptions = restaurants.map(r => {
        const selected = String(mi?.restaurantId) === String(r.id) ? 'selected' : '';
        return `<option value="${r.id}" ${selected}>${r.name}</option>`;
    }).join('');

    return `
        <form id="menu-item-form" class="admin-form">
            <input class="admin-input full" name="name" placeholder="Name" value="${mi?.name ?? ''}" required>
            <select class="admin-select full" name="restaurantId" required>
                ${restaurantOptions}
            </select>
            <input class="admin-input full" name="category" placeholder="Category (To eat / Dessert / To drink ...)" value="${mi?.category ?? ''}" required>
            <input class="admin-input full" name="price" placeholder="Price" value="${mi?.price ?? ''}" required>
            <textarea class="admin-textarea full" name="description" placeholder="Description">${mi?.description ?? ''}</textarea>
            <div class="admin-form-actions full">
                <button type="button" class="admin-secondary-btn" id="modal-cancel">Cancel</button>
                <button type="submit" class="admin-primary-btn">Save</button>
            </div>
        </form>
    `;
}

async function adminBindMenuItems(state, refreshUI) {
    adminQs('#menu-restaurant-filter').addEventListener('change', () => refreshUI());

    adminQs('#add-menu-item-btn').addEventListener('click', async () => {
        adminOpenModal('Add menu item', adminMenuItemFormHtml(null, state.restaurants));
        const form = adminQs('#menu-item-form');
        adminQs('#modal-cancel').addEventListener('click', adminCloseModal);
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = adminFormDataToObject(form);
            const payload = {
                id: undefined,
                restaurantId: Number(data.restaurantId),
                name: data.name,
                description: data.description,
                price: Number(data.price),
                category: data.category
            };
            const created = await adminApiPost('/menuItems', payload);
            state.menuItems.push(created);
            adminCloseModal();
            await refreshUI();
        });
    });

    adminQs('#admin-panel').addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;

        const action = btn.dataset.action;
        if (action !== 'edit-menu-item' && action !== 'delete-menu-item') return;

        const card = btn.closest('[data-menu-item-id]');
        const id = card?.dataset.menuItemId;
        const mi = state.menuItems.find(x => String(x.id) === String(id));
        if (!mi) return;

        if (action === 'delete-menu-item') {
            if (!confirm('Delete menu item?')) return;
            await adminApiDelete(`/menuItems/${id}`);
            state.menuItems = state.menuItems.filter(x => String(x.id) !== String(id));
            await refreshUI();
            return;
        }

        adminOpenModal('Edit menu item', adminMenuItemFormHtml(mi, state.restaurants));
        adminQs('#modal-cancel').addEventListener('click', adminCloseModal);
        adminQs('#menu-item-form').addEventListener('submit', async (ev) => {
            ev.preventDefault();
            const data = adminFormDataToObject(adminQs('#menu-item-form'));
            const payload = {
                ...mi,
                restaurantId: Number(data.restaurantId),
                name: data.name,
                description: data.description,
                price: Number(data.price),
                category: data.category
            };
            const updated = await adminApiPut(`/menuItems/${id}`, payload);
            state.menuItems = state.menuItems.map(x => String(x.id) === String(id) ? updated : x);
            adminCloseModal();
            await refreshUI();
        });
    });
}
