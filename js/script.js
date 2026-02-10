/* ==========================================================================
   LÓGICA DE NEGOCIO OPTIMIZADA - MY BELLA AFRODITA (BOUTIQUE STYLE)
   ========================================================================== */

const WHATSAPP_NUMBER = '5492646121771';
let carrito = JSON.parse(localStorage.getItem('myBellaCarrito')) || [];
let avisoMayoristaMostrado = false;

document.addEventListener('DOMContentLoaded', () => {
    // Aplicar el fondo del :root al body
    document.body.style.backgroundColor = "var(--brand-bg)";
    
    actualizarContadorUI();

    if (typeof PRODUCTOS === 'undefined') return;

    const contenedor = document.getElementById("contenedor-productos");
    if (contenedor) {
        const titulo = document.title.toLowerCase();
        let categoriaBuscada = "";
        
        if (titulo.includes("conjuntos")) {
            categoriaBuscada = "conjuntos";
        } else if (titulo.includes("bombachas")) {
            categoriaBuscada = "bombachas";
        } else if (titulo.includes("hombres") || titulo.includes("essentials")) {
            categoriaBuscada = "hombres";
        } else if (titulo.includes("medias")) {
            categoriaBuscada = "medias";
        }
        
        const filtrados = PRODUCTOS.filter(p => p.categoria.toLowerCase() === categoriaBuscada);
        dibujarProductos(filtrados);
    }

    const modalCarrito = document.getElementById('cartModal');
    if (modalCarrito) {
        modalCarrito.addEventListener('show.bs.modal', renderizarListaCarrito);
    }
});

// --- CÁLCULO DE TOTALES ---
function calcularTotalCarrito() {
    let totalGeneral = 0;
    let unidadesTotales = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    let cumpleCriterioCantidad = unidadesTotales >= 3;
    let detallesPromo = [];
    let aplicoAlgunaPromocion = false;
    
    carrito.forEach(item => {
        const p = PRODUCTOS.find(prod => prod.id === item.id);
        if (p) {
            if (cumpleCriterioCantidad && p.precioMayorista && p.precioMayorista > 0) {
                totalGeneral += p.precioMayorista * item.cantidad;
                aplicoAlgunaPromocion = true; 
            } else {
                totalGeneral += (p.precioMinorista || p.precio) * item.cantidad;
            }
        } else {
            totalGeneral += item.precio * item.cantidad;
        }
    });

    if (aplicoAlgunaPromocion) {
        detallesPromo.push("Precio Mayorista Aplicado");
    }
    
    return { 
        total: totalGeneral, 
        promos: detallesPromo, 
        esMayorista: aplicoAlgunaPromocion 
    };
}

function dibujarProductos(lista) {
    const contenedor = document.getElementById("contenedor-productos");
    if (!contenedor) return;
    contenedor.innerHTML = "";
    
    lista.forEach(p => {
        // Lógica de Stock: Si p.stock es undefined, asumimos que hay stock.
        const tieneStock = p.stock !== false;
        
        let htmlPrecios = "";
        if (p.precioMayorista) {
            htmlPrecios = `
                <div class="price-container mb-3 p-2" style="background-color: var(--brand-nude); border-radius: 4px; opacity: ${tieneStock ? '1' : '0.5'};">
                    <div class="row g-0 align-items-center">
                        <div class="col-6 border-end" style="border-color: rgba(0,0,0,0.1) !important;">
                            <small class="text-muted text-uppercase d-block" style="font-size: 0.6rem; letter-spacing: 1px;">Minorista</small>
                            <span class="fw-bold text-dark" style="font-size: 1.1rem;">$${p.precioMinorista.toLocaleString('es-AR')}</span>
                        </div>
                        <div class="col-6">
                            <small class="text-uppercase d-block fw-bold" style="font-size: 0.6rem; letter-spacing: 1px; color: var(--brand-accent);">Mayorista (3+)</small>
                            <span class="fw-bold" style="font-size: 1.1rem; color: var(--brand-primary);">$${p.precioMayorista.toLocaleString('es-AR')}</span>
                        </div>
                    </div>
                </div>`;
        } else {
            htmlPrecios = `
                <div class="price-container mb-3 p-2" style="opacity: ${tieneStock ? '1' : '0.5'};">
                    <small class="text-muted text-uppercase d-block" style="font-size: 0.6rem; letter-spacing: 1px;">Precio Único</small>
                    <span class="fw-bold text-dark" style="font-size: 1.3rem;">$${p.precioMinorista.toLocaleString('es-AR')}</span>
                </div>`;
        }

        // Badge de Agotado
        const badgeAgotado = !tieneStock ? 
            `<div class="position-absolute top-0 start-0 m-3 z-2">
                <span class="badge px-3 py-2 text-uppercase" style="background-color: rgba(0,0,0,0.7); color: white; border-radius: 0; font-size: 0.7rem; letter-spacing: 2px;">Agotado</span>
             </div>` : '';

        contenedor.innerHTML += `
            <div class="col-12 col-md-6 col-lg-4 mb-4 d-flex">
                <div class="product-card shadow-sm w-100 d-flex flex-column position-relative" 
                     style="transition: var(--transition-smooth); background-color: var(--white-pure); border-radius: 12px; overflow: hidden; border: 1px solid rgba(0,0,0,0.05); ${!tieneStock ? 'filter: grayscale(0.4);' : ''}">
                    ${badgeAgotado}
                    <div class="card-img-container" style="cursor: ${tieneStock ? 'pointer' : 'default'}; overflow: hidden;" 
                         onclick="${tieneStock ? `mostrarDetalleProducto('${p.id}')` : ''}">
                        <img src="${p.imagenes[0]}" alt="${p.nombre}" loading="lazy" class="img-fluid"
                             style="transition: var(--transition-smooth); min-height: 350px; object-fit: cover; opacity: ${tieneStock ? '1' : '0.6'};"
                             onmouseover="${tieneStock && p.imagenes[1] ? `this.src='${p.imagenes[1]}'` : ''}"
                             onmouseout="this.src='${p.imagenes[0]}'">
                    </div>
                    <div class="card-body text-center d-flex flex-column justify-content-between p-3">
                        <div>
                            <h5 class="card-title" style="font-family: 'Playfair Display', serif; font-size: 1.1rem; min-height: 2.8rem; color: var(--brand-primary);">${p.nombre}</h5>
                            <p class="text-muted small mb-3" style="font-size: 0.8rem; line-height: 1.3; min-height: 2.5rem;">${p.descripcion}</p>
                        </div>
                        ${htmlPrecios}
                        <button class="btn w-100 py-2 text-uppercase fw-bold" 
                                style="letter-spacing: 1px; font-size: 0.8rem; background-color: ${tieneStock ? 'var(--brand-primary)' : '#ccc'}; color: white; border-radius: 0; transition: var(--transition-smooth); border: none;"
                                ${tieneStock ? `onclick="agregarAlCarrito(event, '${p.id}')"` : 'disabled'}>
                            <i class="fas ${tieneStock ? 'fa-shopping-bag' : 'fa-times'} me-2"></i> 
                            ${tieneStock ? 'Añadir a la Bolsa' : 'Sin Stock'}
                        </button>
                    </div>
                </div>
            </div>`;
    });
}

window.renderizarListaCarrito = function() {
    const container = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    if (!container) return;

    if (carrito.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <h5 class="text-muted">Tu bolsa está vacía</h5>
                <button class="btn btn-outline-dark btn-sm mt-3 rounded-0 text-uppercase" data-bs-dismiss="modal" style="letter-spacing: 1px;">
                    Continuar Comprando
                </button>
            </div>`;
        if (totalElement) totalElement.innerText = '$0';
        return;
    }

    const res = calcularTotalCarrito();
    let cartHtml = `
        <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
            <span class="fw-bold text-uppercase small text-muted">${carrito.reduce((acc, i) => acc + i.cantidad, 0)} Items</span>
            <button class="btn btn-link text-danger text-decoration-none p-0 small fw-bold" onclick="confirmarVaciarCarrito()">
                <i class="fas fa-trash-alt me-1"></i> VACIAR BOLSA
            </button>
        </div>
    `;

    carrito.forEach((item, index) => {
        const p = PRODUCTOS.find(prod => prod.id === item.id);
        const unidadesTotales = carrito.reduce((acc, i) => acc + i.cantidad, 0);
        
        // Lógica de precio para el carrito: si hay 3+ y el producto tiene precio mayorista
        let precioAplicado = (unidadesTotales >= 3 && p?.precioMayorista) ? p.precioMayorista : (p?.precioMinorista || item.precio);
        
        cartHtml += `
            <div class="row align-items-center mb-4 g-2">
                <div class="col-3 col-md-2">
                    <img src="${item.imagen}" class="img-fluid rounded-3 shadow-sm" style="height: 70px; width: 70px; object-fit: cover;">
                </div>
                <div class="col-5 col-md-6 px-3">
                    <p class="mb-0 fw-bold text-dark small">${item.nombre}</p>
                    <span class="text-muted small">$${precioAplicado.toLocaleString('es-AR')}</span>
                    <div class="mt-1">
                        <button class="btn btn-sm text-danger p-0 border-0 bg-transparent" style="font-size: 0.75rem;" onclick="eliminarDelCarrito(${index})">
                            Quitar
                        </button>
                    </div>
                </div>
                <div class="col-4 col-md-4 text-end">
                    <div class="d-flex align-items-center justify-content-end mb-2">
                        <div class="d-flex align-items-center bg-light rounded-pill border p-1" style="transform: scale(0.9);">
                            <button class="btn btn-sm btn-light rounded-circle border-0 p-0" style="width:25px; height:25px;" onclick="cambiarCantidad(${index}, -1)">-</button>
                            <span class="px-3 small fw-bold text-dark">${item.cantidad}</span>
                            <button class="btn btn-sm btn-light rounded-circle border-0 p-0" style="width:25px; height:25px;" onclick="cambiarCantidad(${index}, 1)">+</button>
                        </div>
                    </div>
                    <span class="text-muted small fw-bold text-dark">$${(precioAplicado * item.cantidad).toLocaleString('es-AR')}</span>
                </div>
            </div>`;
    });

    // AGREGAMOS EL BOTÓN QUE TE FALTABA AL FINAL DEL HTML GENERADO
    cartHtml += `
        <div class="text-center border-top pt-3 mt-2">
            <button class="btn btn-link text-muted small text-decoration-none text-uppercase" 
                    data-bs-dismiss="modal" style="letter-spacing: 1px;">
                Continuar Comprando
            </button>
        </div>
    `;

    container.innerHTML = cartHtml;

    if (totalElement) {
        totalElement.innerHTML = `
            <div class="text-end">
                ${res.promos.map(p => `<div class="text-success small fw-bold" style="font-size: 0.8rem;">✨ ${p}</div>`).join('')}
                ${!res.esMayorista ? `<div class="text-muted small" style="font-size: 0.7rem;">Agregá ${Math.max(0, 3 - carrito.reduce((acc, i) => acc + i.cantidad, 0))} más para precio mayorista</div>` : ''}
                <div class="mt-1 fw-bold" style="font-size: 1.5rem; color: #8c002c;">$${res.total.toLocaleString('es-AR')}</div>
            </div>`;
    }
}

// --- LOGICA DE CARRITO ---
window.agregarAlCarrito = function (event, id) {
    if(event) event.stopPropagation();
    const p = PRODUCTOS.find(prod => prod.id === id);
    if (!p) return;
    const existe = carrito.find(item => item.id === id);
    if (existe) {
        existe.cantidad++; 
    } else {
        carrito.push({ id: p.id, nombre: p.nombre, precio: p.precioMinorista, imagen: p.imagenes[0], cantidad: 1 }); 
    }
    actualizarYGuardar();
    mostrarNotificacion(p.nombre);
    verificarHitoMayorista(); // Verifica si desbloqueó la promo
};

window.cambiarCantidad = function (index, valor) {
    if (carrito[index].cantidad + valor > 0) {
        carrito[index].cantidad += valor;
    } else {
        carrito.splice(index, 1);
    }
    actualizarYGuardar();
    renderizarListaCarrito();
    verificarHitoMayorista();
};

window.eliminarDelCarrito = function (index) {
    carrito.splice(index, 1);
    actualizarYGuardar();
    renderizarListaCarrito();
    verificarHitoMayorista();
};

// --- NOTIFICACIÓN PROFESIONAL MAYORISTA ---
function verificarHitoMayorista() {
    const { esMayorista } = calcularTotalCarrito();
    
    if (esMayorista && !avisoMayoristaMostrado) {
        const toastMayorista = Swal.mixin({
            toast: true,
            position: 'top-center',
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true,
            background: '#28a745',
            color: '#fff'
        });
        toastMayorista.fire({
            icon: 'success',
            title: '¡Beneficio Mayorista Activado!',
            text: 'Has accedido a precios especiales en productos seleccionados.'
        });
        avisoMayoristaMostrado = true;
    } else if (!esMayorista) {
        avisoMayoristaMostrado = false;
    }
}

window.confirmarVaciarCarrito = function() {
    Swal.fire({
        title: '¿Vaciar tu bolsa?',
        text: "Se eliminarán todos los productos seleccionados.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#8c002c',
        cancelButtonColor: '#333333',
        confirmButtonText: 'Sí, vaciar',
        cancelButtonText: 'Cancelar',
        borderRadius: '0',
    }).then((result) => {
        if (result.isConfirmed) {
            carrito = [];
            actualizarYGuardar();
            renderizarListaCarrito();
            avisoMayoristaMostrado = false;
            
            const Toast = Swal.mixin({
                toast: true,
                position: 'bottom-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });
            Toast.fire({
                icon: 'success',
                title: 'Bolsa vaciada'
            });
        }
    });
};

function actualizarYGuardar() {
    localStorage.setItem('myBellaCarrito', JSON.stringify(carrito));
    actualizarContadorUI();
}

function actualizarContadorUI() {
    const contador = document.getElementById('cart-count');
    if (!contador) return;
    const totalUnidades = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    contador.innerText = totalUnidades;
    contador.style.display = totalUnidades === 0 ? 'none' : 'flex';
    
    // El contador cambia a verde si ya es mayorista
    const { esMayorista } = calcularTotalCarrito();
    contador.style.backgroundColor = esMayorista ? "#28a745" : "#8c002c";
}

function enviarPedidoWhatsApp() {
    if (carrito.length === 0) {
        Swal.fire("Carrito vacío", "Agrega algunos productos antes de enviar.", "warning");
        return;
    }

    const { total, esMayorista } = calcularTotalCarrito();
    const unidadesTotales = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    const cumpleCriterioGral = unidadesTotales >= 3;

    let mensaje = "¡Hola! My Bella Afrodita, quiero realizar este pedido:\n\n";

    carrito.forEach((item, index) => {
        const p = PRODUCTOS.find(prod => prod.id === item.id);
        let precioAplicado;
        let etiqueta = "";

        if (p) {
            if (cumpleCriterioGral && p.precioMayorista && p.precioMayorista > 0) {
                precioAplicado = p.precioMayorista;
                etiqueta = " (Mayorista)";
            } else {
                precioAplicado = p.precioMinorista || p.precio;
            }
        } else {
            precioAplicado = item.precio;
        }

        const subtotalItem = precioAplicado * item.cantidad;
        mensaje += `${index + 1}. *${item.nombre}*\n`;
        mensaje += `   Cant: ${item.cantidad} x $${precioAplicado.toLocaleString('es-AR')}${etiqueta}\n`;
        mensaje += `   Subtotal: $${subtotalItem.toLocaleString('es-AR')}\n\n`;
    });

    mensaje += `--------------------------\n`;
    mensaje += `*TOTAL ESTIMADO: $${total.toLocaleString('es-AR')}*\n`;
    
    if (esMayorista) {
        mensaje += `_Beneficio mayorista aplicado en productos seleccionados._\n`;
    }
    
    mensaje += `--------------------------\n\n*Datos del cliente:*`;
    mensaje += `\nNombre: ________________`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
}

window.mostrarDetalleProducto = function (id) {
    const p = PRODUCTOS.find(prod => prod.id === id);
    if (!p || p.stock === false) return;

    // 1. Generar los items del carrusel (fotos)
    let slides = p.imagenes.map((img, idx) => `
        <div class="carousel-item ${idx === 0 ? 'active' : ''}">
            <img src="${img}" class="d-block w-100" style="height: 600px; object-fit: cover;">
        </div>`).join('');

    // 2. Generar controles e indicadores SOLO si hay más de una foto
    let controls = "";
    let indicators = "";
    
    if (p.imagenes.length > 1) {
        indicators = `
            <div class="carousel-indicators">
                ${p.imagenes.map((_, idx) => `
                    <button type="button" data-bs-target="#carouselDetalle" data-bs-slide-to="${idx}" 
                            class="${idx === 0 ? 'active' : ''}" aria-current="${idx === 0 ? 'true' : ''}" 
                            style="background-color: var(--brand-primary); width: 12px; height: 12px; border-radius: 50%;">
                    </button>
                `).join('')}
            </div>`;

        controls = `
            <button class="carousel-control-prev" type="button" data-bs-target="#carouselDetalle" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true" style="filter: invert(1) brightness(0.5);"></span>
                <span class="visually-hidden">Anterior</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#carouselDetalle" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true" style="filter: invert(1) brightness(0.5);"></span>
                <span class="visually-hidden">Siguiente</span>
            </button>`;
    }

    const modalHtml = `
        <div class="modal fade" id="modalDetalle" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg" style="border-radius: 15px; overflow: hidden; background-color: var(--brand-bg);">
                    <div class="modal-body p-0">
                        <button type="button" class="btn-close position-absolute top-0 end-0 m-4 z-3" data-bs-dismiss="modal" aria-label="Close"></button>
                        <div class="row g-0">
                            <div class="col-md-7">
                                <div id="carouselDetalle" class="carousel slide" data-bs-ride="carousel">
                                    ${indicators}
                                    <div class="carousel-inner">${slides}</div>
                                    ${controls}
                                </div>
                            </div>
                            <div class="col-md-5 p-4 p-lg-5 d-flex flex-column justify-content-center bg-white">
                                <h2 class="display-6 fw-bold mb-3" style="font-family: 'Playfair Display', serif; color: var(--brand-primary);">${p.nombre}</h2>
                                <h4 class="mb-4 text-dark">$${p.precioMinorista.toLocaleString('es-AR')}</h4>
                                <div class="mb-5">
                                    <h6 class="text-uppercase fw-bold small mb-2" style="letter-spacing: 1px; color: var(--brand-accent);">Descripción</h6>
                                    <p class="text-muted" style="line-height: 1.6;">${p.descripcion}</p>
                                </div>
                                <button class="btn py-3 fw-bold text-uppercase" 
                                        onclick="agregarAlCarrito(null, '${p.id}'); bootstrap.Modal.getInstance(document.getElementById('modalDetalle')).hide();"
                                        style="background-color: var(--brand-primary); color: white; border-radius: 0; letter-spacing: 2px; transition: var(--transition-smooth);">
                                    <i class="fas fa-shopping-bag me-2"></i> Añadir a la Bolsa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    const oldModal = document.getElementById('modalDetalle');
    if (oldModal) oldModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    new bootstrap.Modal(document.getElementById('modalDetalle')).show();
};

function mostrarNotificacion(nombre) {
    const toastHtml = `
        <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 2000">
            <div class="toast show text-white border-0" role="alert" style="background-color: var(--brand-primary); border-radius: 0;">
                <div class="d-flex p-3">
                    <div class="toast-body small">✨ <strong>${nombre}</strong> en la bolsa.</div>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', toastHtml);
    setTimeout(() => { document.querySelector('.toast-container')?.remove(); }, 3000);
}