/**
 * Mi Bella Afrodita - Lógica de Página de Detalle de Producto Permalink
 * Permalinks: /producto.html?id={id}
 * Incluye: Galería Vertical, Zoom Óptico, Selector de Talles en Vivo con Stock Urgente,
 * Micro-tarjeta Mayorista, Guía de Medidas y Cross-selling "Completa tu Look".
 */

// Consumo seguro de la constante centralizada o fallback local sin colisión en scope global
const API_PRODUCTOS_ENDPOINT = (typeof window !== 'undefined' && window.API_PRODUCTOS) 
    ? window.API_PRODUCTOS 
    : '/api/productos';

let PRODUCTO_ACTUAL = null;
window.PRODUCTO_ACTUAL = null;
let TALLE_SELECCIONADO = null;
let STOCK_DISPONIBLE_TALLE = 0;
let CANTIDAD_SELECCIONADA = 1;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Obtener ID del producto desde la URL (?id=... o permalink /producto/{id})
    const urlParams = new URLSearchParams(window.location.search);
    let prodId = urlParams.get('id');

    if (!prodId) {
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        const lastSegment = pathSegments[pathSegments.length - 1];
        if (lastSegment && /^\d+$/.test(lastSegment)) {
            prodId = lastSegment;
        }
    }

    if (!prodId) {
        window.location.href = './productos.html';
        return;
    }

    await cargarDetalleProducto(prodId);
    await cargarProductosRelacionados();
});

async function cargarDetalleProducto(id) {
    const contenedor = document.getElementById('producto-detalle-mount');
    if (!contenedor) return;

    try {
        if (!contenedor.querySelector('.skeleton')) {
            contenedor.innerHTML = '<div class="container py-4" aria-hidden="true"><div class="row g-4"><div class="col-12 col-md-6"><div class="skeleton skeleton-card"></div></div><div class="col-12 col-md-6"><div class="skeleton skeleton-line short"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-card" style="aspect-ratio:3/1;margin-top:24px"></div></div></div></div><span class="visually-hidden" role="status">Cargando prenda…</span>';
        }
        const response = await fetch(`${API_PRODUCTOS_ENDPOINT}/${id}`);
        if (!response.ok) {
            throw new Error(`Producto no encontrado (HTTP ${response.status})`);
        }

        PRODUCTO_ACTUAL = await response.json();
        window.PRODUCTO_ACTUAL = PRODUCTO_ACTUAL;
        renderizarPaginaProducto(PRODUCTO_ACTUAL);
        actualizarMetadatosSEO(PRODUCTO_ACTUAL);

    } catch (error) {
        console.error("Error al cargar producto:", error);
        contenedor.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-gem text-muted fa-3x mb-3" style="color: var(--gold-champagne) !important;"></i>
                <h3 class="font-serif text-dark mb-2">Prenda no disponible</h3>
                <p class="text-muted small mb-4">La pieza solicitada no se encuentra disponible en nuestro catálogo activo o el enlace ha expirado.</p>
                <a href="./productos.html?categoria=CONJUNTOS" class="btn btn-dark btn-sm rounded-1 px-4 py-2 text-uppercase fw-semibold" style="letter-spacing: 1.5px; font-size: 0.75rem;">
                    Ver Colección Conjuntos
                </a>
            </div>
        `;
    }
}

function renderizarPaginaProducto(p) {
    const mount = document.getElementById('producto-detalle-mount');
    if (!mount) return;

    // Actualizar Breadcrumbs
    const bcCat = document.getElementById('bc-categoria');
    const bcProd = document.getElementById('bc-producto');
    if (bcCat) {
        const catUpper = (p.categoria || 'conjuntos').toUpperCase();
        bcCat.href = `./productos.html?categoria=${encodeURIComponent(catUpper)}`;
        bcCat.innerText = `COLECCIÓN ${catUpper}`;
    }
    if (bcProd) {
        bcProd.innerText = p.nombre;
    }

    // Normalizar imágenes
    const fotos = Array.isArray(p.imagenes) && p.imagenes.length > 0
        ? p.imagenes.map(normalizarUrl)
        : [IMG_FALLBACK];

    // Variantes y Stock (Sin preselección para obligar a elegir talle con precisión)
    const variantes = Array.isArray(p.variantes) ? p.variantes : [];
    TALLE_SELECCIONADO = null;
    STOCK_DISPONIBLE_TALLE = 0;
    CANTIDAD_SELECCIONADA = 1;

    // Cálculo precios
    const precioMinoristaNum = Number(p.precioMinorista) || 0;
    const precioMayoristaNum = Number(p.precioMayorista) || 0;
    const ahorroPorPrenda = (precioMayoristaNum > 0 && precioMinoristaNum > precioMayoristaNum)
        ? (precioMinoristaNum - precioMayoristaNum)
        : 0;

    // Badges
    const badgeEtiqueta = p.etiqueta ? `<span class="badge-luxury-tag">${p.etiqueta}</span>` : '';
    const badgeStockOut = (p.stock === false || (variantes.length > 0 && variantes.every(v => (v.stock || 0) <= 0)))
        ? `<span class="badge-stock-out"><i class="fas fa-times me-1"></i> Agotado</span>`
        : '';

    // Selector de Talles HTML
    let selectorTallesHtml = '';
    if (variantes.length > 0) {
        selectorTallesHtml = `
            <div class="product-sizes-block">
                <div class="size-row-header">
                    <span class="size-label-text">TALLE</span>
                    <button type="button" class="btn-size-guide" onclick="abrirGuiaMedidas()" aria-label="Ver guía de talles y medidas">
                        <i class="fas fa-ruler-horizontal" style="color: var(--gold-dark);"></i>
                        <span>Guía de talles</span>
                    </button>
                </div>
                <div class="size-chips-wrap" id="detalle-size-chips">
                    ${variantes.map(v => {
                        const agotado = (v.stock || 0) <= 0;
                        const esActivo = TALLE_SELECCIONADO && v.talle === TALLE_SELECCIONADO;
                        return `
                            <button type="button" 
                                    class="btn-size-chip btn-talle-detail ${agotado ? 'disabled-chip out-of-stock' : ''} ${esActivo ? 'selected active' : ''}" 
                                    data-talle="${v.talle}" 
                                    data-stock="${v.stock || 0}"
                                    ${agotado ? 'disabled title="Agotado"' : `title="${v.stock} disponibles"`}
                                    onclick="window.cambiarTalleDetalle('${v.talle}', ${v.stock || 0})">
                                ${v.talle}
                            </button>
                        `;
                    }).join('')}
                </div>
                <div class="size-status-msg" id="indicador-stock-live">
                    <span class="text-hint-talle"><i class="fas fa-info-circle me-1"></i> Seleccioná un talle para continuar</span>
                </div>
            </div>
        `;
    }

    // Bloque Mayorista (Píldora minimalista de lujo)
    let tarjetaMayoristaHtml = '';
    if (precioMayoristaNum > 0) {
        tarjetaMayoristaHtml = `
            <div class="wholesale-incentive-badge">
                <i class="fas fa-crown wholesale-badge-icon"></i>
                <span class="wholesale-text-clean">
                    Mayorista llevando 3+ prendas: <strong>$${precioMayoristaNum.toLocaleString('es-AR')} c/u</strong>
                    ${ahorroPorPrenda > 0 ? `<span class="wholesale-saving-clean">(Ahorrás $${ahorroPorPrenda.toLocaleString('es-AR')} c/u)</span>` : ''}
                </span>
            </div>
        `;
    }

    mount.innerHTML = `
        <div class="product-detail-wrapper">
            <div class="product-detail-grid">
                
                <!-- Columna Izquierda: Galería Editorial -->
                <div class="product-gallery-col">
                    <div class="product-gallery-container product-gallery-layout">
                        <!-- a) Visor Principal Proporción 3:4 Editorial -->
                        <div class="product-main-image-wrap product-main-viewport" id="zoom-viewport" onmousemove="aplicarZoomOptico(event)" onmouseleave="restablecerZoomOptico()">
                            <div class="main-img-badges">
                                ${badgeEtiqueta}
                                ${badgeStockOut}
                            </div>
                            <img src="${fotos[0]}" alt="${p.nombre}" class="product-zoom-img" id="main-zoom-image" width="600" height="800" fetchpriority="high" decoding="async" onload="imgLoaded(this)" onerror="imgError(this)">
                            <div class="zoom-hint-badge">
                                <i class="fas fa-search-plus"></i> Desliza para zoom
                            </div>
                        </div>

                        <!-- b) Tira de Miniaturas Refinadas (Chips 3:4 con micro-interacciones) -->
                        <div class="product-thumbnails-strip" id="gallery-thumbs">
                            ${fotos.map((img, idx) => `
                                <div class="product-thumb-item thumb-item ${idx === 0 ? 'active' : ''}" onclick="cambiarFotoPrincipal('${img}', this)">
                                    <img src="${img}" alt="${p.nombre} vista ${idx + 1}" width="75" height="100" loading="lazy" decoding="async" onerror="imgError(this)">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Columna Derecha: Información Editorial & Conversión (Sticky Desktop) -->
                <div class="product-info-col">
                    <div class="product-detail-info">
                        <!-- Header del Producto: Categoría y Botón Compartir -->
                        <div class="product-header-row">
                            <span class="product-category-eyebrow">${p.categoria || 'Lencería'} &bull; Mi Bella Afrodita</span>
                            <button type="button" class="btn-share-icon" onclick="compartirFichaProducto()" title="Compartir prenda" aria-label="Compartir prenda">
                                <i class="fas fa-share-nodes"></i>
                            </button>
                        </div>

                        <!-- Título de la Prenda en Cormorant Garamond -->
                        <h1 class="product-title-detail">${p.nombre}</h1>

                        <!-- Precios: Minorista Destacado + Píldora Mayorista de Lujo -->
                        <div class="product-pricing-box-clean">
                            <div class="price-value-main">$${precioMinoristaNum.toLocaleString('es-AR')}</div>
                            ${tarjetaMayoristaHtml}
                        </div>

                        <!-- Selector de Talle en Tiempo Real (Chips Boutique) -->
                        ${selectorTallesHtml}

                        <!-- Fila de Compra Principal: Stepper + Botón Añadir a la Bolsa Integrados -->
                        <div class="purchase-action-row">
                            <!-- Stepper Cantidad Compacto 50px -->
                            <div class="qty-selector-compact">
                                <button type="button" class="qty-btn" onclick="ajustarCantidadDetalle(-1)" aria-label="Restar una unidad">&minus;</button>
                                <span class="qty-display" id="detalle-qty-val">1</span>
                                <button type="button" class="qty-btn" onclick="ajustarCantidadDetalle(1)" aria-label="Sumar una unidad">&plus;</button>
                            </div>

                            <!-- Botón Añadir a la Bolsa CTA Principal Sólido 50px -->
                            <button type="button" class="btn-add-cart-primary" id="btn-add-bag" onclick="agregarAlCarritoDesdeDetalle(event)">
                                <i class="fas fa-shopping-bag"></i> AÑADIR A LA BOLSA
                            </button>
                        </div>

                        <!-- Enlace sutil de Asesoría WhatsApp (Una sola línea refinada) -->
                        <a href="#" id="btn-consultar-wa" target="_blank" class="pdp-wa-link">
                            <i class="fab fa-whatsapp pdp-wa-icon"></i>
                            <span>¿Dudas con el calce o talle? <strong class="pdp-wa-cta">Chateá con una asesora por WhatsApp</strong></span>
                        </a>

                        <!-- Tarjeta de Confianza y Entrega (Trust Badges de Lujo) -->
                        <div class="pdp-trust-card">
                            <div class="pdp-trust-item">
                                <div class="pdp-trust-icon"><i class="fas fa-motorcycle"></i></div>
                                <div class="pdp-trust-content">
                                    <span class="pdp-trust-title">Envío en moto en el día en San Juan</span>
                                    <span class="pdp-trust-desc">Entrega ágil a domicilio coordinada por WhatsApp.</span>
                                </div>
                            </div>
                            <div class="pdp-trust-divider"></div>
                            <div class="pdp-trust-item">
                                <div class="pdp-trust-icon"><i class="fas fa-box-open"></i></div>
                                <div class="pdp-trust-content">
                                    <span class="pdp-trust-title">Empaque 100% confidencial</span>
                                    <span class="pdp-trust-desc">Bolsa termosellada opaca y discreta sin marcas externas.</span>
                                </div>
                            </div>
                            <div class="pdp-trust-divider"></div>
                            <div class="pdp-trust-item">
                                <div class="pdp-trust-icon"><i class="fas fa-gem"></i></div>
                                <div class="pdp-trust-content">
                                    <span class="pdp-trust-title">Garantía de calidad & asesoría personalizada</span>
                                    <span class="pdp-trust-desc">Te asesoramos por WhatsApp antes de tu compra para que elijas tu talle exacto sin dudas.</span>
                                </div>
                            </div>
                        </div>

                        <!-- Acordeones Editoriales de Información (Líneas Ultrafinas) -->
                        <div class="accordion product-editorial-accordion" id="accordionDetalles">
                            <div class="accordion-item">
                                <h2 class="accordion-header">
                                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseDesc" aria-expanded="true">
                                        <i class="fas fa-feather-alt me-2 accordion-icon"></i> Descripción & Calce
                                    </button>
                                </h2>
                                <div id="collapseDesc" class="accordion-collapse collapse show" data-bs-parent="#accordionDetalles">
                                    <div class="accordion-body">
                                        ${p.descripcion || 'Prenda de lencería diseñada para ofrecer confort anatómico inigualable, soporte suave y realce natural con telas de textura sedosa.'}
                                    </div>
                                </div>
                            </div>
                            <div class="accordion-item">
                                <h2 class="accordion-header">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseCuidados" aria-expanded="false">
                                        <i class="fas fa-hand-sparkles me-2 accordion-icon"></i> Cuidados de la Prenda
                                    </button>
                                </h2>
                                <div id="collapseCuidados" class="accordion-collapse collapse" data-bs-parent="#accordionDetalles">
                                    <div class="accordion-body">
                                        Lavar a mano siempre con agua fría (máximo 30°C) y jabón neutro. No retorcer ni centrifugar para proteger la fibra y el encaje. Secar en plano sobre toalla a la sombra. No planchar directo sobre apliques ni elásticos.
                                    </div>
                                </div>
                            </div>
                            <div class="accordion-item">
                                <h2 class="accordion-header">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseHigiene" aria-expanded="false">
                                        <i class="fas fa-shield-halved me-2 accordion-icon"></i> 🛡️ POLÍTICA SANITARIA: PRENDAS SIN CAMBIO
                                    </button>
                                </h2>
                                <div id="collapseHigiene" class="accordion-collapse collapse" data-bs-parent="#accordionDetalles">
                                    <div class="accordion-body">
                                        <p class="mb-2">Por estrictas normas de higiene sanitaria y protección de la salud de nuestras clientas, las prendas de lencería y ropa interior son de uso estrictamente íntimo y personal, por lo que <strong>NO TIENEN CAMBIO NI DEVOLUCIÓN</strong> una vez entregadas.</p>
                                        <p class="mb-0">Para garantizar tu calce ideal y evitar errores, contas con asesoría personalizada por WhatsApp antes de realizar tu compra para resolver cualquier duda sobre talles, medidas y modelos.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    `;

    actualizarEnlaceWhatsApp();
}

// --- ZOOM ÓPTICO SUAVE CON SEGUIMIENTO DE MOUSE ---
function aplicarZoomOptico(e) {
    const viewport = document.getElementById('zoom-viewport');
    const img = document.getElementById('main-zoom-image');
    if (!viewport || !img) return;

    const rect = viewport.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    img.style.transformOrigin = `${x}% ${y}%`;
}

function restablecerZoomOptico() {
    const img = document.getElementById('main-zoom-image');
    if (img) {
        img.style.transformOrigin = 'center center';
    }
}
window.aplicarZoomOptico = aplicarZoomOptico;
window.restablecerZoomOptico = restablecerZoomOptico;

// --- INTERCAMBIO DE FOTO EN GALERÍA ---
function cambiarFotoPrincipal(url, thumbElement) {
    const img = document.getElementById('main-zoom-image');
    if (img) img.src = url;

    const thumbs = document.querySelectorAll('.product-thumb-item, .thumb-item');
    thumbs.forEach(t => t.classList.remove('active'));
    if (thumbElement) thumbElement.classList.add('active');
}
window.cambiarFotoPrincipal = cambiarFotoPrincipal;

// --- SELECTOR DE TALLE INTERACTIVO ---
window.cambiarTalleDetalle = function (talle, stock) {
    if (stock <= 0) return;
    TALLE_SELECCIONADO = talle;
    STOCK_DISPONIBLE_TALLE = stock;
    CANTIDAD_SELECCIONADA = 1;

    const qtyVal = document.getElementById('detalle-qty-val');
    if (qtyVal) qtyVal.innerText = '1';

    // Actualizar chips activos marcando visualmente con .selected y .active
    const chips = document.querySelectorAll('.btn-size-chip, .btn-talle-detail');
    chips.forEach(c => {
        if (c.getAttribute('data-talle') === talle) {
            c.classList.add('selected');
            c.classList.add('active');
        } else {
            c.classList.remove('selected');
            c.classList.remove('active');
        }
    });

    // Actualizar indicador de stock live
    const ind = document.getElementById('indicador-stock-live');
    if (ind) {
        ind.innerHTML = generarBadgeStock(stock);
    }

    // Actualizar enlace WhatsApp
    actualizarEnlaceWhatsApp();
};

function generarBadgeStock(stock) {
    if (stock <= 0) {
        return `<span class="stock-out-text"><i class="fas fa-ban me-1"></i> Agotado en este talle</span>`;
    } else if (stock <= 2) {
        return `<span class="stock-low-text"><i class="fas fa-fire me-1"></i> ¡Últimas ${stock} unidades disponibles!</span>`;
    } else {
        return `<span class="stock-ok-text"><i class="fas fa-check-circle me-1"></i> En stock inmediato (${stock} disponibles)</span>`;
    }
}

function ajustarCantidadDetalle(delta) {
    const nueva = CANTIDAD_SELECCIONADA + delta;
    if (nueva < 1) return;
    if (STOCK_DISPONIBLE_TALLE > 0 && nueva > STOCK_DISPONIBLE_TALLE) {
        Swal.fire({
            icon: 'warning',
            title: 'Stock Límite',
            text: `Solo disponemos de ${STOCK_DISPONIBLE_TALLE} unidades en talle ${TALLE_SELECCIONADO}.`,
            confirmButtonColor: '#9E2A4B'
        });
        return;
    }

    CANTIDAD_SELECCIONADA = nueva;
    const qtyVal = document.getElementById('detalle-qty-val');
    if (qtyVal) qtyVal.innerText = CANTIDAD_SELECCIONADA;
}
window.ajustarCantidadDetalle = ajustarCantidadDetalle;

window.agregarAlCarritoDesdeDetalle = function (e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    if (!PRODUCTO_ACTUAL) return;

    const variantes = Array.isArray(PRODUCTO_ACTUAL.variantes) ? PRODUCTO_ACTUAL.variantes : [];
    const tieneTalles = variantes.length > 0;

    // Si no ha elegido talle, muestra una alerta elegante
    if (tieneTalles && !TALLE_SELECCIONADO) {
        Swal.fire({
            icon: 'info',
            title: 'Selecciona tu talle',
            text: 'Por favor, selecciona tu talle antes de continuar.',
            confirmButtonColor: '#9E2A4B',
            confirmButtonText: 'Entendido'
        });
        const chipsContainer = document.getElementById('detalle-size-chips');
        if (chipsContainer) {
            chipsContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    if (TALLE_SELECCIONADO && STOCK_DISPONIBLE_TALLE <= 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Talle Agotado',
            text: 'Este talle se encuentra agotado momentáneamente.',
            confirmButtonColor: '#9E2A4B'
        });
        return;
    }

    const talleFinal = TALLE_SELECCIONADO || (PRODUCTO_ACTUAL.talles && PRODUCTO_ACTUAL.talles[0] ? PRODUCTO_ACTUAL.talles[0] : 'Único');
    const cantidad = CANTIDAD_SELECCIONADA || 1;

    // Feedback visual en el botón de compra: cambiar a "✓ ¡Añadido!" por 1.5s
    const btnAdd = document.getElementById('btn-add-bag') || (e?.target?.closest('button'));
    if (btnAdd) {
        const originalHtml = btnAdd.innerHTML;
        btnAdd.innerHTML = '<i class="fas fa-check me-2"></i> ¡Añadido!';
        btnAdd.classList.add('btn-added-success');
        setTimeout(() => {
            btnAdd.innerHTML = originalHtml;
            btnAdd.classList.remove('btn-added-success');
        }, 1500);
    }

    if (typeof window.agregarAlCarrito === 'function') {
        window.agregarAlCarrito(e, PRODUCTO_ACTUAL.id, talleFinal, cantidad);
    } else {
        // Fallback directo persistente
        let carritoLocal = JSON.parse(localStorage.getItem('myBellaCarrito')) || [];
        const itemExistente = carritoLocal.find(it => String(it.id) === String(PRODUCTO_ACTUAL.id) && it.talle === talleFinal);
        const foto = (PRODUCTO_ACTUAL.imagenes && PRODUCTO_ACTUAL.imagenes.length > 0) ? PRODUCTO_ACTUAL.imagenes[0] : '';
        
        if (itemExistente) {
            itemExistente.cantidad += cantidad;
        } else {
            carritoLocal.push({
                id: Number(PRODUCTO_ACTUAL.id),
                nombre: PRODUCTO_ACTUAL.nombre,
                precio: Number(PRODUCTO_ACTUAL.precioMinorista) || 0,
                precioMinorista: Number(PRODUCTO_ACTUAL.precioMinorista) || 0,
                precioMayorista: Number(PRODUCTO_ACTUAL.precioMayorista) || Number(PRODUCTO_ACTUAL.precioMinorista) || 0,
                imagen: foto,
                talle: talleFinal,
                cantidad: cantidad
            });
        }
        localStorage.setItem('myBellaCarrito', JSON.stringify(carritoLocal));
        if (typeof window.actualizarContadorUI === 'function') window.actualizarContadorUI(true);
        if (typeof window.renderizarListaCarrito === 'function') window.renderizarListaCarrito();

        // Notificación Toast sutil y elegante de 2.5s (no bloqueante)
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: '✓ Prenda añadida a la bolsa',
            text: `${PRODUCTO_ACTUAL.nombre} (Talle ${talleFinal}) x${cantidad}`,
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true,
            iconColor: '#9E2A4B',
            background: '#FAF8F5',
            color: '#2C2627',
            width: '320px'
        });
    }
};


function actualizarEnlaceWhatsApp() {
    const btn = document.getElementById('btn-consultar-wa');
    if (!btn || !PRODUCTO_ACTUAL) return;

    const telefono = "5492646121771";
    const urlPrenda = window.location.href;
    const precio = Number(PRODUCTO_ACTUAL.precioMinorista || 0).toLocaleString('es-AR');

    let msg = `🛍️ *CONSULTA: MI BELLA AFRODITA*\n`;
    msg += `✨ Hola! Me interesa consultar por el modelo *${PRODUCTO_ACTUAL.nombre}*\n`;
    msg += `📏 *Talle seleccionado:* ${TALLE_SELECCIONADO || 'A definir'}\n`;
    msg += `💰 *Precio Minorista:* $${precio}\n`;
    msg += `🔗 *Enlace:* ${urlPrenda}\n\n`;
    msg += `¿Tienen stock para coordinar envío a domicilio en San Juan? ¡Muchas gracias!`;

    btn.href = `https://wa.me/${telefono}?text=${encodeURIComponent(msg)}`;
}

// --- CROSS-SELLING: COMPLETA TU LOOK ---
async function cargarProductosRelacionados() {
    const contenedor = document.getElementById('cross-sell-mount');
    if (!contenedor || !PRODUCTO_ACTUAL) return;

    try {
        const cat = PRODUCTO_ACTUAL.categoria || '';
        const url = cat ? `${API_PRODUCTOS_ENDPOINT}?categoria=${encodeURIComponent(cat)}` : API_PRODUCTOS_ENDPOINT;
        const res = await fetch(url);
        if (!res.ok) return;

        let lista = await res.json();
        // Excluir el producto actual
        lista = lista.filter(item => String(item.id) !== String(PRODUCTO_ACTUAL.id));

        if (lista.length < 4) {
            // Si la categoría tiene menos de 4, completar con otros
            const resTodos = await fetch(API_PRODUCTOS_ENDPOINT);
            if (resTodos.ok) {
                const todos = await resTodos.json();
                todos.forEach(t => {
                    if (String(t.id) !== String(PRODUCTO_ACTUAL.id) && !lista.some(l => l.id === t.id)) {
                        lista.push(t);
                    }
                });
            }
        }

        const seleccionados = lista.slice(0, 4);
        if (seleccionados.length === 0) return;

        contenedor.innerHTML = seleccionados.map(p => {
            const fotos = Array.isArray(p.imagenes) && p.imagenes.length > 0
                ? p.imagenes.map(normalizarUrl)
                : [IMG_FALLBACK];
            const foto1 = fotos[0];
            const foto2 = fotos.length > 1 ? fotos[1] : null;

            const wholesaleHtml = p.precioMayorista 
                ? `<span class="price-wholesale-subtle">x3 $${Number(p.precioMayorista).toLocaleString('es-AR')}</span>`
                : '';

            return `
                <div class="col-6 col-md-3 d-flex align-items-stretch product-item-card">
                    <div class="product-card-boutique w-100" onclick="window.location.href='./producto.html?id=${p.id}'" title="Ver ${p.nombre}">
                        <div class="product-media-container position-relative is-loading">
                            ${p.etiqueta ? `<span class="badge-luxury-tag">${p.etiqueta}</span>` : ''}
                            <img src="${foto1}" alt="${p.nombre}" class="img-primary" width="600" height="800" loading="lazy" decoding="async" onload="imgLoaded(this)" onerror="imgError(this)">
                            ${foto2 ? `<img src="${foto2}" alt="${p.nombre} dorso" class="img-secondary" width="600" height="800" loading="lazy" decoding="async" onerror="imgError(this)">` : ''}
                        </div>
                        <div class="product-info-wrap">
                            <div class="product-category-label">${p.categoria || 'Colección'}</div>
                            <h3 class="product-title-luxury" title="${p.nombre}">${p.nombre}</h3>
                            <div class="product-pricing-box">
                                <span class="price-retail-highlight">$${Number(p.precioMinorista || 0).toLocaleString('es-AR')}</span>
                                ${wholesaleHtml}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error("Error al cargar cross-selling:", err);
    }
}

// --- ACTUALIZACIÓN DINÁMICA DE METADATOS OPENGRAPH ---
function actualizarMetadatosSEO(p) {
    document.title = `${p.nombre} | Mi Bella Afrodita`;

    const metaTags = [
        { property: 'og:title', content: `${p.nombre} | Mi Bella Afrodita` },
        { property: 'og:description', content: p.descripcion || 'Lencería en San Juan. Calce anatómico y telas suaves seleccionadas.' },
        { property: 'og:image', content: (p.imagenes && p.imagenes.length > 0) ? normalizarUrl(p.imagenes[0]) : 'https://alexanderbaez.github.io/my-bella-afrodita-web/images/LOGO.png' },
        { property: 'og:url', content: window.location.href },
        { property: 'twitter:title', content: p.nombre },
        { property: 'twitter:description', content: p.descripcion || 'Lencería en San Juan.' }
    ];

    metaTags.forEach(m => {
        let el = document.querySelector(`meta[property="${m.property}"]`) || document.querySelector(`meta[name="${m.property}"]`);
        if (el) {
            el.setAttribute('content', m.content);
        } else {
            el = document.createElement('meta');
            el.setAttribute('property', m.property);
            el.setAttribute('content', m.content);
            document.head.appendChild(el);
        }
    });
}

function normalizarUrl(url) {
    if (!url) return '';
    let clean = String(url).trim();
    // Elimina host/puerto absoluto local o IP si existiese previamente en base de datos
    clean = clean.replace(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/.*)$/, '$1');
    clean = clean.replace(/^https?:\/\/(?:[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|localhost)(?::\d+)?(\/(?:uploads|images)\/.*)$/, '$1');
    if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
    if (clean.startsWith('../images/')) return clean.replace('../images/', '/images/');
    if (clean.startsWith('images/')) return '/' + clean;
    if (clean.startsWith('uploads/')) return '/' + clean;
    if (clean.startsWith('/')) return clean;
    return '/' + clean;
}

// --- BOTÓN COMPARTIR ESTILO MERCADO LIBRE ---
window.compartirFichaProducto = async function() {
    if (!PRODUCTO_ACTUAL) return;
    const url = window.location.href;
    const precio = Number(PRODUCTO_ACTUAL.precioMinorista || 0).toLocaleString('es-AR');
    const texto = `${PRODUCTO_ACTUAL.nombre} - Mi Bella Afrodita ($${precio})`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: `${PRODUCTO_ACTUAL.nombre} | Mi Bella Afrodita`,
                text: texto,
                url: url
            });
            return;
        } catch (err) {
            if (err.name === 'AbortError') return;
        }
    }

    // Fallback: Portapapeles + Toast oro champán
    copiarAlPortapapelesConToast(url);
};

function copiarAlPortapapelesConToast(url) {
    const dispararToast = () => {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: '¡Enlace copiado al portapapeles!',
            showConfirmButton: false,
            timer: 2500,
            background: '#1F1E1D',
            color: '#FAF9F6',
            iconColor: '#C5A880'
        });
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(dispararToast).catch(() => fallbackCopy(url, dispararToast));
    } else {
        fallbackCopy(url, dispararToast);
    }
}

function fallbackCopy(url, callback) {
    const el = document.createElement('textarea');
    el.value = url;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    try {
        document.execCommand('copy');
        callback();
    } catch (e) {
        console.error("Fallback copy failed", e);
    }
    document.body.removeChild(el);
}
