// =================================================================
// script.js - VERSIÓN FINAL OPERATIVA MY BELLA AFRODITA
// =================================================================

// 1. Inicialización Global
let carrito = JSON.parse(localStorage.getItem('myBellaCarrito')) || [];
const WHATSAPP_NUMBER = '5492646121771';

document.addEventListener('DOMContentLoaded', () => {

    // Sincronizar UI inicial
    actualizarContadorUI();

    // --- 1. Lógica Scroll Navbar ---
    const nav = document.getElementById('mainNav');
    if (nav) {
        if (window.scrollY > 50) nav.classList.add('scrolled');
        window.addEventListener('scroll', () => {
            window.scrollY > 50 ? nav.classList.add('scrolled') : nav.classList.remove('scrolled');
        });
    }

    // --- 2. Evento Agregar al Carrito ---
    const buyButtons = document.querySelectorAll('.btn-whatsapp-product');
    buyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.card, .promo-card');
            const productName = button.getAttribute('data-product');
            const productType = button.getAttribute('data-type') || 'Artículo';
            
            let selectedTalle = null;
            let priceText = '0';

            const talleGroupContainer = card.querySelector('.talle-select-group');
            if (talleGroupContainer) {
                const checkedRadio = talleGroupContainer.querySelector('input[type="radio"]:checked');
                selectedTalle = checkedRadio ? checkedRadio.value : null;
                if (!selectedTalle) {
                    alert(`¡Por favor, selecciona un talle para: ${productName}!`);
                    return;
                }
            }

            const priceElement = card.querySelector('.price-final, .price-text');
            if (priceElement) {
                priceText = priceElement.innerText.replace(/[$. ]/g, '').trim();
            }

            const producto = {
                id: Date.now(),
                nombre: productName,
                tipo: productType,
                talle: selectedTalle || 'Único',
                precio: parseInt(priceText) || 0,
                cantidad: 1
            };

            agregarProducto(producto);
        });
    });

    // --- 3. Control del Modal (Dibujar items) ---
    const modalCarrito = document.getElementById('cartModal');
    if (modalCarrito) {
        modalCarrito.addEventListener('show.bs.modal', renderizarCarrito);
    }

    // --- 4. BOTÓN FINALIZAR COMPRA (Dentro del DOMContentLoaded) ---
    const btnCheckout = document.getElementById('btn-checkout');
    if (btnCheckout) {
        btnCheckout.addEventListener('click', () => {
            if (carrito.length === 0) {
                alert("El carrito está vacío.");
                return;
            }

            let mensaje = "¡Hola My Bella Afrodita! 👋 Quiero realizar el siguiente pedido:\n\n";
            let total = 0;

            carrito.forEach(item => {
                const subtotal = item.precio * item.cantidad;
                mensaje += `🛍️ *${item.nombre}*\n`;
                mensaje += `   Talle: ${item.talle}\n`;
                mensaje += `   Cant: ${item.cantidad} x $${item.precio.toLocaleString('es-AR')}\n`;
                mensaje += `   Subtotal: $${subtotal.toLocaleString('es-AR')}\n\n`;
                total += subtotal;
            });

            mensaje += `--------------------------\n`;
            mensaje += `💰 *TOTAL A PAGAR: $${total.toLocaleString('es-AR')}*`;

            const encodedMessage = encodeURIComponent(mensaje);
            const url = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodedMessage}`;

            window.open(url, '_blank');
        });
    }
});

// --- FUNCIONES GLOBALES ---

function agregarProducto(itemNuevo) {
    const index = carrito.findIndex(item => item.nombre === itemNuevo.nombre && item.talle === itemNuevo.talle);
    if (index !== -1) {
        carrito[index].cantidad++;
    } else {
        carrito.push(itemNuevo);
    }
    guardarCarrito();
    actualizarContadorUI();
    alert(`✅ ${itemNuevo.nombre} \n-------Añadido al Carrito-------`);
}

function guardarCarrito() {
    localStorage.setItem('myBellaCarrito', JSON.stringify(carrito));
}

function actualizarContadorUI() {
    const contador = document.getElementById('cart-count');
    if (contador) {
        const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
        contador.innerText = totalItems;
    }
}

function renderizarCarrito() {
    const container = document.getElementById('cart-items-container');
    const totalElement = document.getElementById('cart-total-amount');
    if (!container) return;

    if (carrito.length === 0) {
        container.innerHTML = '<p class="text-center py-4">Tu carrito está vacío.</p>';
        totalElement.innerText = '$0';
        return;
    }

    container.innerHTML = '';
    let totalAcumulado = 0;

    carrito.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        totalAcumulado += subtotal;
        container.innerHTML += `
            <div class="row align-items-center mb-3 border-bottom pb-2">
                <div class="col-6">
                    <h6 class="mb-0 fw-bold">${item.nombre}</h6>
                    <small class="text-muted">Talle: ${item.talle}</small>
                </div>
                <div class="col-4 text-center">
                    <span>${item.cantidad} x $${item.precio.toLocaleString('es-AR')}</span>
                </div>
                <div class="col-2 text-end">
                    <button class="btn btn-sm text-danger" onclick="eliminarItem(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`;
    });
    totalElement.innerText = `$${totalAcumulado.toLocaleString('es-AR')}`;
}

function eliminarItem(index) {
    carrito.splice(index, 1);
    guardarCarrito();
    actualizarContadorUI();
    renderizarCarrito();
}

function limpiarCarritoCompleto() {
    if(confirm("¿Seguro que quieres vaciar el carrito?")) {
        carrito = [];
        guardarCarrito();
        actualizarContadorUI();
        renderizarCarrito();
    }
}