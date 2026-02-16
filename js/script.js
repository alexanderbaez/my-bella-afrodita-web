/* ==========================================================================
   LÓGICA DE NEGOCIO OPTIMIZADA - MY BELLA AFRODITA (BOUTIQUE STYLE)
   ========================================================================== */

const WHATSAPP_NUMBER = '5492646121771';
let carrito = JSON.parse(localStorage.getItem('myBellaCarrito')) || [];
let avisoMayoristaMostrado = false;

document.addEventListener('DOMContentLoaded', () => {
    // Aplicar el fondo del :root al body (Sincronizado con tu paleta)
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
                <div class="mb-3" style="font-size: 3rem; opacity: 0.3;">
                    <i class="fas fa-shopping-bag"></i>
                </div>
                <h5 class="text-muted fw-light">Tu bolsa está vacía</h5>
                <button class="btn btn-outline-dark btn-sm mt-3 rounded-pill px-4 text-uppercase" 
                        data-bs-dismiss="modal" style="letter-spacing: 1px; font-size: 0.7rem;">
                    Explorar Colección
                </button>
            </div>`;
        if (totalElement) totalElement.innerHTML = '<div class="text-end fw-bold h4">$0</div>';
        return;
    }

    const res = calcularTotalCarrito();
    const unidadesTotales = carrito.reduce((acc, i) => acc + i.cantidad, 0);

    let cartHtml = `
        <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
            <span class="fw-bold text-uppercase" style="font-size: 0.75rem; letter-spacing: 1px; color: var(--brand-accent);">
                ${unidadesTotales} ${unidadesTotales === 1 ? 'Producto' : 'Productos'}
            </span>
            <button class="btn btn-link text-muted text-decoration-none p-0" 
                    onclick="confirmarVaciarCarrito()" style="font-size: 0.7rem; letter-spacing: 1px;">
                <i class="fas fa-trash-alt me-1"></i> VACIAR TODO
            </button>
        </div>
    `;

    carrito.forEach((item, index) => {
        const p = PRODUCTOS.find(prod => prod.id === item.id);
        let precioAplicado = (unidadesTotales >= 3 && p?.precioMayorista) ? p.precioMayorista : (p?.precioMinorista || item.precio);
        
        cartHtml += `
            <div class="row align-items-center mb-3 g-2">
                <div class="col-3">
                    <img src="${item.imagen}" class="img-fluid" 
                         style="height: 65px; width: 100%; object-fit: cover; border-radius: 8px;">
                </div>
                
                <div class="col-5 ps-2">
                    <p class="mb-0 fw-bold text-dark" style="font-size: 0.85rem; line-height: 1.2;">${item.nombre}</p>
                    <span class="text-muted" style="font-size: 0.75rem;">$${precioAplicado.toLocaleString('es-AR')} c/u</span>
                    <div class="mt-1">
                        <button class="btn btn-sm text-danger p-0 border-0 bg-transparent" 
                                style="font-size: 0.7rem; font-weight: 500;" 
                                onclick="eliminarDelCarrito(${index})">
                            Eliminar
                        </button>
                    </div>
                </div>
                
                <div class="col-4 text-end">
                    <div class="d-flex align-items-center justify-content-end mb-1">
                        <div class="d-flex align-items-center bg-white border rounded-pill px-1" style="border-color: #eee !important;">
                            <button class="btn btn-sm p-0 flex-shrink-0" 
                                    style="width:22px; height:22px; font-size: 0.8rem;" 
                                    onclick="cambiarCantidad(${index}, -1)">-</button>
                            <span class="px-2 fw-bold text-dark" style="font-size: 0.8rem; min-width: 25px; text-align: center;">${item.cantidad}</span>
                            <button class="btn btn-sm p-0 flex-shrink-0" 
                                    style="width:22px; height:22px; font-size: 0.8rem;" 
                                    onclick="cambiarCantidad(${index}, 1)">+</button>
                        </div>
                    </div>
                    <div class="fw-bold text-dark" style="font-size: 0.9rem;">
                        $${(precioAplicado * item.cantidad).toLocaleString('es-AR')}
                    </div>
                </div>
            </div>`;
    });

    cartHtml += `
        <div class="text-center mt-3 border-top pt-2">
            <button class="btn btn-link btn-sm text-muted text-decoration-none text-uppercase" 
                    data-bs-dismiss="modal" style="letter-spacing: 1px; font-size: 0.65rem;">
                + Seguir Comprando
            </button>
        </div>
    `;

    container.innerHTML = cartHtml;

    if (totalElement) {
        totalElement.innerHTML = `
            <div class="text-end w-100">
                ${res.promos.map(p => `
                    <div class="text-success fw-bold mb-1" style="font-size: 0.75rem;">
                        <i class="fas fa-check-circle me-1"></i> ${p}
                    </div>`).join('')}
                
                ${!res.esMayorista ? `
                    <div class="p-2 mb-2" style="background-color: var(--brand-nude); border-radius: 6px; font-size: 0.7rem;">
                        🎁 Agregá <strong style="color: var(--brand-primary);">${3 - unidadesTotales}</strong> más para <b>Precio Mayorista</b>
                    </div>` : ''}
                
                <div class="d-flex justify-content-between align-items-center mt-2">
                    <span class="text-muted text-uppercase" style="font-size: 0.8rem; letter-spacing: 1px;">Total a pagar</span>
                    <span class="fw-bold" style="font-size: 1.6rem; color: var(--brand-primary);">$${res.total.toLocaleString('es-AR')}</span>
                </div>
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
    verificarHitoMayorista();
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
        confirmButtonColor: 'var(--brand-primary)',
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
            Toast.fire({ icon: 'success', title: 'Bolsa vaciada' });
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
    const { esMayorista } = calcularTotalCarrito();
    contador.style.backgroundColor = esMayorista ? "#28a745" : "var(--brand-primary)";
}

function enviarPedidoWhatsApp() {
    if (carrito.length === 0) {
        Swal.fire("Carrito vacío", "Agrega algunos productos antes de enviar.", "warning");
        return;
    }

    const { total, esMayorista } = calcularTotalCarrito();
    const unidadesTotales = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    const cumpleCriterioGral = unidadesTotales >= 3;

    let mensaje = "✨ *PEDIDO: MY BELLA AFRODITA* ✨\n";
    mensaje += "------------------------------------------\n\n";

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

        mensaje += `🛍️ *${item.nombre}*\n`;
        mensaje += `   Cant: ${item.cantidad} x $${precioAplicado.toLocaleString('es-AR')}${etiqueta}\n`;
        mensaje += `   Subtotal: $${(precioAplicado * item.cantidad).toLocaleString('es-AR')}\n\n`;
    });

    mensaje += `------------------------------------------\n`;
    mensaje += `💰 *TOTAL ESTIMADO: $${total.toLocaleString('es-AR')}*\n`;
    if (esMayorista) mensaje += `✅ _Beneficio mayorista aplicado_\n`;
    mensaje += `\n👤 *Datos del cliente:*`;
    mensaje += `\nNombre: ________________`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
}

/* ==========================================================================
   DETALLE DEL PRODUCTO - RESPONSIVE & LIGHTBOX (BOUTIQUE STYLE)
   ========================================================================== */

window.mostrarDetalleProducto = function (id) {
    const p = PRODUCTOS.find(prod => prod.id === id);
    if (!p || p.stock === false) return;

    // 1. Generar slides del carrusel con evento para abrir imagen en grande
    let slides = p.imagenes.map((img, idx) => `
        <div class="carousel-item ${idx === 0 ? 'active' : ''}">
            <img src="${img}" class="d-block w-100" 
                 style="height: 40vh; min-height: 250px; max-height: 400px; object-fit: cover; cursor: pointer;"
                 onclick="abrirImagenGrande('${img}')">
        </div>`).join('');

    // 2. Controles de navegación
    let controls = "";
    let indicators = "";
    if (p.imagenes.length > 1) {
        indicators = `
            <div class="carousel-indicators" style="margin-bottom: 0.2rem;">
                ${p.imagenes.map((_, idx) => `
                    <button type="button" data-bs-target="#carouselDetalle" data-bs-slide-to="${idx}" 
                            class="${idx === 0 ? 'active' : ''}" 
                            style="background-color: var(--brand-primary); width: 7px; height: 7px; border-radius: 50%; border: none;">
                    </button>
                `).join('')}
            </div>`;

        controls = `
            <button class="carousel-control-prev" type="button" data-bs-target="#carouselDetalle" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true" style="filter: invert(1) brightness(0.5); transform: scale(0.7);"></span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#carouselDetalle" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true" style="filter: invert(1) brightness(0.5); transform: scale(0.7);"></span>
            </button>`;
    }

    // 3. Bloque de Precios (Más compacto)
    let htmlPreciosDetalle = p.precioMayorista ? `
        <div class="price-container mb-3 p-2" style="background-color: var(--brand-nude); border-radius: 8px;">
            <div class="row text-center g-0">
                <div class="col-6 border-end" style="border-color: rgba(0,0,0,0.1) !important;">
                    <small class="text-muted text-uppercase d-block" style="font-size: 0.6rem; letter-spacing: 1px;">Minorista</small>
                    <span class="fw-bold text-dark h5 mb-0">$${p.precioMinorista.toLocaleString('es-AR')}</span>
                </div>
                <div class="col-6">
                    <small class="text-uppercase d-block fw-bold" style="font-size: 0.6rem; letter-spacing: 1px; color: var(--brand-accent);">Mayorista (3+)</small>
                    <span class="fw-bold h5 mb-0" style="color: var(--brand-primary);">$${p.precioMayorista.toLocaleString('es-AR')}</span>
                </div>
            </div>
        </div>` : `
        <div class="mb-3">
            <h4 class="fw-bold text-dark mb-0">$${p.precioMinorista.toLocaleString('es-AR')}</h4>
        </div>`;

    // 4. Construcción del Modal (Más compacto y con Lightbox)
    const modalHtml = `
        <div class="modal fade" id="modalDetalle" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-md modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content border-0 shadow-lg" style="border-radius: 15px; overflow: hidden; background-color: #fff;">
                    <div class="modal-body p-0 position-relative">
                        <button type="button" class="btn-close position-absolute top-0 end-0 m-2 z-3 bg-white p-2 shadow-sm rounded-circle" 
                                data-bs-dismiss="modal" style="font-size: 0.7rem;"></button>
                        
                        <div class="row g-0">
                            <div class="col-12">
                                <div id="carouselDetalle" class="carousel slide" data-bs-ride="carousel">
                                    ${indicators}
                                    <div class="carousel-inner">${slides}</div>
                                    ${controls}
                                </div>
                            </div>
                            
                            <div class="col-12 p-3">
                                <h2 class="h5 fw-bold mb-1" style="font-family: 'Playfair Display', serif; color: var(--brand-primary);">${p.nombre}</h2>
                                
                                ${htmlPreciosDetalle}

                                <div class="mb-3">
                                    <h6 class="text-uppercase fw-bold mb-1" style="font-size: 0.7rem; letter-spacing: 1px; color: var(--brand-accent);">Descripción</h6>
                                    <p class="text-muted mb-0" style="font-size: 0.85rem; line-height: 1.4;">${p.descripcion}</p>
                                </div>
                                
                                <button class="btn btn-dark py-2 fw-bold text-uppercase w-100" 
                                        onclick="agregarAlCarrito(null, '${p.id}'); bootstrap.Modal.getInstance(document.getElementById('modalDetalle')).hide();"
                                        style="background-color: var(--brand-primary); border: none; border-radius: 8px; letter-spacing: 1px; font-size: 0.8rem;">
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

// --- FUNCIÓN LIGHTBOX PARA ZOOM ---
window.abrirImagenGrande = function(url) {
    Swal.fire({
        imageUrl: url,
        imageAlt: 'Imagen del producto',
        showCloseButton: true,
        showConfirmButton: false,
        background: 'transparent',
        width: 'auto',
        padding: '0',
        backdrop: 'rgba(0,0,0,0.8)'
    });
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