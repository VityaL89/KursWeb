const ADMIN_ORDER_STATUSES = ['Accepted', 'On the way', 'Delivered'];

function adminFormatEuro(value) {
    const n = Number(value) || 0;
    return `€ ${n.toFixed(2).replace('.', ',')}`;
}

function adminFormatDateTime(iso) {
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

function adminRenderOrderCard(order) {
    const status = order?.status || 'Accepted';
    const options = ADMIN_ORDER_STATUSES
        .map(s => `<option value="${s}" ${s === status ? 'selected' : ''}>${s}</option>`)
        .join('');

    const items = Array.isArray(order?.items) ? order.items : [];
    const itemsPreview = items
        .slice(0, 3)
        .map(i => `${Number(i.quantity) || 0}× ${i.name || ''}`)
        .join(', ');

    const more = items.length > 3 ? ` (+${items.length - 3})` : '';

    return `
        <div class="admin-card" data-order-id="${order?.id ?? ''}">
            <h3 class="admin-card-title">Order #${order?.id ?? ''}</h3>
            <p class="admin-card-meta">${adminFormatDateTime(order?.createdAt) || ''}</p>
            <p class="admin-card-meta">User: ${order?.userId ?? 'guest'}</p>
            <p class="admin-card-meta">${itemsPreview}${more}</p>
            <p class="admin-card-meta">Total: ${adminFormatEuro(order?.total)}</p>

            <div class="admin-filter-row" style="margin: 8px 0 0;">
                <label class="admin-label" for="order-status-${order?.id ?? ''}">Status</label>
                <select id="order-status-${order?.id ?? ''}" class="admin-select" data-order-status>
                    ${options}
                </select>
            </div>
        </div>
    `;
}

async function adminBindOrders(state, refreshUI) {
    const mount = document.getElementById('orders-list');
    if (!mount) return;

    mount.addEventListener('change', async (e) => {
        const select = e.target?.closest?.('[data-order-status]');
        if (!select) return;

        const card = select.closest('[data-order-id]');
        const orderId = card?.dataset?.orderId;
        if (!orderId) return;

        const nextStatus = select.value;

        try {
            const current = state.orders?.find(o => String(o.id) === String(orderId));
            if (!current) return;

            const updated = { ...current, status: nextStatus };
            await adminApiPut(`/orders/${orderId}`, updated);

            // обновляем локальный state + UI
            current.status = nextStatus;
            await refreshUI();
            adminSetActiveTab('orders');
        } catch (err) {
            console.error(err);
            alert('Failed to update order status');
            await refreshUI();
            adminSetActiveTab('orders');
        }
    });
}
