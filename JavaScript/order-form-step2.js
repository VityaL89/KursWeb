function formatEuro(value) {
    const n = Number(value) || 0;
    return `€ ${n.toFixed(2).replace('.', ',')}`;
}

function renderOrderItems(cart) {
    const itemsContainer = document.querySelector('.order-items');
    const totalEl = document.querySelector('.order-total .total-price');

    if (!itemsContainer) return;

    itemsContainer.innerHTML = '';

    const items = cart && Array.isArray(cart.items) ? cart.items : [];

    if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'order-item';
        empty.style.justifyContent = 'center';
        empty.style.color = '#6B7280';
        empty.style.padding = '12px 0';
        empty.textContent = 'Your cart is empty';
        itemsContainer.appendChild(empty);
        if (totalEl) totalEl.textContent = formatEuro(0);
        return;
    }

    items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'order-item';
        row.innerHTML = `
            <span class="item-qty">${Number(item.quantity) || 0}</span>
            <span class="item-name">${item.name || ''}</span>
            <span class="item-price">${formatEuro((Number(item.price) || 0) * (Number(item.quantity) || 0))}</span>
        `;
        itemsContainer.appendChild(row);
    });

    const total = Number(cart?.total) || items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
    if (totalEl) totalEl.textContent = formatEuro(total);
}

function loadContactDetailsFromSession() {
    try {
        const raw = sessionStorage.getItem('orderContactDetails');
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed && typeof parsed === 'object') {
            return {
                firstName: parsed.firstName || '',
                lastName: parsed.lastName || '',
                email: parsed.email || '',
                phone: parsed.phone || ''
            };
        }
    } catch (e) {
        console.error('Failed to read orderContactDetails', e);
    }
    return { firstName: '', lastName: '', email: '', phone: '' };
}

function getAddressDetailsFromForm() {
    return {
        streetname: document.getElementById('streetname')?.value || '',
        house: document.getElementById('house')?.value || '',
        zipcode: document.getElementById('zipcode')?.value || '',
        city: document.getElementById('city')?.value || ''
    };
}

async function createOrder(orderPayload) {
    const res = await fetch('http://localhost:3000/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to create order: ${res.status} ${text}`);
    }
    return await res.json();
}

function bindStep2Navigation() {
    const prevBtn = document.querySelector('.btn-previous');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            window.location.href = 'OrderFormStep1.html';
        });
    }

    const form = document.querySelector('form.delivery-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const contact = loadContactDetailsFromSession();
        const address = getAddressDetailsFromForm();
        const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;

        const cart = await loadCurrentCart();
        const items = Array.isArray(cart?.items) ? cart.items : [];
        const total = Number(cart?.total) || items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);

        if (!items.length) {
            alert('Your cart is empty');
            return;
        }

        const orderPayload = {
            userId: user?.id ?? null,
            createdAt: new Date().toISOString(),
            contact,
            address,
            items,
            total
        };

        const created = await createOrder(orderPayload);

        await clearCurrentCart();
        sessionStorage.removeItem('orderContactDetails');

        window.location.href = `FinalOrder3.html?orderId=${encodeURIComponent(created.id)}`;
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    bindStep2Navigation();

    try {
        const cart = await loadCurrentCart();
        renderOrderItems(cart);
    } catch (e) {
        console.error('Failed to render order items on step2', e);
    }
});
