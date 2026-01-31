const WHATSAPP_NUMBER = '5492646121771';
let carrito = JSON.parse(localStorage.getItem('myBellaCarrito')) || [];

// --- CONFIGURACIÓN DE PROMOCIONES DINÁMICAS ---
const REGLAS_PROMO = [
    {
        nombre: "Promo Bombachas (2 x $4.500)",
        cantidad: 2,
        precioCombo: 4500,
        // Filtra bombachas de 2500, PERO excluye el ID del boxer con faja
        filtro: (p) => p.categoria.toLowerCase() === "bombachas" && 
                       p.precio === 2500 && 
                       p.id !== "prod-b9" 
    },
    {
        nombre: "Promo 2 Bombacha Juvenil",
        cantidad: 2,
        precioCombo: 3000,
        filtro: (p) => p.id === "prod-b10" && p.precio === 1700
    },
   /* {
        nombre: "Promo 2 Conjuntos",
        cantidad: 2,
        precioCombo: 18000,
        filtro: (p) => p.categoria.toLowerCase() === "conjuntos" && p.precio === 10000
    }*/
];

document.addEventListener('DOMContentLoaded', () => {
    actualizarContadorUI();

    if (typeof PRODUCTOS === 'undefined') return;

    const contenedor = document.getElementById("contenedor-productos");
    if (contenedor) {
        const titulo = document.title.toLowerCase();
        let categoriaBuscada = titulo.includes("conjuntos") ? "conjuntos" : "bombachas";
        const filtrados = PRODUCTOS.filter(p => p.categoria.toLowerCase() === categoriaBuscada);
        dibujarProductos(filtrados);
    }

    const modalCarrito = document.getElementById('cartModal');
    if (modalCarrito) {
        modalCarrito.addEventListener('show.bs.modal', renderizarListaCarrito);
    }
});

// --- FUNCIÓN MAESTRA: CÁLCULO DE TOTAL CON PROMOS ---
function calcularTotalCarrito() {
    let totalGeneral = 0;
    let itemsParaProcesar = [];
    let desglosePromos = [];

    // 1. Creamos la lista para procesar
    carrito.forEach(item => {
        // Intentamos buscar en la base de datos de PRODUCTOS
        const prodData = (typeof PRODUCTOS !== 'undefined') ? PRODUCTOS.find(p => p.id === item.id) : null;
        
        for (let i = 0; i < item.cantidad; i++) {
            if (prodData) {
                // Si existe en la base de datos (Conjuntos/Bombachas), usamos esa info para las promos
                itemsParaProcesar.push({ ...prodData });
            } else {
                // SI NO EXISTE (Boxers/Medias), usamos la info que guardamos directamente en el carrito
                itemsParaProcesar.push({ 
                    id: item.id, 
                    precio: item.precio, 
                    categoria: "essentials" // Categoría genérica para que no rompa los filtros de promo
                });
            }
        }
    });

    // 2. Aplicamos reglas de promo (esto se mantiene igual)
    REGLAS_PROMO.forEach(regla => {
        let aptos = itemsParaProcesar.filter(p => p.categoria !== "essentials" && regla.filtro(p));
        const numCombos = Math.floor(aptos.length / regla.cantidad);
        
        if (numCombos > 0) {
            totalGeneral += numCombos * regla.precioCombo;
            desglosePromos.push(`${numCombos}x ${regla.nombre}`);
            let unidadesAEliminar = numCombos * regla.cantidad;
            let eliminados = 0;
            itemsParaProcesar = itemsParaProcesar.filter(p => {
                if (p.categoria !== "essentials" && regla.filtro(p) && eliminados < unidadesAEliminar) {
                    eliminados++;
                    return false;
                }
                return true;
            });
        }
    });

    // 3. Sumamos lo que quedó (incluyendo Boxers y Medias que quedaron como 'essentials')
    itemsParaProcesar.forEach(p => {
        totalGeneral += p.precio;
    });

    return { total: totalGeneral, promos: desglosePromos };
}

// --- DIBUJAR PRODUCTOS (Catálogo) ---
function dibujarProductos(lista) {
    const contenedor = document.getElementById("contenedor-productos");
    if (!contenedor) return;
    contenedor.innerHTML = "";

    lista.forEach(p => {
        const infoPromoHtml = p.infoPromo ?
            `<div class="mt-2 py-2 px-3 rounded-4" style="background-color: #fff5f5; border: 1px dashed #ff4d4d;">
                <span class="text-danger fw-bold small"><i class="fas fa-tag me-1"></i> ${p.infoPromo}</span>
             </div>` : '';

        contenedor.innerHTML += `
            <div class="col d-flex">
                <div class="card border-0 rounded-5 shadow-sm overflow-hidden product-card" 
                     style="background: #ffffff;">
                    
                    <div class="card-img-container position-relative" 
                         style="cursor: pointer;" 
                         onclick="mostrarDetalleProducto('${p.id}')">
                        
                        <img src="${p.imagenes[0]}" 
                             class="card-img-top" 
                             style="transition: transform 0.8s ease;"
                             onmouseover="this.style.transform='scale(1.08)'"
                             onmouseout="this.style.transform='scale(1)'"
                             alt="${p.nombre}">
                        
                        ${p.esPromo ? `
                            <div class="position-absolute top-0 start-0 m-3">
                                <span class="badge rounded-pill bg-danger px-3 py-2 shadow-sm fw-bold text-uppercase" 
                                      style="font-size: 0.7rem; letter-spacing: 1px;">
                                    <i class="fas fa-fire me-1"></i> ${p.promoTexto}
                                </span>
                            </div>` : ''}
                    </div>

                    <div class="card-body p-4 d-flex flex-column text-center">
                        <div class="mb-3">
                            <h5 class="fw-bold text-dark mb-2" 
                                style="font-size: 1.15rem; font-family: 'Playfair Display', serif; min-height: 3rem; display: flex; align-items: center; justify-content: center;">
                                ${p.nombre}
                            </h5>
                            <p class="text-muted mb-0 small" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.5rem;">
                                ${p.descripcion}
                            </p>
                        </div>
                        
                        <div class="mt-auto pt-3 border-top border-light">
                            <div class="mb-1">
                                <span class="text-danger fw-bolder fs-3" style="letter-spacing: -1px;">
                                    $${p.precio.toLocaleString('es-AR')}
                                </span>
                            </div>
                            
                            ${infoPromoHtml} 
                            
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

    const resultadoCalculo = calcularTotalCarrito();

    let cartHtml = `
        <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
            <span class="fw-bold text-uppercase small text-muted">${carrito.reduce((acc, i) => acc + i.cantidad, 0)} Unidades</span>
            <button class="btn btn-link text-danger text-decoration-none p-0 small fw-bold" onclick="confirmarVaciarCarrito()">
                VACIAR CARRITO
            </button>
        </div>
    `;

    carrito.forEach((item, index) => {
        // CORRECCIÓN FOTO:
        const prodOriginal = PRODUCTOS.find(p => p.id === item.id);
        const imagenUrl = prodOriginal ? prodOriginal.imagenes[0] : (item.imagen || ""); 
        
        cartHtml += `
            <div class="row align-items-center mb-4 g-2">
                <div class="col-3 col-md-2">
                    <img src="${imagenUrl}" class="img-fluid rounded-3 shadow-sm" style="height: 70px; width: 70px; object-fit: cover;">
                </div>
                <div class="col-5 col-md-6 px-3">
                    <p class="mb-0 fw-bold text-dark small">${item.nombre}</p>
                    <span class="text-muted small">$${item.precio.toLocaleString('es-AR')} c/u</span>
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
                    <span class="text-muted small">Subtotal: $${(item.precio * item.cantidad).toLocaleString('es-AR')}</span>
                </div>
            </div>`;
    });

    container.innerHTML = cartHtml;

    if (totalElement) {
        totalElement.innerHTML = `
            <div class="text-end">
                ${resultadoCalculo.promos.map(p => `<div class="text-success small fw-bold" style="font-size: 0.8rem;">✨ ${p} aplicada</div>`).join('')}
                <div class="mt-1">$${resultadoCalculo.total.toLocaleString('es-AR')}</div>
            </div>
        `;
    }
}

// --- LOGICA DE CARRITO Y PERSISTENCIA ---
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
            precio: p.precio, 
            imagen: p.imagenes[0], // <--- IMPORTANTE: Guardamos la imagen aquí también
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
    if (contador) {
        const total = carrito.reduce((acc, item) => acc + item.cantidad, 0);
        contador.innerText = total;
        contador.style.display = total === 0 ? 'none' : 'flex';
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

    const resultado = calcularTotalCarrito();
    
    // Encabezado elegante
    let mensaje = "🌸 *NUEVO PEDIDO - MY BELLA AFRODITA* 🌸\n";
    mensaje += "------------------------------------------\n\n";

    mensaje += "Hola! Me gustaría consultar disponibilidad de los siguientes productos:\n\n";

    // Listado de productos detallado
    mensaje += "*DETALLE DEL PEDIDO:*\n";
    carrito.forEach(item => {
        mensaje += `📍 *${item.nombre}*\n`;
        mensaje += `   - Cantidad: ${item.cantidad}\n`;
        mensaje += `   - Precio unit: $${item.precio.toLocaleString('es-AR')}\n`;
        mensaje += `   - _Solicito talle y colores disponibles_\n\n`;
    });

    // Sección de Promociones (Si existen)
    if (resultado.promos.length > 0) {
        mensaje += "✨ *PROMOS APLICADAS:* \n";
        resultado.promos.forEach(p => {
            mensaje += `   ✅ ${p}\n`;
        });
        mensaje += "\n";
    }

    // Cierre con el Total
    mensaje += "------------------------------------------\n";
    mensaje += `💰 *TOTAL ESTIMADO: $${resultado.total.toLocaleString('es-AR')}*\n`;
    mensaje += "------------------------------------------\n\n";
    
    mensaje += "💬 *CONSULTA EXTRA:* ¿Qué colores tenés en stock para estos modelos? ¿Hacen envíos?\n\n";
    mensaje += "_Quedo a la espera de tu respuesta para coordinar el pago. Gracias!_";

    // Abrir WhatsApp
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
                                    <span class="h3 fw-bold text-danger">$${p.precio.toLocaleString('es-AR')}</span>
                                    ${p.infoPromo ? `
                                        <div class="mt-3 p-3 rounded-4" style="background-color: #fff5f5; border: 1px dashed #ff4d4d;">
                                            <span class="fw-bold text-uppercase small text-danger">¡Oferta!</span>
                                            <div class="text-dark fw-bolder fs-5 mt-1">${p.infoPromo}</div>
                                        </div>
                                    ` : ''}
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

// Reemplaza TODO el bloque que me mandaste por este:

window.agregarAlCarritoDirecto = function(id, nombre, precio, imagen) {
    const itemExistente = carrito.find(item => item.id === id);

    if (itemExistente) {
        itemExistente.cantidad++;
    } else {
        carrito.push({
            id: id,
            nombre: nombre,
            precio: precio,
            imagen: imagen, // <--- Guardamos la ruta de la imagen aquí
            cantidad: 1
        });
    }

    actualizarYGuardar(); 
    mostrarNotificacion(nombre);
    
    // Abrir el modal del carrito
    const cartModalElement = document.getElementById('cartModal');
    if (cartModalElement) {
        const cartModal = bootstrap.Modal.getOrCreateInstance(cartModalElement);
        cartModal.show();
    }
};