const API_URL = 'http://localhost:3000';

let isCartSidebarOpen = false;

function updateHeaderCartTotalFromServer() {
    const headerTotal = document.getElementById('header-cart-total');
    if (headerTotal) {
        fetch(`${API_URL}/carts`)
            .then(res => res.json())
            .then(carts => {
                let total = 0;
                carts.forEach(cart => {
                    if (cart.items) {
                        cart.items.forEach(item => {
                            total += item.price * item.quantity;
                        });
                    }
                });
                headerTotal.textContent = `€ ${total.toFixed(2)}`;
            })
            .catch(error => console.error('Ошибка загрузки корзины:', error));
    }
}

function toggleCartSidebar() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    
    if (!isCartSidebarOpen) {
        sidebar.style.display = 'flex';
        overlay.style.display = 'block';
        isCartSidebarOpen = true;
        loadCartData();
    } else {
        sidebar.style.display = 'none';
        overlay.style.display = 'none';
        isCartSidebarOpen = false;
    }
}

async function loadCartData() {
    try {
        const resRestaurants = await fetch(`${API_URL}/restaurants`);
        const restaurants = await resRestaurants.json();
        
        const res = await fetch(`${API_URL}/carts`);
        const carts = await res.json();

        let allItems = [];
        let total = 0;
        carts.forEach(cart => {
            if (cart.items) {
                const restaurant = restaurants.find(r => r.id === cart.restaurantId);
                const restaurantName = restaurant ? restaurant.name : 'Unknown restaurant';
                
                cart.items.forEach(item => {
                    allItems.push({
                        ...item,
                        cartId: cart.id,
                        restaurantId: cart.restaurantId,
                        restaurantName: restaurantName
                    });
                    total += item.price * item.quantity;
                });
            }
        });
        updateCartUI(allItems, total);
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
    }
}

function updateCartUI(items, total) {
    const cartContainer = document.getElementById('cart-items-container');
    const totalElement = document.getElementById('cart-total-price');
    
    cartContainer.innerHTML = '';
    
    if (items.length === 0) {
        cartContainer.innerHTML = '<p style="text-align: center; color: #6B7280; padding: 20px;">Your cart is empty</p>';
        totalElement.textContent = '€ 0,00';
        return;
    }
    
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-description">${item.description || ''}</div>
                <div class="cart-item-price">€ ${(item.price * item.quantity).toFixed(2)}</div>
            </div>
            <div class="cart-item-controls">
                <select class="cart-item-quantity">
                    ${Array.from({length: 11}, (_, i) => `<option value="${i}" ${i === item.quantity ? 'selected' : ''}>${i}</option>`).join('')}
                </select>
            </div>
        `;
        
        const select = itemElement.querySelector('.cart-item-quantity');
        select.addEventListener('change', async function() {
            const newQuantity = parseInt(this.value);
            if (newQuantity > 0) {

                const cartId = item.cartId;
                const resCart = await fetch(`${API_URL}/carts/${cartId}`);
                const currentCart = await resCart.json();
                if (currentCart) {
                    const cartItem = currentCart.items.find(c => c.id === item.id);
                    if (cartItem) {
                        cartItem.quantity = newQuantity;
                        currentCart.total = currentCart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
                        await fetch(`${API_URL}/carts/${cartId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(currentCart)
                        });

                        loadCartData();
                        updateHeaderCartTotalFromServer();
                    }
                }
            } else if (newQuantity === 0) {

                const cartId = item.cartId;
                const resCart = await fetch(`${API_URL}/carts/${cartId}`);
                const currentCart = await resCart.json();
                if (currentCart) {
                    const index = currentCart.items.findIndex(c => c.id === item.id);
                    if (index !== -1) {
                        currentCart.items.splice(index, 1);
                        currentCart.total = currentCart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
                        await fetch(`${API_URL}/carts/${cartId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(currentCart)
                        });
                        loadCartData();
                        updateHeaderCartTotalFromServer();
                    }
                }
            }
        });
        
        cartContainer.appendChild(itemElement);
    });
    
    totalElement.textContent = `€ ${total.toFixed(2)}`;
}

document.addEventListener('DOMContentLoaded', function() {
    updateHeaderCartTotalFromServer();
    
    const cartButton = document.getElementById('header-cart-btn');
    if (cartButton) {
        cartButton.addEventListener('click', toggleCartSidebar);
    }
    
    document.getElementById('cart-close-btn').addEventListener('click', toggleCartSidebar);
    document.getElementById('cart-overlay').addEventListener('click', toggleCartSidebar);
    
    document.getElementById('cart-checkout-btn').addEventListener('click', function() {
        alert('Переход к оформлению заказа!');
    });
});