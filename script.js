let products = [];
let cart = JSON.parse(localStorage.getItem('pizzaCart')) || [];
let ordersHistory = JSON.parse(localStorage.getItem('pizzaOrders')) || [];

document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    
    const productsContainer = document.getElementById('products-container'); // Сторінка Меню
    const recommendedContainer = document.getElementById('recommended-container'); // Головна
    const ordersContainer = document.getElementById('orders-container'); // Сторінка Замовлень

    // Завантажуємо товари, якщо ми на Головній або в Меню
    if (productsContainer || recommendedContainer) {
        fetchProducts(productsContainer, recommendedContainer);
    }

    // Рендеримо замовлення, якщо ми на сторінці Історії
    if (ordersContainer) {
        renderOrders();
    }

    // Слухач на форму оформлення замовлення
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckout);
    }
});

// Завантаження товарів
async function fetchProducts(menuCont, recCont) {
    try {
        const response = await fetch('products.json');
        products = await response.json();
        
        if (menuCont) renderCards(products, menuCont);
        if (recCont) {
            const recommended = products.filter(p => p.recommended);
            renderCards(recommended, recCont);
        }
    } catch (error) {
        console.error("Помилка завантаження:", error);
    }
}

// Візуалізація карток
// Візуалізація карток
function renderCards(items, container) {
    container.innerHTML = '';

    items.forEach(product => {
        container.innerHTML += `
            <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4 d-flex">
                <div class="card product-card w-100 shadow-sm">

                    <!-- ВИПРАВЛЕНІ КАРТИНКИ -->
                    <img 
                        src="${product.image}" 
                        class="card-img-top product-img" 
                        alt="${product.name}"
                        onerror="this.onerror=null; this.src='https://via.placeholder.com/500x300?text=No+Image';"
                    >

                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title fw-bold">${product.name}</h5>

                        <p class="card-text text-muted small flex-grow-1">
                            ${product.description}
                        </p>

                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <span class="fs-5 fw-bold text-danger">
                                ${product.price} ₴
                            </span>

                            <button 
                                class="btn btn-warning fw-bold"
                                onclick="addToCart(${product.id})"
                            >
                                <i class="bi bi-cart-plus"></i> В кошик
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

// Фільтрація (тільки для сторінки Меню)
function filterProducts(category) {
    document.querySelectorAll('#filters button').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    const container = document.getElementById('products-container');
    if (category === 'all') {
        renderCards(products, container);
    } else {
        const filtered = products.filter(p => p.category === category);
        renderCards(filtered, container);
    }
}

// === ЛОГІКА КОШИКА ===
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existing = cart.find(item => item.id === productId);
    
    if (existing) existing.quantity++;
    else cart.push({ ...product, quantity: 1 });

    saveCart();
    updateCartUI();
}

function changeQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) cart = cart.filter(i => i.id !== productId);
        saveCart();
        updateCartUI();
    }
}

function saveCart() { 
    localStorage.setItem('pizzaCart', JSON.stringify(cart)); 
}

function updateCartUI() {
    const badge = document.getElementById('cart-badge');
    const itemsCont = document.getElementById('cart-items');
    const totalCont = document.getElementById('cart-total');
    const form = document.getElementById('checkout-form');

    if (!badge || !itemsCont) return;

    badge.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cart.length === 0) {
        itemsCont.innerHTML = '<p class="text-center text-muted my-3">Кошик порожній</p>';
        totalCont.innerText = '0 ₴';
        form.classList.add('d-none');
        return;
    }

    form.classList.remove('d-none');
    itemsCont.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
        itemsCont.innerHTML += `
            <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <div>
                    <h6 class="mb-0 fw-bold">${item.name}</h6>
                    <small class="text-muted">${item.price} ₴ x ${item.quantity}</small>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-danger qty-btn" onclick="changeQuantity(${item.id}, -1)">-</button>
                    <span class="fw-bold align-self-center">${item.quantity}</span>
                    <button class="btn btn-sm btn-outline-success qty-btn" onclick="changeQuantity(${item.id}, 1)">+</button>
                </div>
            </div>`;
    });
    totalCont.innerText = `${total} ₴`;
}

// === ОФОРМЛЕННЯ ТА ІСТОРІЯ ===
function handleCheckout(e) {
    e.preventDefault();
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const newOrder = {
        id: Math.floor(Math.random() * 1000000), // Випадковий номер замовлення
        date: new Date().toLocaleString('uk-UA'),
        items: [...cart],
        totalPrice: total
    };

    ordersHistory.unshift(newOrder); 
    localStorage.setItem('pizzaOrders', JSON.stringify(ordersHistory));

    cart = [];
    saveCart();
    updateCartUI();
    e.target.reset();

    // Закриття модального вікна
    const modalElement = document.getElementById('cartModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if(modalInstance) modalInstance.hide();

    alert('Замовлення успішно оформлено! Перейдіть в "Мої замовлення", щоб переглянути деталі.');
    
    if (document.getElementById('orders-container')) renderOrders();
}

function renderOrders() {
    const container = document.getElementById('orders-container');
    if (ordersHistory.length === 0) {
        container.innerHTML = `<div class="alert alert-warning text-center fw-bold">Ви ще нічого не замовляли. <a href="menu.html" class="alert-link text-dark">Перейти до меню</a></div>`;
        return;
    }

    container.innerHTML = '';
    ordersHistory.forEach(order => {
        let itemsHTML = order.items.map(i => `<li>${i.name} <span class="text-muted">(x${i.quantity})</span></li>`).join('');
        
        container.innerHTML += `
            <div class="card mb-3 shadow-sm border-0 border-start border-warning border-5">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="text-muted small">Замовлення №${order.id}</span>
                        <span class="badge bg-success">Оформлено</span>
                    </div>
                    <p class="mb-2 text-muted small"><i class="bi bi-clock"></i> ${order.date}</p>
                    <ul class="mb-3 ps-3">${itemsHTML}</ul>
                    <h5 class="fw-bold mb-0 text-end text-danger">Сума: ${order.totalPrice} ₴</h5>
                </div>
            </div>
        `;
    });
}