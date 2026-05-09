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

        card.appendChild(top);
        card.appendChild(itemsWrap);
        card.appendChild(total);
        container.appendChild(card);
    });
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

    try {
        const orders = await loadUserOrders(user.id);
        renderOrders(orders);
    } catch (e) {
        console.error(e);
        renderOrders([]);
    }
});
