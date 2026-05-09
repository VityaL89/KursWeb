const ADMIN_NOTIFICATION_TYPES = [
    { value: 'discounts', label: 'Discounts' },
    { value: 'promotions', label: 'Promotions' },
    { value: 'new_restaurants', label: 'New restaurants' }
];

function adminFormatDateTimeShort(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';

    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
}

function adminRenderNotificationCard(n) {
    const typeText = ADMIN_NOTIFICATION_TYPES.find(t => t.value === n?.type)?.label || (n?.type || '-');

    return `
        <div class="admin-card" data-notification-id="${adminNormalizeIdString(n?.id)}">
            <h3 class="admin-card-title">${n?.title || ''}</h3>
            <p class="admin-card-meta">Type: ${typeText}</p>
            <p class="admin-card-meta">${adminFormatDateTimeShort(n?.createdAt) || ''}</p>
            <p class="admin-card-meta">${n?.message || ''}</p>
            <div class="admin-card-actions">
                <button class="admin-danger-btn" data-action="delete-notification">Delete</button>
            </div>
        </div>
    `;
}

function adminNotificationFormHtml() {
    const options = ADMIN_NOTIFICATION_TYPES
        .filter(t => t.value === 'discounts' || t.value === 'promotions')
        .map(t => `<option value="${t.value}">${t.label}</option>`)
        .join('');

    return `
        <form id="notification-form" class="admin-form">
            <select class="admin-select full" name="type" required>
                ${options}
            </select>
            <input class="admin-input full" name="title" placeholder="Title" required>
            <textarea class="admin-textarea full" name="message" placeholder="Message" required></textarea>
            <div class="admin-form-actions full">
                <button type="button" class="admin-secondary-btn" id="modal-cancel">Cancel</button>
                <button type="submit" class="admin-primary-btn">Create</button>
            </div>
        </form>
    `;
}

async function adminBindNotifications(state, refreshUI) {
    const addBtn = document.getElementById('add-notification-btn');
    if (addBtn) {
        addBtn.addEventListener('click', async () => {
            adminOpenModal('Add notification', adminNotificationFormHtml());
            const form = adminQs('#notification-form');
            adminQs('#modal-cancel').addEventListener('click', adminCloseModal);

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const data = adminFormDataToObject(form);

                const payload = {
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    createdAt: new Date().toISOString(),
                    userId: null,
                    restaurantId: null
                };

                const created = await adminApiPost('/notifications', payload);
                state.notifications.push(created);
                adminCloseModal();
                await refreshUI();
                adminSetActiveTab('notifications');
            });
        });
    }

    const panel = document.getElementById('admin-panel');
    if (!panel) return;

    panel.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;

        const action = btn.dataset.action;
        if (action !== 'delete-notification') return;

        const card = btn.closest('[data-notification-id]');
        const id = card?.dataset.notificationId;
        if (!id) return;

        if (!confirm('Delete notification?')) return;

        try {
            await adminApiDelete(`/notifications/${id}`);
            state.notifications = state.notifications.filter(n => String(n.id) !== String(id));
            await refreshUI();
            adminSetActiveTab('notifications');
        } catch (err) {
            console.error(err);
            alert('Failed to delete notification');
        }
    });
}
