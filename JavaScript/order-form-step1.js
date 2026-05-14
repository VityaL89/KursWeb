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
    const phoneInput = document.getElementById('phone');
    const phone = phoneInput?.value || '';
    
    if (!validatePhoneNumber(phone)) {
        showPhoneValidationError(false);
        return false;
    }
    
    const payload = {
        firstName: document.getElementById('firstName')?.value || '',
        lastName: document.getElementById('lastName')?.value || '',
        email: document.getElementById('email')?.value || '',
        phone: phone
    };
    
    try {
        sessionStorage.setItem('orderContactDetails', JSON.stringify(payload));
        return true;
    } catch (e) {
        console.error('Failed to save orderContactDetails to sessionStorage', e);
        return false;
    }
}

function bindStep1FormNavigation() {
    const form = document.querySelector('form.contact-form');
    if (!form) return;
    

    const nextBtn = form.querySelector('.btn-next');
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            

            const isValid = saveContactDetailsToSession();
            
            if (isValid) {
                window.location.href = 'OrderFormStep2.html';
            } else {

                const phoneInput = document.getElementById('phone');
                if (phoneInput) {
                    phoneInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    phoneInput.focus();
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    autofillContactDetails();
    bindStep1FormNavigation();
    bindPhoneValidation();  
    
    try {
        const cart = await loadCurrentCart();
        renderOrderItems(cart);
    } catch (e) {
        console.error('Failed to render order items', e);
    }
});

function validatePhoneNumber(phone) {
    
    if (!phone || phone.trim() === '') {
        return true;
    }
    
    const cleanPhone = phone.replace(/[\s\-]/g, '');
    
    const phoneRegex = /^\+375(29|33|25|44)\d{7}$/;
    
    return phoneRegex.test(cleanPhone);
}

function showPhoneValidationError(isValid) {
    const phoneInput = document.getElementById('phone');
    const phoneGroup = document.querySelector('.form-group-phone');
    
    if (!phoneInput || !phoneGroup) return;
    
    const existingError = phoneGroup.querySelector('.validation-error');
    if (existingError) {
        existingError.remove();
    }
    
    if (!isValid && phoneInput.value.trim() !== '') {
        phoneInput.style.border = '1px solid #DC2626';
        phoneInput.style.backgroundColor = '#FEF2F2';
        
        const errorMsg = document.createElement('span');
        errorMsg.className = 'validation-error';
        errorMsg.style.cssText = 'color: #DC2626; font-size: 12px; margin-top: 4px; display: block;';
        errorMsg.textContent = 'Invalid phone format. Use +375 (29/33/25/44) and 7 digits. Example: +375291234567';
        phoneGroup.appendChild(errorMsg);
    } else {
        phoneInput.style.border = '';
        phoneInput.style.backgroundColor = '';
    }
}

function bindPhoneValidation() {
    const phoneInput = document.getElementById('phone');
    if (!phoneInput) return;
    
    phoneInput.addEventListener('input', function() {
        const isValid = validatePhoneNumber(this.value);
        showPhoneValidationError(isValid);
    });
    
    phoneInput.addEventListener('blur', function() {
        const isValid = validatePhoneNumber(this.value);
        showPhoneValidationError(isValid);
    });
}