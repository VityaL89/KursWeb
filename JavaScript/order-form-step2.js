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

// ========== ВАЛИДАЦИЯ АДРЕСА ==========

function validateStreetname(streetname) {
    if (!streetname || streetname.trim() === '') {
        return { valid: false, message: 'Street name is required' };
    }
    if (streetname.length < 2) {
        return { valid: false, message: 'Street name must be at least 2 characters' };
    }
    if (streetname.length > 100) {
        return { valid: false, message: 'Street name must be less than 100 characters' };
    }
    return { valid: true, message: '' };
}

function validateHouse(house) {
    if (!house || house.trim() === '') {
        return { valid: false, message: 'House number is required' };
    }
    if (house.length > 10) {
        return { valid: false, message: 'House number must be less than 10 characters' };
    }
    if (!/^[a-zA-Z0-9\s\/\-]+$/.test(house)) {
        return { valid: false, message: 'House number can only contain letters, numbers, spaces, slashes and hyphens' };
    }
    return { valid: true, message: '' };
}

function validateZipcode(zipcode) {
    if (!zipcode || zipcode.trim() === '') {
        return { valid: false, message: 'Zipcode is required' };
    }
    const zipRegex = /^[a-zA-Z0-9\s\-]{3,10}$/;
    if (!zipRegex.test(zipcode)) {
        return { valid: false, message: 'Please enter a valid zipcode (3-10 characters, letters and numbers only)' };
    }
    return { valid: true, message: '' };
}

function validateCity(city) {
    if (!city || city.trim() === '') {
        return { valid: false, message: 'City is required' };
    }
    if (city.length < 2) {
        return { valid: false, message: 'City name must be at least 2 characters' };
    }
    if (city.length > 50) {
        return { valid: false, message: 'City name must be less than 50 characters' };
    }
    if (!/^[a-zA-Zа-яА-ЯёЁ\s'-]+$/.test(city)) {
        return { valid: false, message: 'City name can only contain letters, spaces, hyphens and apostrophes' };
    }
    return { valid: true, message: '' };
}

// ========== ОТОБРАЖЕНИЕ ОШИБОК АДРЕСА ==========

function showAddressError(inputId, errorMessage) {
    const input = document.getElementById(inputId);
    const formGroup = input?.closest('.delivery-group');
    if (!formGroup) return;

    const existingError = formGroup.querySelector('.field-error');
    if (existingError) existingError.remove();

    if (errorMessage) {
        input.style.border = '1px solid #DC2626';
        input.style.backgroundColor = '#FEF2F2';
        
        const errorSpan = document.createElement('span');
        errorSpan.className = 'field-error';
        errorSpan.style.cssText = 'color: #DC2626; font-size: 12px; margin-top: 4px; display: block;';
        errorSpan.textContent = errorMessage;
        formGroup.appendChild(errorSpan);
    } else {
        input.style.border = '';
        input.style.backgroundColor = '';
    }
}

function clearAllAddressErrors() {
    const errors = document.querySelectorAll('.field-error');
    errors.forEach(error => error.remove());
    
    const inputs = document.querySelectorAll('.delivery-group input');
    inputs.forEach(input => {
        input.style.border = '';
        input.style.backgroundColor = '';
    });
}

function validateAllAddressFields() {
    const streetname = document.getElementById('streetname')?.value || '';
    const house = document.getElementById('house')?.value || '';
    const zipcode = document.getElementById('zipcode')?.value || '';
    const city = document.getElementById('city')?.value || '';

    const streetResult = validateStreetname(streetname);
    const houseResult = validateHouse(house);
    const zipResult = validateZipcode(zipcode);
    const cityResult = validateCity(city);

    showAddressError('streetname', streetResult.valid ? '' : streetResult.message);
    showAddressError('house', houseResult.valid ? '' : houseResult.message);
    showAddressError('zipcode', zipResult.valid ? '' : zipResult.message);
    showAddressError('city', cityResult.valid ? '' : cityResult.message);

    return streetResult.valid && houseResult.valid && zipResult.valid && cityResult.valid;
}

function getAddressDetailsFromForm() {
    return {
        streetname: document.getElementById('streetname')?.value || '',
        house: document.getElementById('house')?.value || '',
        zipcode: document.getElementById('zipcode')?.value || '',
        city: document.getElementById('city')?.value || ''
    };
}

function bindRealTimeAddressValidation() {
    const streetname = document.getElementById('streetname');
    const house = document.getElementById('house');
    const zipcode = document.getElementById('zipcode');
    const city = document.getElementById('city');

    if (streetname) {
        streetname.addEventListener('input', () => {
            const result = validateStreetname(streetname.value);
            showAddressError('streetname', result.valid ? '' : result.message);
        });
    }

    if (house) {
        house.addEventListener('input', () => {
            const result = validateHouse(house.value);
            showAddressError('house', result.valid ? '' : result.message);
        });
    }

    if (zipcode) {
        zipcode.addEventListener('input', () => {
            const result = validateZipcode(zipcode.value);
            showAddressError('zipcode', result.valid ? '' : result.message);
        });
    }

    if (city) {
        city.addEventListener('input', () => {
            const result = validateCity(city.value);
            showAddressError('city', result.valid ? '' : result.message);
        });
    }
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
        
        clearAllAddressErrors();
        const isValid = validateAllAddressFields();
        
        if (!isValid) {
            const firstError = document.querySelector('.field-error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

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
            status: 'Accepted',
            contact,
            address,
            items,
            total
        };

        try {
            const created = await createOrder(orderPayload);
            await clearCurrentCart();
            sessionStorage.removeItem('orderContactDetails');
            window.location.href = `FinalOrder3.html?orderId=${encodeURIComponent(created.id)}`;
        } catch (error) {
            console.error('Order creation failed:', error);
            alert('Failed to create order. Please try again.');
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    bindRealTimeAddressValidation();
    bindStep2Navigation();

    try {
        const cart = await loadCurrentCart();
        renderOrderItems(cart);
        
        if (!cart.items || cart.items.length === 0) {
            const placeOrderBtn = document.querySelector('.btn-place-order');
            if (placeOrderBtn) {
                placeOrderBtn.disabled = true;
                placeOrderBtn.style.opacity = '0.5';
                placeOrderBtn.style.cursor = 'not-allowed';
                
                const warning = document.createElement('div');
                warning.style.cssText = 'color: #DC2626; font-size: 14px; margin-top: 16px; text-align: center;';
                warning.textContent = 'Your cart is empty. Please add items before proceeding.';
                document.querySelector('.delivery-section')?.appendChild(warning);
            }
        }
    } catch (e) {
        console.error('Failed to render order items on step2', e);
    }
});