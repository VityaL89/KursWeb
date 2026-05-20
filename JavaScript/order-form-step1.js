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

function validateFirstName(firstName) {
    if (!firstName || firstName.trim() === '') {
        return { valid: false, message: 'First name is required' };
    }
    if (firstName.length < 2) {
        return { valid: false, message: 'First name must be at least 2 characters' };
    }
    if (firstName.length > 50) {
        return { valid: false, message: 'First name must be less than 50 characters' };
    }
    if (!/^[a-zA-Zа-яА-ЯёЁ\s'-]+$/.test(firstName)) {
        return { valid: false, message: 'First name can only contain letters, spaces, hyphens and apostrophes' };
    }
    return { valid: true, message: '' };
}

function validateLastName(lastName) {
    if (!lastName || lastName.trim() === '') {
        return { valid: false, message: 'Last name is required' };
    }
    if (lastName.length < 2) {
        return { valid: false, message: 'Last name must be at least 2 characters' };
    }
    if (lastName.length > 50) {
        return { valid: false, message: 'Last name must be less than 50 characters' };
    }
    if (!/^[a-zA-Zа-яА-ЯёЁ\s'-]+$/.test(lastName)) {
        return { valid: false, message: 'Last name can only contain letters, spaces, hyphens and apostrophes' };
    }
    return { valid: true, message: '' };
}

function validateEmail(email) {
    if (!email || email.trim() === '') {
        return { valid: false, message: 'Email address is required' };
    }
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, message: 'Please enter a valid email address (e.g., name@example.com)' };
    }
    return { valid: true, message: '' };
}

function validatePhoneNumber(phone) {
    if (!phone || phone.trim() === '') {
        return { valid: true, message: '' };
    }
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^\+375(29|33|25|44)\d{7}$/;
    if (!phoneRegex.test(cleanPhone)) {
        return { valid: false, message: 'Invalid phone format. Use +375 (29/33/25/44) and 7 digits. Example: +375291234567' };
    }
    return { valid: true, message: '' };
}

function showFieldError(inputId, errorMessage) {
    const input = document.getElementById(inputId);
    const formGroup = input?.closest('.form-group');
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

function clearAllErrors() {
    const errors = document.querySelectorAll('.field-error');
    errors.forEach(error => error.remove());
    
    const inputs = document.querySelectorAll('.form-group input');
    inputs.forEach(input => {
        input.style.border = '';
        input.style.backgroundColor = '';
    });
}

function validateAllFields() {
    const firstName = document.getElementById('firstName')?.value || '';
    const lastName = document.getElementById('lastName')?.value || '';
    const email = document.getElementById('email')?.value || '';
    const phone = document.getElementById('phone')?.value || '';

    const firstNameResult = validateFirstName(firstName);
    const lastNameResult = validateLastName(lastName);
    const emailResult = validateEmail(email);
    const phoneResult = validatePhoneNumber(phone);

    showFieldError('firstName', firstNameResult.valid ? '' : firstNameResult.message);
    showFieldError('lastName', lastNameResult.valid ? '' : lastNameResult.message);
    showFieldError('email', emailResult.valid ? '' : emailResult.message);
    showFieldError('phone', phoneResult.valid ? '' : phoneResult.message);

    return firstNameResult.valid && lastNameResult.valid && emailResult.valid && phoneResult.valid;
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
            
            clearAllErrors();
            const isValid = validateAllFields();
            
            if (isValid) {
                saveContactDetailsToSession();
                window.location.href = 'OrderFormStep2.html';
            } else {
                const firstError = document.querySelector('.field-error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    }
}

function bindRealTimeValidation() {
    const firstName = document.getElementById('firstName');
    const lastName = document.getElementById('lastName');
    const email = document.getElementById('email');
    const phone = document.getElementById('phone');

    if (firstName) {
        firstName.addEventListener('input', () => {
            const result = validateFirstName(firstName.value);
            showFieldError('firstName', result.valid ? '' : result.message);
        });
        firstName.addEventListener('blur', () => {
            const result = validateFirstName(firstName.value);
            showFieldError('firstName', result.valid ? '' : result.message);
        });
    }

    if (lastName) {
        lastName.addEventListener('input', () => {
            const result = validateLastName(lastName.value);
            showFieldError('lastName', result.valid ? '' : result.message);
        });
        lastName.addEventListener('blur', () => {
            const result = validateLastName(lastName.value);
            showFieldError('lastName', result.valid ? '' : result.message);
        });
    }

    if (email) {
        email.addEventListener('input', () => {
            const result = validateEmail(email.value);
            showFieldError('email', result.valid ? '' : result.message);
        });
        email.addEventListener('blur', () => {
            const result = validateEmail(email.value);
            showFieldError('email', result.valid ? '' : result.message);
        });
    }

    if (phone) {
        phone.addEventListener('input', () => {
            const result = validatePhoneNumber(phone.value);
            showFieldError('phone', result.valid ? '' : result.message);
        });
        phone.addEventListener('blur', () => {
            const result = validatePhoneNumber(phone.value);
            showFieldError('phone', result.valid ? '' : result.message);
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    autofillContactDetails();
    bindRealTimeValidation();
    bindStep1FormNavigation();
    
    try {
        const cart = await loadCurrentCart();
        renderOrderItems(cart);
        
        if (!cart.items || cart.items.length === 0) {
            const nextBtn = document.querySelector('.btn-next');
            if (nextBtn) {
                nextBtn.disabled = true;
                nextBtn.style.opacity = '0.5';
                nextBtn.style.cursor = 'not-allowed';
                
                const warning = document.createElement('div');
                warning.style.cssText = 'color: #DC2626; font-size: 14px; margin-top: -8px;; text-align: center;';
                warning.textContent = 'Your cart is empty. Please add items before proceeding.';
                document.querySelector('.contact-section')?.appendChild(warning);
            }
        }
    } catch (e) {
        console.error('Failed to render order items', e);
    }
});