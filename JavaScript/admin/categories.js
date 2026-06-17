function adminRenderCategoryCard(c) {
    return `
        <div class="admin-card" data-category-id="${adminNormalizeIdString(c.id)}">
            <h3 class="admin-card-title">${c.name}</h3>
            <p class="admin-card-meta">Slug: ${c.slug}</p>
            <p class="admin-card-meta">Image: ${c.image || '-'}</p>
            <div class="admin-card-actions">
                <button class="admin-secondary-btn" data-action="edit-category">Edit</button>
                <button class="admin-danger-btn" data-action="delete-category">Delete</button>
            </div>
        </div>
    `;
}

function adminCategoryFormHtml(c) {
    return `
        <form id="category-form" class="admin-form">
            <input class="admin-input full" name="name" placeholder="Name" value="${c?.name ?? ''}" required>
            <input class="admin-input full" name="slug" placeholder="Slug" value="${c?.slug ?? ''}" required>
            <input class="admin-input full" name="image" placeholder="Image" value="${c?.image ?? ''}">
            <input class="admin-input full" name="bannerImage" placeholder="Banner image" value="${c?.bannerImage ?? ''}">
            <div class="admin-form-actions full">
                <button type="button" class="admin-secondary-btn" id="modal-cancel">Cancel</button>
                <button type="submit" class="admin-primary-btn">Save</button>
            </div>
        </form>
    `;
}

async function adminBindCategories(state, refreshUI) {
    adminQs('#add-category-btn').addEventListener('click', async () => {
        adminOpenModal('Add category', adminCategoryFormHtml(null));
        const form = adminQs('#category-form');
        adminQs('#modal-cancel').addEventListener('click', adminCloseModal);
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = adminFormDataToObject(form);
            const payload = {
                id: undefined,
                name: data.name,
                slug: data.slug,
                image: data.image,
                bannerImage: data.bannerImage
            };
            const created = await adminApiPost('/categories', payload);
            state.categories.push(created);
            adminCloseModal();
            await refreshUI();
        });
    });

    adminQs('#admin-panel').addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;

        const action = btn.dataset.action;
        if (action !== 'edit-category' && action !== 'delete-category') return;

        const card = btn.closest('[data-category-id]');
        const id = card?.dataset.categoryId;
        const c = state.categories.find(x => String(x.id) === String(id));
        if (!c) return;

        if (action === 'delete-category') {
            if (!confirm('Delete category?')) return;
            await adminApiDelete(`/categories/${id}`);
            state.categories = state.categories.filter(x => String(x.id) !== String(id));
            await refreshUI();
            return;
        }

        adminOpenModal('Edit category', adminCategoryFormHtml(c));
        adminQs('#modal-cancel').addEventListener('click', adminCloseModal);
        adminQs('#category-form').addEventListener('submit', async (ev) => {
            ev.preventDefault();
            const data = adminFormDataToObject(adminQs('#category-form'));
            const payload = {
                ...c,
                name: data.name,
                slug: data.slug,
                image: data.image,
                bannerImage: data.bannerImage
            };
            const updated = await adminApiPut(`/categories/${id}`, payload);
            state.categories = state.categories.map(x => String(x.id) === String(id) ? updated : x);
            adminCloseModal();
            await refreshUI();
        });
    });
}
