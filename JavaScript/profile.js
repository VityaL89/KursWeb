function formatEuro(value) {
    const n = Number(value) || 0;
    return `€ ${n.toFixed(2).replace('.', ',')}`;
}

function formatDateTime(iso) {
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

async function loadUserOrders(userId) {
    const res = await fetch(`http://localhost:3000/orders?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to load orders: ${res.status} ${text}`);
    }
    return await res.json();
}

function renderOrders(orders) {
    const container = document.getElementById('profile-orders');
    if (!container) return;

    container.innerHTML = '';

    const list = Array.isArray(orders) ? orders : [];
    if (!list.length) {
        const empty = document.createElement('div');
        empty.className = 'order-empty';
        empty.textContent = 'No orders yet';
        container.appendChild(empty);
        return;
    }

    const sorted = [...list].sort((a, b) => {
        const ta = new Date(a?.createdAt || 0).getTime();
        const tb = new Date(b?.createdAt || 0).getTime();
        return tb - ta;
    });

    sorted.forEach(order => {
        const card = document.createElement('div');
        card.className = 'order-card';
        card.dataset.orderId = String(order?.id ?? '');

        const top = document.createElement('div');
        top.className = 'order-card-top';
        top.innerHTML = `
            <div class="order-card-title">
                Order #${order?.id ?? ''}
                <span class="order-status">${order?.status || 'Accepted'}</span>
            </div>
            <div class="order-card-date">${formatDateTime(order?.createdAt) || ''}</div>
        `;

        const itemsWrap = document.createElement('div');
        itemsWrap.className = 'order-card-items';

        const items = Array.isArray(order?.items) ? order.items : [];
        items.forEach(i => {
            const row = document.createElement('div');
            row.className = 'order-card-item';
            row.innerHTML = `
                <span>${Number(i.quantity) || 0}</span>
                <span>${i.name || ''}</span>
                <span>${formatEuro((Number(i.price) || 0) * (Number(i.quantity) || 0))}</span>
            `;
            itemsWrap.appendChild(row);
        });

        const total = document.createElement('div');
        total.className = 'order-card-total';
        total.innerHTML = `
            <span>Total</span>
            <span>${formatEuro(order?.total)}</span>
        `;

        const actions = document.createElement('div');
        actions.className = 'order-card-actions';
        actions.innerHTML = `
            <button class="order-repeat-btn" type="button" data-repeat-order="${order?.id ?? ''}">Repeat order</button>
        `;

        card.appendChild(top);
        card.appendChild(itemsWrap);
        card.appendChild(total);
        card.appendChild(actions);
        container.appendChild(card);
    });
}

async function repeatOrderById(orderId) {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!user) {
        window.location.href = 'SignUp.html';
        return;
    }

    const orders = await loadUserOrders(user.id);
    const order = (Array.isArray(orders) ? orders : []).find(o => String(o.id) === String(orderId));
    if (!order) return;

    const items = Array.isArray(order?.items) ? order.items : [];
    const safeItems = items.map(i => ({
        id: i.id,
        name: i.name,
        description: i.description,
        price: Number(i.price) || 0,
        quantity: Number(i.quantity) || 0
    })).filter(i => i.quantity > 0);

    const cart = await loadCurrentCart();
    cart.restaurantId = cart?.restaurantId ?? null;
    cart.items = safeItems;
    cart.total = safeItems.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
    await saveCurrentCart(cart);

    if (typeof updateHeaderCartTotalFromServer === 'function') {
        updateHeaderCartTotalFromServer();
    }

    window.location.href = 'OrderFormStep1.html';
}

function bindTabs() {
    const tabs = Array.from(document.querySelectorAll('.profile-tab'));
    const panels = Array.from(document.querySelectorAll('.profile-panel'));

    const setActive = (name) => {
        tabs.forEach(t => t.classList.toggle('is-active', t.dataset.tab === name));
        panels.forEach(p => p.classList.toggle('is-active', p.dataset.panel === name));
    };

    tabs.forEach(t => {
        t.addEventListener('click', () => {
            setActive(t.dataset.tab);
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!user) {
        window.location.href = 'SignUp.html';
        return;
    }

    const emailLink = document.getElementById('profile-email-link');
    if (emailLink) {
        emailLink.textContent = user.email || '—';
        emailLink.href = user.email ? `mailto:${user.email}` : '#';
    }

    const logoutBtn = document.getElementById('profile-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (typeof logoutUser === 'function') logoutUser();
        });
    }

    bindTabs();

    const ordersMount = document.getElementById('profile-orders');
    if (ordersMount) {
        ordersMount.addEventListener('click', async (e) => {
            const btn = e.target?.closest?.('[data-repeat-order]');
            if (!btn) return;
            const orderId = btn.getAttribute('data-repeat-order');
            if (!orderId) return;

            try {
                btn.disabled = true;
                await repeatOrderById(orderId);
            } catch (err) {
                console.error(err);
                alert('Failed to repeat order');
            } finally {
                btn.disabled = false;
            }
        });
    }

    try {
        const orders = await loadUserOrders(user.id);
        renderOrders(orders);
    } catch (e) {
        console.error(e);
        renderOrders([]);
    }
});
