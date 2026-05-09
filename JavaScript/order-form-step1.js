function formatEuro(value) {
    const n = Number(value) || 0;
    return `€ ${n.toFixed(2).replace('.', ',')}`;
}

function autofillContactDetails() {
    const user = getCurrentUser();
    if (!user) return;

    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');

    if (firstNameInput && !firstNameInput.value) firstNameInput.value = user.firstName || '';
    if (lastNameInput && !lastNameInput.value) lastNameInput.value = user.lastName || '';
    if (emailInput && !emailInput.value) emailInput.value = user.email || '';
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

function saveContactDetailsToSession() {
    const payload = {
        firstName: document.getElementById('firstName')?.value || '',
        lastName: document.getElementById('lastName')?.value || '',
        email: document.getElementById('email')?.value || '',
        phone: document.getElementById('phone')?.value || ''
    };

    try {
        sessionStorage.setItem('orderContactDetails', JSON.stringify(payload));
    } catch (e) {
        console.error('Failed to save orderContactDetails to sessionStorage', e);
    }
}

function bindStep1FormNavigation() {
    const form = document.querySelector('form.contact-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveContactDetailsToSession();
        window.location.href = 'OrderFormStep2.html';
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    autofillContactDetails();

    bindStep1FormNavigation();

    try {
        const cart = await loadCurrentCart();
        renderOrderItems(cart);
    } catch (e) {
        console.error('Failed to render order items', e);
    }
});
