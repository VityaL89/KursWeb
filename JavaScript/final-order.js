const FINAL_ORDER_API_URL = 'http://localhost:3000';

function formatEuro(value) {
    const n = Number(value) || 0;
    return `€ ${n.toFixed(2).replace('.', ',')}`;
}

function formatTimeLabel(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';

    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');

    const now = new Date();
    const isToday = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    return isToday ? `${hh}:${mm} today` : `${hh}:${mm}`;
}

function getOrderIdFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get('orderId');
}

async function loadOrder(orderId) {
    const res = await fetch(`${FINAL_ORDER_API_URL}/orders/${encodeURIComponent(orderId)}`);
    if (!res.ok) throw new Error(`Failed to load order: ${res.status}`);
    return await res.json();
}

function renderOrder(order) {
    const timeEl = document.querySelector('.delivery-time');
    if (timeEl) timeEl.textContent = formatTimeLabel(order?.createdAt) || '—';

    const itemsContainer = document.querySelector('.card-items');
    if (itemsContainer) {
        itemsContainer.innerHTML = '';
        const items = Array.isArray(order?.items) ? order.items : [];

        if (!items.length) {
            const empty = document.createElement('div');
            empty.className = 'item-row';
            empty.style.justifyContent = 'center';
            empty.style.color = '#6B7280';
            empty.style.padding = '12px 0';
            empty.textContent = 'No items';
            itemsContainer.appendChild(empty);
        } else {
            items.forEach(i => {
                const row = document.createElement('div');
                row.className = 'item-row';
                row.innerHTML = `
                    <span class="item-qty">${Number(i.quantity) || 0}</span>
                    <span class="item-name">${i.name || ''}</span>
                    <span class="item-price">${formatEuro((Number(i.price) || 0) * (Number(i.quantity) || 0))}</span>
                `;
                itemsContainer.appendChild(row);
            });
        }
    }

    const totalEl = document.querySelector('.card-total .total-price');
    if (totalEl) totalEl.textContent = formatEuro(order?.total);
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const orderId = getOrderIdFromQuery();
        if (!orderId) return;
        const order = await loadOrder(orderId);
        renderOrder(order);
    } catch (e) {
        console.error(e);
    }
});
