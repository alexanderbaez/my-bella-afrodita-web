const WHATSAPP_NUMBER = '5492646121771';
let carrito = JSON.parse(localStorage.getItem('myBellaCarrito')) || [];

document.addEventListener('DOMContentLoaded', () => {
    actualizarContadorUI();

    if (typeof PRODUCTOS === 'undefined') return;

const contenedor = document.getElementById("contenedor-productos");
    if (contenedor) {
        const titulo = document.title.toLowerCase();
        
        // --- MEJORA AQUÍ: Detección multicanal ---
        let categoriaBuscada = "";
        
        if (titulo.includes("conjuntos")) {
            categoriaBuscada = "conjuntos";
        } else if (titulo.includes("bombachas")) {
            categoriaBuscada = "bombachas";
        } else if (titulo.includes("hombres") || titulo.includes("essentials")) {
            categoriaBuscada = "hombres"; // Esta debe coincidir con la de productos.js
        }
        
        const filtrados = PRODUCTOS.filter(p => p.categoria.toLowerCase() === categoriaBuscada);
        dibujarProductos(filtrados);
    }

    const modalCarrito = document.getElementById('cartModal');
    if (modalCarrito) {
        modalCarrito.addEventListener('show.bs.modal', renderizarListaCarrito);
    }
});

// --- NUEVA LÓGICA DE NEGOCIO: MAYORISTA X 3 UNIDADES ---
function calcularTotalCarrito() {
    let totalGeneral = 0;
    let unidadesTotales = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    let esMayorista = unidadesTotales >= 3;
    let detallesPromo = [];

    if (esMayorista) {
        detallesPromo.push("Precio Mayorista Aplicado (3+ unidades)");
    }

    carrito.forEach(item => {
        // Buscamos el producto en nuestra base de datos para tener los precios actualizados
        const p = PRODUCTOS.find(prod => prod.id === item.id);
        
        if (p) {
            // Si llegamos a 3 unidades Y el producto tiene precio mayorista definido
            if (esMayorista && p.precioMayorista) {
                totalGeneral += p.precioMayorista * item.cantidad;
            } else {
                // De lo contrario, usamos precio minorista
                totalGeneral += p.precioMinorista * item.cantidad;
            }
        } else {
            // Por si es un producto "extra" que no está en el JS principal
            totalGeneral += item.precio * item.cantidad;
        }
    });

    return { total: totalGeneral, promos: detallesPromo, esMayorista: esMayorista };
}

// --- DIBUJAR PRODUCTOS (Catálogo) ---
function dibujarProductos(lista) {
    const contenedor = document.getElementById("contenedor-productos");
    if (!contenedor) return;
    contenedor.innerHTML = "";

    lista.forEach(p => {
        const htmlPrecios = p.precioMayorista 
            ? `<div class="mb-2 p-2 rounded-4" style="border: 1px solid #f0f0f0; background-color: #fffafa;">
                <div class="mb-2">
                    <span class="text-muted small text-uppercase fw-bold" style="font-size: 0.6rem; letter-spacing: 1px;">Precio Individual</span>
                    <br>
                    <span class="text-dark fw-bold fs-4">$${p.precioMinorista.toLocaleString('es-AR')}</span>
                </div>
                <div class="pt-2 border-top" style="border-top-style: dashed !important; border-top-color: #ffc1c1 !important;">
                    <span class="text-danger small text-uppercase fw-bold" style="font-size: 0.6rem; letter-spacing: 1px;">⚡ Mayorista (Combinando 3+ prendas)</span>
                    <br>
                    <span class="text-danger fw-bolder fs-3">$${p.precioMayorista.toLocaleString('es-AR')}</span>
                </div>
               </div>`
            : `<div class="mb-2 py-3">
                <span class="text-muted small text-uppercase fw-bold" style="font-size: 0.6rem; letter-spacing: 1px;">Precio Único</span>
                <br>
                <span class="text-dark fw-bolder fs-3">$${p.precioMinorista.toLocaleString('es-AR')}</span>
               </div>`;

        contenedor.innerHTML += `
            <div class="col d-flex">
                <div class="card border-0 rounded-5 shadow-sm overflow-hidden product-card" style="background: #ffffff;">
                    <div class="card-img-container position-relative" style="cursor: pointer;" onclick="mostrarDetalleProducto('${p.id}')">
                        <img src="${p.imagenes[0]}" class="card-img-top" style="transition: transform 0.8s ease;"
                             onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'" alt="${p.nombre}">
                    </div>

                    <div class="card-body p-4 d-flex flex-column text-center">
                        <div class="mb-3">
                            <h5 class="fw-bold text-dark mb-2" style="font-family: 'Playfair Display', serif; min-height: 3rem; display: flex; align-items: center; justify-content: center;">
                                ${p.nombre}
                            </h5>
                            <p class="text-muted mb-0 small" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.5rem;">
                                ${p.descripcion}
                            </p>
                        </div>
                        
                        <div class="mt-auto pt-3 border-top border-light">
                            ${htmlPrecios}
                            <button class="btn btn-dark w-100 rounded-pill py-2 fw-bold shadow-sm mt-3" 
                                    onclick="event.stopPropagation(); agregarAlCarrito(event, '${p.id}')">
                                <span class="small text-uppercase" style="letter-spacing: 1.5px;">Agregar al carrito</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    });
}

// --- RENDERIZADO DEL CARRITO ---
window.renderizarListaCarrito = function() {
    const container = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    if (!container) return;

    if (carrito.length === 0) {
        container.innerHTML = `<div class="text-center py-5"><h5 class="text-muted">Tu carrito está vacío</h5></div>`;
        if (totalElement) totalElement.innerText = '$0';
        return;
    }

    const res = calcularTotalCarrito();

    let cartHtml = `
        <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
            <span class="fw-bold text-uppercase small text-muted">${carrito.reduce((acc, i) => acc + i.cantidad, 0)} Unidades</span>
            <button class="btn btn-link text-danger text-decoration-none p-0 small fw-bold" onclick="confirmarVaciarCarrito()">
                VACIAR CARRITO
            </button>
        </div>
    `;

    carrito.forEach((item, index) => {
        const p = PRODUCTOS.find(prod => prod.id === item.id);
        // Determinamos qué precio mostrar en el carrito según la cantidad total
        let precioAplicado = (res.esMayorista && p?.precioMayorista) ? p.precioMayorista : (p?.precioMinorista || item.precio);
        
        cartHtml += `
            <div class="row align-items-center mb-4 g-2">
                <div class="col-3 col-md-2">
                    <img src="${item.imagen}" class="img-fluid rounded-3 shadow-sm" style="height: 70px; width: 70px; object-fit: cover;">
                </div>
                <div class="col-5 col-md-6 px-3">
                    <p class="mb-0 fw-bold text-dark small">${item.nombre}</p>
                    <span class="text-muted small">$${precioAplicado.toLocaleString('es-AR')} ${res.esMayorista && p?.precioMayorista ? '(Mayorista)' : ''}</span>
                    <div class="mt-1">
                        <button class="btn btn-sm text-danger p-0 border-0 bg-transparent" style="font-size: 0.75rem;" onclick="eliminarDelCarrito(${index})">
                            <i class="fas fa-trash-alt me-1"></i> Quitar
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
                    <span class="text-muted small">Subtotal: $${(precioAplicado * item.cantidad).toLocaleString('es-AR')}</span>
                </div>
            </div>`;
    });

    container.innerHTML = cartHtml;

    if (totalElement) {
        totalElement.innerHTML = `
            <div class="text-end">
                ${res.promos.map(p => `<div class="text-success small fw-bold" style="font-size: 0.8rem;">✨ ${p}</div>`).join('')}
                ${!res.esMayorista ? `<div class="text-muted small" style="font-size: 0.7rem;">Agregá ${3 - carrito.reduce((acc, i) => acc + i.cantidad, 0)} más para precio mayorista</div>` : ''}
                <div class="mt-1">$${res.total.toLocaleString('es-AR')}</div>
            </div>
        `;
    }
}

// --- LOGICA DE CARRITO ---
window.agregarAlCarrito = function (event, id) {
    const p = PRODUCTOS.find(prod => prod.id === id);
    if (!p) return;
    
    const existe = carrito.find(item => item.id === id);
    if (existe) { 
        existe.cantidad++; 
    } else { 
        carrito.push({ 
            id: p.id, 
            nombre: p.nombre, 
            precio: p.precioMinorista, // Guardamos el base, el cálculo se hace en calcularTotalCarrito
            imagen: p.imagenes[0], 
            cantidad: 1 
        }); 
    }
    actualizarYGuardar();
    mostrarNotificacion(p.nombre);
};

window.cambiarCantidad = function (index, valor) {
    if (carrito[index].cantidad + valor > 0) carrito[index].cantidad += valor;
    else carrito.splice(index, 1);
    actualizarYGuardar();
    renderizarListaCarrito();
};

window.eliminarDelCarrito = function (index) {
    carrito.splice(index, 1);
    actualizarYGuardar();
    renderizarListaCarrito();
};

window.confirmarVaciarCarrito = function () {
    const modalConfirmHtml = `
        <div class="modal fade" id="modalConfirmVaciar" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-sm modal-dialog-centered">
                <div class="modal-content rounded-4 border-0 shadow-lg text-center">
                    <div class="modal-body p-4">
                        <div class="text-danger mb-3"><i class="fas fa-shopping-basket fa-3x"></i></div>
                        <h6 class="fw-bold mb-3">¿Querés vaciar el carrito?</h6>
                        <div class="d-grid gap-2">
                            <button class="btn btn-danger rounded-pill fw-bold" onclick="ejecutarVaciar()">Sí, vaciar</button>
                            <button class="btn btn-light rounded-pill fw-bold" data-bs-dismiss="modal">Cancelar</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalConfirmHtml);
    const m = new bootstrap.Modal(document.getElementById('modalConfirmVaciar'));
    m.show();
    document.getElementById('modalConfirmVaciar').addEventListener('hidden.bs.modal', function (e) { e.target.remove(); });
};

window.ejecutarVaciar = function () {
    carrito = [];
    actualizarYGuardar();
    renderizarListaCarrito();
    const inst = bootstrap.Modal.getInstance(document.getElementById('modalConfirmVaciar'));
    if (inst) inst.hide();
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

    // --- LÓGICA DE COLOR Y CARTELITO ---
    // Buscamos si ya existe el badge de "MAYORISTA", si no, lo creamos
    let badgeMayorista = document.getElementById('badge-mayorista');
    
    if (totalUnidades >= 3) {
        // ACTIVADO: Verde y cartelito
        contador.style.backgroundColor = "#28a745"; // Verde éxito
        if (!badgeMayorista) {
            badgeMayorista = document.createElement('span');
            badgeMayorista.id = 'badge-mayorista';
            badgeMayorista.innerHTML = 'MAYORISTA';
            badgeMayorista.style = `
                position: absolute;
                top: -10px;
                right: 35px;
                background: #28a745;
                color: white;
                font-size: 10px;
                font-weight: bold;
                padding: 2px 8px;
                border-radius: 10px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                animation: popIn 0.3s ease-out;
            `;
            contador.parentElement.appendChild(badgeMayorista);
        }
    } else {
        // DESACTIVADO: Volvemos al color original (tu color de diseño) y quitamos cartelito
        contador.style.backgroundColor = "#ff4d4d"; // O el color que prefieras (ej. el de tus 15 años)
        if (badgeMayorista) {
            badgeMayorista.remove();
        }
    }
}

// --- NOTIFICACIONES ---
function mostrarNotificacion(nombre) {
    const existente = document.querySelector('.toast-container');
    if (existente) existente.remove();

    const toastHtml = `
        <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 2000">
            <div id="liveToast" class="toast show align-items-center text-white bg-dark border-0 rounded-4 shadow-lg" role="alert">
                <div class="d-flex p-2">
                    <div class="toast-body d-flex align-items-center">
                        <div class="bg-success rounded-circle me-3 d-flex align-items-center justify-content-center" style="width: 25px; height: 25px;">
                            <i class="fas fa-check fa-xs"></i>
                        </div>
                        <div class="small"><strong class="d-block">${nombre}</strong> Agregado correctamente</div>
                    </div>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', toastHtml);
    setTimeout(() => {
        const t = document.getElementById('liveToast');
        if (t) { t.classList.remove('show'); setTimeout(() => t.parentElement.remove(), 500); }
    }, 2500);
}

// --- FINALIZAR PEDIDO WHATSAPP ---
window.enviarPedidoWhatsApp = function () {
    if (carrito.length === 0) {
        alert("El carrito está vacío");
        return;
    }

    const res = calcularTotalCarrito();
    
    let mensaje = "🌸 *NUEVO PEDIDO - MY BELLA AFRODITA* 🌸\n";
    mensaje += "------------------------------------------\n\n";
    mensaje += "Hola! Me gustaría consultar disponibilidad de los siguientes productos:\n\n";

    mensaje += "*DETALLE DEL PEDIDO:*\n";
    carrito.forEach(item => {
        const p = PRODUCTOS.find(prod => prod.id === item.id);
        let precioUsado = (res.esMayorista && p?.precioMayorista) ? p.precioMayorista : (p?.precioMinorista || item.precio);

        mensaje += `📍 *${item.nombre}*\n`;
        mensaje += `   - Cantidad: ${item.cantidad}\n`;
        mensaje += `   - Precio unit: $${precioUsado.toLocaleString('es-AR')} ${res.esMayorista && p?.precioMayorista ? '(Mayorista)' : '(Minorista)'}\n\n`;
    });

    if (res.esMayorista) {
        mensaje += "✨ *MODO MAYORISTA ACTIVADO* (3+ unidades)\n\n";
    }

    mensaje += "------------------------------------------\n";
    mensaje += `💰 *TOTAL ESTIMADO: $${res.total.toLocaleString('es-AR')}*\n`;
    mensaje += "------------------------------------------\n\n";
    mensaje += "_Quedo a la espera de tu respuesta para coordinar el pago. Gracias!_";

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
};

// --- VISTA DETALLE PRODUCTO ---
window.mostrarDetalleProducto = function (id) {
    const p = PRODUCTOS.find(prod => prod.id === id);
    if (!p) return;

    let slides = p.imagenes.map((img, idx) => `
        <div class="carousel-item ${idx === 0 ? 'active' : ''}">
            <img src="${img}" class="d-block w-100" 
                 style="height: 600px; object-fit: cover; background: #f8f8f8;">
        </div>`).join('');

    const modalHtml = `
        <div class="modal fade" id="modalDetalle" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-centered">
                <div class="modal-content rounded-5 border-0 shadow-lg overflow-hidden">
                    <div class="modal-body p-0">
                        <button type="button" class="btn-close position-absolute top-0 end-0 m-4 z-3 bg-white rounded-circle p-2 shadow-sm" data-bs-dismiss="modal"></button>
                        <div class="row g-0">
                            <div class="col-md-7 bg-light">
                                <div id="carouselDetalle" class="carousel slide carousel-fade" data-bs-ride="carousel">
                                    <div class="carousel-inner shadow-sm">${slides}</div>
                                    ${p.imagenes.length > 1 ? `
                                        <button class="carousel-control-prev" type="button" data-bs-target="#carouselDetalle" data-bs-slide="prev">
                                            <span class="carousel-control-prev-icon bg-dark rounded-circle p-3"></span>
                                        </button>
                                        <button class="carousel-control-next" type="button" data-bs-target="#carouselDetalle" data-bs-slide="next">
                                            <span class="carousel-control-next-icon bg-dark rounded-circle p-3"></span>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                            <div class="col-md-5 p-5 d-flex flex-column bg-white">
                                <nav aria-label="breadcrumb" class="mb-2">
                                    <ol class="breadcrumb mb-0">
                                        <li class="breadcrumb-item small text-uppercase text-muted">${p.categoria}</li>
                                        <li class="breadcrumb-item small text-uppercase active text-danger fw-bold">Detalle</li>
                                    </ol>
                                </nav>
                                <h2 class="fw-bold text-dark mb-3" style="font-family: 'Playfair Display', serif; font-size: 2.2rem;">${p.nombre}</h2>
                                <div class="mb-4">
                                    <span class="h3 fw-bold text-danger">$${p.precioMinorista.toLocaleString('es-AR')}</span>
                                    ${p.precioMayorista ? `<div class="text-success fw-bold small">Precio Mayorista: $${p.precioMayorista.toLocaleString('es-AR')} (llevando 3+)</div>` : ''}
                                </div>
                                <div class="flex-grow-1">
                                    <h6 class="text-uppercase fw-bold small text-dark mb-2">Descripción</h6>
                                    <p class="text-muted lh-lg" style="font-size: 0.95rem;">${p.descripcion}</p>
                                </div>
                                <div class="mt-5">
                                    <button class="btn btn-dark w-100 py-3 rounded-pill fw-bold shadow" 
                                            onclick="agregarAlCarrito(event, '${p.id}'); bootstrap.Modal.getInstance(document.getElementById('modalDetalle')).hide();">
                                        AÑADIR A LA BOLSA
                                    </button>
                                </div>
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