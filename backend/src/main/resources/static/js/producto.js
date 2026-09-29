/**
 * My Bella Afrodita - Lógica de Página de Detalle de Producto Permalink
 * Permalinks: /producto.html?id={id}
 * Incluye: Galería Vertical, Zoom Óptico, Selector de Talles en Vivo con Stock Urgente,
 * Micro-tarjeta Mayorista, Guía de Medidas y Cross-selling "Completa tu Look".
 */

let PRODUCTO_ACTUAL = null;
let TALLE_SELECCIONADO = null;
let STOCK_DISPONIBLE_TALLE = 0;
let CANTIDAD_SELECCIONADA = 1;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Obtener ID del producto desde la URL
    const urlParams = new URLSearchParams(window.location.search);
    const prodId = urlParams.get('id');

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
        const response = await fetch(`/api/productos/${id}`);
        if (!response.ok) {
            throw new Error(`Producto no encontrado (HTTP ${response.status})`);
        }

        PRODUCTO_ACTUAL = await response.json();
        renderizarPaginaProducto(PRODUCTO_ACTUAL);
        actualizarMetadatosSEO(PRODUCTO_ACTUAL);

    } catch (error) {
        console.error("Error al cargar producto:", error);
        contenedor.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-gem text-muted fa-3x mb-3" style="color: var(--gold-champagne) !important;"></i>
                <h3 class="font-serif text-dark mb-2">Prenda no disponible</h3>
                <p class="text-muted small mb-4">La pieza solicitada no se encuentra disponible en nuestro catálogo activo o el enlace ha expirado.</p>
                <a href="./productos.html" class="btn btn-dark btn-sm rounded-1 px-4 py-2 text-uppercase fw-semibold" style="letter-spacing: 1.5px; font-size: 0.75rem;">
                    Explorar Catálogo Boutique
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
        bcCat.href = `./productos.html?cat=${encodeURIComponent(p.categoria || 'todos')}`;
        bcCat.innerText = (p.categoria || 'Catálogo').toUpperCase();
    }
    if (bcProd) {
        bcProd.innerText = p.nombre;
    }

    // Normalizar imágenes
    const fotos = Array.isArray(p.imagenes) && p.imagenes.length > 0
        ? p.imagenes.map(normalizarUrl)
        : ['https://via.placeholder.com/600x800?text=My+Bella+Afrodita'];

    // Variantes y Stock
    const variantes = Array.isArray(p.variantes) ? p.variantes : [];
    let primeraConStock = variantes.find(v => (v.stock || 0) > 0);
    if (!primeraConStock && variantes.length > 0) {
        primeraConStock = variantes[0];
    }

    TALLE_SELECCIONADO = primeraConStock ? primeraConStock.talle : (p.talles && p.talles[0] ? p.talles[0] : 'Único');
    STOCK_DISPONIBLE_TALLE = primeraConStock ? (primeraConStock.stock || 0) : (p.stock !== false ? 5 : 0);
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
            <div class="product-size-section">
                <div class="size-header-bar">
                    <div class="d-flex align-items-center gap-2">
                        <span class="size-header-title">Seleccionar Talle:</span>
                        <div id="indicador-stock-live">
                            ${generarBadgeStock(STOCK_DISPONIBLE_TALLE)}
                        </div>
                    </div>
                    <button type="button" class="btn-measure-guide" onclick="abrirGuiaMedidas()">
                        <i class="fas fa-ruler-combined me-1"></i> Guía de Medidas (cm)
                    </button>
                </div>
                <div class="product-size-grid" id="detalle-size-chips">
                    ${variantes.map(v => {
                        const agotado = (v.stock || 0) <= 0;
                        const esActivo = v.talle === TALLE_SELECCIONADO;
                        return `
                            <button type="button" 
                                    class="btn-talle-detail ${agotado ? 'out-of-stock' : ''} ${esActivo ? 'active' : ''}" 
                                    data-talle="${v.talle}" 
                                    data-stock="${v.stock || 0}"
                                    ${agotado ? 'disabled title="Agotado"' : `title="${v.stock} disponibles"`}
                                    onclick="cambiarTalleDetalle('${v.talle}', ${v.stock || 0})">
                                ${v.talle}
                            </button>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // Micro-tarjeta de Beneficio Mayorista x3
    let tarjetaMayoristaHtml = '';
    if (precioMayoristaNum > 0) {
        tarjetaMayoristaHtml = `
            <div class="wholesale-benefit-card">
                <div class="wholesale-benefit-icon">
                    <i class="fas fa-crown"></i>
                </div>
                <div class="wholesale-benefit-text">
                    <div class="d-flex align-items-center">
                        <span class="wholesale-benefit-price">$${precioMayoristaNum.toLocaleString('es-AR')}</span>
                        <span class="wholesale-pill-tag">Mayorista x3</span>
                    </div>
                    <div class="wholesale-benefit-sub">
                        Lleva 3 o más prendas de cualquier categoría y desbloquea este precio 
                        ${ahorroPorPrenda > 0 ? `(Ahorras <b>$${ahorroPorPrenda.toLocaleString('es-AR')}</b> por prenda)` : ''}.
                    </div>
                </div>
            </div>
        `;
    }

    mount.innerHTML = `
        <div class="product-detail-wrapper">
            <div class="row g-4 g-lg-5 align-items-start">
                
                <!-- Columna Izquierda: Galería Vertical & Zoom Óptico -->
                <div class="col-12 col-lg-6">
                    <div class="product-gallery-layout">
                        <!-- Strip de Miniaturas -->
                        <div class="product-thumbnails-strip" id="gallery-thumbs">
                            ${fotos.map((img, idx) => `
                                <div class="thumb-item ${idx === 0 ? 'active' : ''}" onclick="cambiarFotoPrincipal('${img}', this)">
                                    <img src="${img}" alt="${p.nombre} vista ${idx + 1}" onerror="this.src='https://via.placeholder.com/150x200?text=Foto'">
                                </div>
                            `).join('')}
                        </div>

                        <!-- Visor Principal con Zoom Óptico -->
                        <div class="product-main-viewport" id="zoom-viewport" onmousemove="aplicarZoomOptico(event)" onmouseleave="restablecerZoomOptico()">
                            <div class="main-img-badges">
                                ${badgeEtiqueta}
                                ${badgeStockOut}
                            </div>
                            <img src="${fotos[0]}" alt="${p.nombre}" class="product-zoom-img" id="main-zoom-image" onerror="this.src='https://via.placeholder.com/600x800?text=My+Bella+Afrodita'">
                            <div class="zoom-hint-badge">
                                <i class="fas fa-search-plus"></i> Desliza para zoom óptico
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Columna Derecha: Información Editorial & Conversión -->
                <div class="col-12 col-lg-6">
                    <div class="product-detail-info">
                        <span class="product-eyebrow-tag">${p.categoria || 'Alta Costura'} &bull; Confección Atelier</span>
                        <h1 class="product-editorial-title">${p.nombre}</h1>

                        <!-- Precios -->
                        <div class="product-pricing-editorial">
                            <div class="price-retail-highlight">
                                <span>$${precioMinoristaNum.toLocaleString('es-AR')}</span>
                                <span class="price-retail-label">Precio Minorista</span>
                            </div>
                            ${tarjetaMayoristaHtml}
                        </div>

                        <!-- Selector de Talle en Tiempo Real -->
                        ${selectorTallesHtml}

                        <!-- Controles de Compra -->
                        <div class="product-actions-bar">
                            <!-- Stepper Cantidad -->
                            <div class="product-quantity-selector">
                                <button type="button" class="qty-step-btn" onclick="ajustarCantidadDetalle(-1)" title="Restar">&minus;</button>
                                <span class="qty-step-num" id="detalle-qty-val">1</span>
                                <button type="button" class="qty-step-btn" onclick="ajustarCantidadDetalle(1)" title="Sumar">&plus;</button>
                            </div>

                            <!-- Botón Añadir a la Bolsa -->
                            <button type="button" class="btn-add-to-bag-luxury" id="btn-add-bag" onclick="agregarAlCarritoDesdeDetalle(event)">
                                <i class="fas fa-shopping-bag"></i> AÑADIR A LA BOLSA
                            </button>
                        </div>

                        <!-- Botón Directo WhatsApp -->
                        <a href="#" id="btn-consultar-wa" target="_blank" class="btn-ask-whatsapp-luxury">
                            <i class="fab fa-whatsapp fa-lg"></i> Consultar por WhatsApp este modelo
                        </a>

                        <!-- Micro-Trust Badges -->
                        <div class="product-micro-trust">
                            <div class="micro-trust-item">
                                <i class="fas fa-shield-alt"></i>
                                <span>Garantía de Calce & Higiene</span>
                            </div>
                            <div class="micro-trust-item">
                                <i class="fas fa-box-open"></i>
                                <span>Empaque Discreto de Lujo</span>
                            </div>
                            <div class="micro-trust-item">
                                <i class="fas fa-paper-plane"></i>
                                <span>Envíos San Juan & Todo el País</span>
                            </div>
                        </div>

                        <!-- Acordeón Editorial de Detalles -->
                        <div class="accordion product-editorial-accordion" id="accordionDetalles">
                            <div class="accordion-item">
                                <h2 class="accordion-header">
                                    <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseDesc" aria-expanded="true">
                                        <i class="fas fa-feather-alt me-2" style="color: var(--gold-dark);"></i> Descripción & Calce
                                    </button>
                                </h2>
                                <div id="collapseDesc" class="accordion-collapse collapse show" data-bs-parent="#accordionDetalles">
                                    <div class="accordion-body">
                                        ${p.descripcion || 'Prenda de lencería boutique diseñada para ofrecer confort anatómico inigualable, soporte sutil y realce elegante.'}
                                    </div>
                                </div>
                            </div>
                            <div class="accordion-item">
                                <h2 class="accordion-header">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseCuidados" aria-expanded="false">
                                        <i class="fas fa-hand-sparkles me-2" style="color: var(--gold-dark);"></i> Cuidados de la Lencería
                                    </button>
                                </h2>
                                <div id="collapseCuidados" class="accordion-collapse collapse" data-bs-parent="#accordionDetalles">
                                    <div class="accordion-body">
                                        Lavar a mano siempre con agua fría (máximo 30°C) y jabón neutro. No retorcer ni centrifugar para proteger la fibra y el encaje. Secar en plano sobre toalla a la sombra. No planchar directo sobre apliques ni satén.
                                    </div>
                                </div>
                            </div>
                            <div class="accordion-item">
                                <h2 class="accordion-header">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseHigiene" aria-expanded="false">
                                        <i class="fas fa-stethoscope me-2" style="color: var(--gold-dark);"></i> Políticas de Higiene & Cambios
                                    </button>
                                </h2>
                                <div id="collapseHigiene" class="accordion-collapse collapse" data-bs-parent="#accordionDetalles">
                                    <div class="accordion-body">
                                        Por normativas de salud e higiene sanitaria, <strong>las bombachas, colaless y bodies no tienen cambio</strong>. Los conjuntos y corsetería pueden cambiarse dentro de los 7 días de recibido exclusivamente si conservan etiquetas intactas, protectores y empaque original sin indicios de uso.
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

// --- INTERCAMBIO DE FOTO EN GALERÍA ---
function cambiarFotoPrincipal(url, thumbElement) {
    const img = document.getElementById('main-zoom-image');
    if (img) img.src = url;

    const thumbs = document.querySelectorAll('.thumb-item');
    thumbs.forEach(t => t.classList.remove('active'));
    if (thumbElement) thumbElement.classList.add('active');
}

// --- SELECTOR DE TALLE INTERACTIVO ---
function cambiarTalleDetalle(talle, stock) {
    TALLE_SELECCIONADO = talle;
    STOCK_DISPONIBLE_TALLE = stock;
    CANTIDAD_SELECCIONADA = 1;

    const qtyVal = document.getElementById('detalle-qty-val');
    if (qtyVal) qtyVal.innerText = '1';

    // Actualizar chips activos
    const chips = document.querySelectorAll('.btn-talle-detail');
    chips.forEach(c => {
        if (c.getAttribute('data-talle') === talle) {
            c.classList.add('active');
        } else {
            c.classList.remove('active');
        }
    });

    // Actualizar indicador de stock
    const ind = document.getElementById('indicador-stock-live');
    if (ind) {
        ind.innerHTML = generarBadgeStock(stock);
    }

    // Actualizar enlace WhatsApp
    actualizarEnlaceWhatsApp();
}

function generarBadgeStock(stock) {
    if (stock <= 0) {
        return `<span class="badge bg-secondary text-white" style="font-size:0.65rem;">Agotado</span>`;
    } else if (stock <= 2) {
        return `<span class="badge-stock-urgent-pulse"><i class="fas fa-fire-alt me-1"></i> ¡Solo quedan ${stock} unidades!</span>`;
    } else {
        return `<span class="badge-stock-normal"><i class="fas fa-check-circle me-1"></i> En Stock Inmediato (${stock} disp.)</span>`;
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
            confirmButtonColor: '#1a1a1a'
        });
        return;
    }

    CANTIDAD_SELECCIONADA = nueva;
    const qtyVal = document.getElementById('detalle-qty-val');
    if (qtyVal) qtyVal.innerText = CANTIDAD_SELECCIONADA;
}

function agregarAlCarritoDesdeDetalle(e) {
    if (!PRODUCTO_ACTUAL) return;
    if (STOCK_DISPONIBLE_TALLE <= 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Talle Agotado',
            text: 'Este talle se encuentra agotado momentáneamente.',
            confirmButtonColor: '#1a1a1a'
        });
        return;
    }

    if (typeof window.agregarAlCarrito === 'function') {
        window.agregarAlCarrito(e, PRODUCTO_ACTUAL.id, TALLE_SELECCIONADO, CANTIDAD_SELECCIONADA);
    }
}

function actualizarEnlaceWhatsApp() {
    const btn = document.getElementById('btn-consultar-wa');
    if (!btn || !PRODUCTO_ACTUAL) return;

    const telefono = "5492646121771";
    const urlPrenda = window.location.href;
    const precio = Number(PRODUCTO_ACTUAL.precioMinorista || 0).toLocaleString('es-AR');

    let msg = `🛍️ *CONSULTA BOUTIQUE: MY BELLA AFRODITA*\n`;
    msg += `✨ Hola! Me interesa consultar por el modelo *${PRODUCTO_ACTUAL.nombre}*\n`;
    msg += `📏 *Talle seleccionado:* ${TALLE_SELECCIONADO || 'A definir'}\n`;
    msg += `💰 *Precio Minorista:* $${precio}\n`;
    msg += `🔗 *Enlace:* ${urlPrenda}\n\n`;
    msg += `¿Tienen stock para coordinar retiro en Showroom San Juan o envío a domicilio? ¡Muchas gracias!`;

    btn.href = `https://wa.me/${telefono}?text=${encodeURIComponent(msg)}`;
}

// --- CROSS-SELLING: COMPLETA TU LOOK ---
async function cargarProductosRelacionados() {
    const contenedor = document.getElementById('cross-sell-mount');
    if (!contenedor || !PRODUCTO_ACTUAL) return;

    try {
        const cat = PRODUCTO_ACTUAL.categoria || '';
        const url = cat ? `/api/productos?categoria=${encodeURIComponent(cat)}` : '/api/productos';
        const res = await fetch(url);
        if (!res.ok) return;

        let lista = await res.json();
        // Excluir el producto actual
        lista = lista.filter(item => String(item.id) !== String(PRODUCTO_ACTUAL.id));

        if (lista.length < 4) {
            // Si la categoría tiene menos de 4, completar con otros
            const resTodos = await fetch('/api/productos');
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
                : ['https://via.placeholder.com/300x400?text=My+Bella+Afrodita'];
            const foto1 = fotos[0];
            const foto2 = fotos.length > 1 ? fotos[1] : null;

            return `
                <div class="col-6 col-md-3 d-flex align-items-stretch">
                    <div class="product-card-boutique w-100">
                        <div class="product-media-container position-relative" style="cursor: pointer;" onclick="window.location.href='./producto.html?id=${p.id}'">
                            ${p.etiqueta ? `<span class="badge-luxury-tag">${p.etiqueta}</span>` : ''}
                            <img src="${foto1}" alt="${p.nombre}" class="img-primary" onerror="this.src='https://via.placeholder.com/300x400?text=My+Bella+Afrodita'">
                            ${foto2 ? `<img src="${foto2}" alt="${p.nombre} dorso" class="img-secondary">` : ''}
                        </div>
                        <div class="product-info-wrap">
                            <div>
                                <div class="product-category-label">${p.categoria || 'Colección'}</div>
                                <h3 class="product-title-luxury" title="${p.nombre}" style="cursor: pointer;" onclick="window.location.href='./producto.html?id=${p.id}'">${p.nombre}</h3>
                            </div>
                            <div class="mt-2">
                                <div class="product-pricing-box d-flex align-items-baseline">
                                    <span class="price-retail-main">$${Number(p.precioMinorista || 0).toLocaleString('es-AR')}</span>
                                </div>
                                <a href="./producto.html?id=${p.id}" class="btn btn-outline-dark btn-sm w-100 mt-2 text-uppercase fw-semibold" style="letter-spacing: 1px; font-size: 0.68rem; border-radius: 2px;">
                                    Ver Detalle
                                </a>
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
    document.title = `${p.nombre} | My Bella Afrodita Haute Couture`;

    const metaTags = [
        { property: 'og:title', content: `${p.nombre} | My Bella Afrodita Boutique` },
        { property: 'og:description', content: p.descripcion || 'Lencería boutique de alta gama en San Juan. Calce anatómico y encajes seleccionados.' },
        { property: 'og:image', content: (p.imagenes && p.imagenes.length > 0) ? normalizarUrl(p.imagenes[0]) : 'https://alexanderbaez.github.io/my-bella-afrodita-web/images/LOGO.png' },
        { property: 'og:url', content: window.location.href },
        { property: 'twitter:title', content: p.nombre },
        { property: 'twitter:description', content: p.descripcion || 'Lencería boutique de alta gama.' }
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
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/')) return url;
    return '/' + url;
}
