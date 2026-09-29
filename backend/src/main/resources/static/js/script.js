/* ==========================================================================
   LÓGICA DE NEGOCIO Y EXPERIENCIA DE COMPRA - MY BELLA AFRODITA
   (Estándar Boutique Luxury 2026 - Zara / Savage X Fenty UX Style)
   ========================================================================== */

const WHATSAPP_NUMBER = '5492646121771';
const API_URL = '/api/productos';

function normalizarUrlImagen(url) {
    if (!url) return 'https://via.placeholder.com/300x400?text=My+Bella+Afrodita';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('../images/')) return url.replace('../images/', '/images/');
    if (url.startsWith('images/')) return '/' + url;
    if (url.startsWith('uploads/')) return '/' + url;
    return url;
}

let PRODUCTOS = [];
window.PRODUCTOS = PRODUCTOS;
let carrito = JSON.parse(localStorage.getItem('myBellaCarrito')) || [];
let talleFiltroActivo = 'TODOS';
let categoriaActiva = null;

document.addEventListener('DOMContentLoaded', async () => {
    actualizarContadorUI();

    // 1. CARGA ASÍNCRONA DE PRODUCTOS DESDE LA API SPRING BOOT / MYSQL
    const contenedor = document.getElementById("contenedor-productos");
    try {
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="spinner-border text-dark" role="status" style="width: 2.2rem; height: 2.2rem; border-width: 0.18em;">
                        <span class="visually-hidden">Cargando colección...</span>
                    </div>
                    <p class="text-muted small mt-2 text-uppercase fw-semibold" style="letter-spacing: 1.5px; font-size: 0.72rem;">Cargando colección boutique...</p>
                </div>`;
        }

        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        PRODUCTOS = await response.json();
        window.PRODUCTOS = PRODUCTOS;
    } catch (error) {
        console.error("Error al obtener los productos desde la API:", error);
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-exclamation-circle text-danger fa-2x mb-3"></i>
                    <h5 class="fw-bold text-dark font-playfair">No pudimos conectar con el catálogo</h5>
                    <p class="text-muted small">Por favor, confirma que el servidor de Tienda Bella Afrodita esté activo en el puerto 8080.</p>
                </div>`;
        }
        return;
    }

    if (contenedor) {
        // 2. CAPTURAMOS LA CATEGORÍA DESDE LA URL (ej: productos.html?cat=conjuntos)
        const urlParams = new URLSearchParams(window.location.search);
        categoriaBuscada = urlParams.get('cat');
        categoriaActiva = categoriaBuscada;

        // 3. CAMBIAMOS EL TÍTULO Y SUBTÍTULO VISUAL SEGÚN LA CATEGORÍA
        const tituloSeccion = document.querySelector('.section-title');
        const txtSubtitulo = document.querySelector('.text-uppercase.small.fw-bold');
        const breadcrumbActive = document.querySelector('.breadcrumb-item.active');

        if (categoriaBuscada) {
            const catNorm = categoriaBuscada.toLowerCase();
            if (catNorm === 'bombachas') {
                if (tituloSeccion) tituloSeccion.innerText = "Bombachas, Colaless y Vedetinas";
                if (txtSubtitulo) txtSubtitulo.innerText = "Colección Íntima";
                if (breadcrumbActive) breadcrumbActive.innerText = "Bombachas";
                document.title = "Bombachas - My Bella Afrodita";
            } else if (catNorm === 'conjuntos') {
                if (tituloSeccion) tituloSeccion.innerText = "Conjuntos Exclusivos";
                if (txtSubtitulo) txtSubtitulo.innerText = "Colección Premium";
                if (breadcrumbActive) breadcrumbActive.innerText = "Conjuntos";
                document.title = "Conjuntos - My Bella Afrodita";
            } else if (catNorm === 'hombres') {
                if (tituloSeccion) tituloSeccion.innerText = "Boxers y Slips";
                if (txtSubtitulo) txtSubtitulo.innerText = "Colección Essential";
                if (breadcrumbActive) breadcrumbActive.innerText = "Para Ellos";
                document.title = "Hombres - My Bella Afrodita";
            } else if (catNorm === 'medias') {
                if (tituloSeccion) tituloSeccion.innerText = "Medias para Él y Ella";
                if (txtSubtitulo) txtSubtitulo.innerText = "Esenciales";
                if (breadcrumbActive) breadcrumbActive.innerText = "Medias";
                document.title = "Medias - My Bella Afrodita";
            }

            // 4. FILTRAMOS PRODUCTOS Y TALLES CONTEXTUALES
            const filtrados = PRODUCTOS.filter(p => p.categoria && p.categoria.toLowerCase() === catNorm);
            actualizarFiltrosTallesContextuales(catNorm);
            dibujarProductos(filtrados);
        } else {
            if (tituloSeccion) tituloSeccion.innerText = "Nuestro Catálogo Completo";
            actualizarFiltrosTallesContextuales(null);
            dibujarProductos(PRODUCTOS);
        }
    }

    // Cerrar el Drawer con la tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarCarritoDrawer();
        }
    });

    // Detectar si vienen desde un link compartido con id directo
    const urlParamsShared = new URLSearchParams(window.location.search);
    const productoId = urlParamsShared.get('id');
    if (productoId) {
        setTimeout(() => {
            const p = PRODUCTOS.find(prod => String(prod.id) === String(productoId));
            if (p && p.imagenes && p.imagenes.length > 0) {
                abrirZoomLenceria(p.imagenes, 0);
            }
        }, 500);
    }
});

// --- FILTROS DE TALLES CONTEXTUALES E INTELIGENTES ---
function actualizarFiltrosTallesContextuales(categoria) {
    const contenedorFiltros = document.getElementById('filtro-talles-container');
    if (!contenedorFiltros) return;

    // Obtener productos de la categoría activa (o todos si es general)
    const productosContexto = categoria 
        ? PRODUCTOS.filter(p => p.categoria && p.categoria.toLowerCase() === categoria.toLowerCase())
        : PRODUCTOS;

    // Extraer talles únicos existentes en estos productos
    const tallesSet = new Set();
    productosContexto.forEach(p => {
        if (Array.isArray(p.talles)) {
            p.talles.forEach(t => {
                if (t && String(t).trim().length > 0) {
                    tallesSet.add(String(t).trim());
                }
            });
        }
    });

    // Ordenamiento natural (números primero, luego letras S, M, L, XL, etc.)
    const tallesOrdenados = Array.from(tallesSet).sort((a, b) => {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        if (!isNaN(numA)) return -1;
        if (!isNaN(numB)) return 1;
        return a.localeCompare(b);
    });

    if (talleFiltroActivo !== 'TODOS' && !tallesSet.has(talleFiltroActivo)) {
        talleFiltroActivo = 'TODOS';
    }

    let html = `<button class="btn btn-sm rounded-1 px-3 py-1 ${talleFiltroActivo === 'TODOS' ? 'btn-dark' : 'btn-outline-dark'}" onclick="filtrarPorTalle('TODOS')">TODOS</button>`;

    tallesOrdenados.forEach(t => {
        const activo = talleFiltroActivo === t;
        html += `<button class="btn btn-sm rounded-1 px-2.5 py-1 ${activo ? 'btn-dark' : 'btn-outline-dark'}" onclick="filtrarPorTalle('${t}')">${t}</button>`;
    });

    contenedorFiltros.innerHTML = html;
}

// --- FILTRADO POR TALLE DESDE LA BARRA ---
window.filtrarPorTalle = function(talleSeleccionado) {
    talleFiltroActivo = talleSeleccionado;

    // Actualizar botones de talle en la UI
    const botones = document.querySelectorAll('#filtro-talles-container .btn');
    botones.forEach(btn => {
        if (btn.innerText.trim() === talleSeleccionado) {
            btn.classList.remove('btn-outline-dark');
            btn.classList.add('btn-dark');
        } else {
            btn.classList.remove('btn-dark');
            btn.classList.add('btn-outline-dark');
        }
    });

    // Obtener los productos correspondientes a la categoría
    const base = categoriaActiva 
        ? PRODUCTOS.filter(p => p.categoria && p.categoria.toLowerCase() === categoriaActiva.toLowerCase())
        : PRODUCTOS;

    const filtrados = (talleSeleccionado === 'TODOS')
        ? base
        : base.filter(p => p.talles && p.talles.includes(talleSeleccionado));

    dibujarProductos(filtrados);
};

// --- DIBUJAR GRILLA DE PRODUCTOS (LOOK & FEEL ZARA / SAVAGE X FENTY) ---
function dibujarProductos(lista) {
    const contenedor = document.getElementById("contenedor-productos");
    if (!contenedor) return;
    contenedor.innerHTML = "";

    if (lista.length === 0) {
        contenedor.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-tag text-muted fa-2x mb-3" style="opacity: 0.4;"></i>
                <h5 class="fw-bold text-dark font-playfair">No hay modelos disponibles con este filtro</h5>
                <p class="text-muted small">Intenta seleccionando "TODOS" o explorando otra categoría.</p>
                <button class="btn btn-dark btn-sm rounded-1 px-3 mt-2" onclick="filtrarPorTalle('TODOS')">Ver Todos</button>
            </div>`;
        return;
    }

    const fragmento = document.createDocumentFragment();

    lista.forEach(p => {
        const tieneStock = p.stock !== false;
        const tallesProducto = Array.isArray(p.talles) ? p.talles : [];
        const divCol = document.createElement("div");
        divCol.className = "col-6 col-md-4 col-lg-3 d-flex align-items-stretch product-item-card";

        // Fotos para el efecto hover cross-fade (Zara / Savage X Fenty style)
        const fotos = Array.isArray(p.imagenes) && p.imagenes.length > 0 
            ? p.imagenes.map(normalizarUrlImagen) 
            : ['https://via.placeholder.com/300x400?text=My+Bella+Afrodita'];
        const fotoPrincipal = fotos[0];
        const fotoSecundaria = fotos.length > 1 ? fotos[1] : null;

        // Badge de Promoción / Urgencia
        let badgeHtml = '';
        if (p.etiqueta) {
            badgeHtml = `<span class="badge-luxury-tag">${p.etiqueta}</span>`;
        }

        // Badge de Sin Stock
        const stockBadgeHtml = !tieneStock 
            ? `<span class="badge-stock-out"><i class="fas fa-times me-0.5"></i> Agotado</span>` 
            : '';

        // Talles pequeños sutiles sobre la base de la foto
        const tallesHtml = tallesProducto.length > 0
            ? `<div class="product-sizes-overlay">
                   ${tallesProducto.slice(0, 4).map(t => `<span class="size-pill-mini">T.${t}</span>`).join('')}
                   ${tallesProducto.length > 4 ? `<span class="size-pill-mini">+${tallesProducto.length - 4}</span>` : ''}
               </div>`
            : '';

        // Bloque de Precios (Minorista destacado + Mayorista sutil)
        const wholesaleHtml = p.precioMayorista 
            ? `<span class="price-wholesale-pill" title="Llevando 3 o más prendas de la tienda">May. x3: $${Number(p.precioMayorista).toLocaleString('es-AR')}</span>`
            : '';

        divCol.innerHTML = `
            <div class="product-card-boutique w-100">
                <!-- Contenedor Imagen 3:4 con Cross-Fade -->
                <div class="product-media-container" style="cursor: zoom-in;" onclick="abrirZoomPorProducto('${p.id}')">
                    ${badgeHtml}
                    ${stockBadgeHtml}

                    <img src="${fotoPrincipal}" alt="${p.nombre}" class="img-primary" onerror="this.src='https://via.placeholder.com/300x400?text=My+Bella+Afrodita'">
                    ${fotoSecundaria ? `<img src="${fotoSecundaria}" alt="${p.nombre} dorsal" class="img-secondary">` : ''}
                    
                    ${tallesHtml}
                </div>

                <!-- Detalles del Producto y Acciones Alineadas -->
                <div class="product-info-wrap">
                    <div>
                        <div class="product-category-label">${p.categoria || 'Colección'}</div>
                        <h3 class="product-title-luxury" title="${p.nombre}">${p.nombre}</h3>
                        <p class="product-desc-clamped">${p.descripcion || 'Confección boutique de alta calidad y confort.'}</p>
                    </div>

                    <div>
                        <!-- Precios Unificados -->
                        <div class="product-pricing-box d-flex align-items-baseline">
                            <span class="price-retail-highlight">$${Number(p.precioMinorista).toLocaleString('es-AR')}</span>
                            ${wholesaleHtml}
                        </div>

                        <!-- Botones de Acción -->
                        <div class="product-card-actions">
                            <button class="btn btn-add-boutique" 
                                    ${!tieneStock ? 'disabled' : ''} 
                                    onclick="agregarAlCarrito(event, '${p.id}')">
                                <i class="fas ${tieneStock ? 'fa-shopping-bag' : 'fa-times'} me-1.5"></i>
                                ${tieneStock ? 'Añadir a la Bolsa' : 'Agotado'}
                            </button>
                            <button class="btn btn-share-boutique" onclick="compartirWhatsApp(event, '${p.id}')" title="Compartir modelo por WhatsApp">
                                <i class="fab fa-whatsapp"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;

        fragmento.appendChild(divCol);
    });

    contenedor.appendChild(fragmento);
}

// --- ZOOM DE PRODUCTO ---
window.abrirZoomPorProducto = function(id) {
    const p = PRODUCTOS.find(prod => String(prod.id) === String(id));
    if (p && Array.isArray(p.imagenes) && p.imagenes.length > 0) {
        abrirZoomLenceria(p.imagenes, 0);
    }
};

function abrirZoomLenceria(imagenes, indexInicial) {
    const modalExistente = document.getElementById("lenceria-zoom-modal");
    if (modalExistente) modalExistente.remove();

    const modal = document.createElement('div');
    modal.id = "lenceria-zoom-modal";
    Object.assign(modal.style, {
        position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.95)', zIndex: '99999', display: 'flex', flexDirection: 'column',
        touchAction: 'none'
    });

    modal.innerHTML = `
        <div style="position: absolute; top: 20px; right: 20px; z-index: 100001;">
            <button id="close-zoom" style="background: rgba(255,255,255,0.2); border: none; color: white; font-size: 1.5rem; width: 45px; height: 45px; border-radius: 50%; cursor: pointer;">&times;</button>
        </div>

        ${imagenes.length > 1 ? `
            <button id="prev-zoom" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); z-index: 100001; background: rgba(255,255,255,0.15); border: none; color: white; width: 45px; height: 45px; cursor: pointer; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-chevron-left"></i>
            </button>
            <button id="next-zoom" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); z-index: 100001; background: rgba(255,255,255,0.15); border: none; color: white; width: 45px; height: 45px; cursor: pointer; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-chevron-right"></i>
            </button>
        ` : ''}

        <div id="zoom-track" style="display: flex; height: 100%; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; scroll-behavior: smooth;">
            ${imagenes.map(src => `
                <div style="flex: 0 0 100vw; height: 100vh; scroll-snap-align: start; display: flex; align-items: center; justify-content: center; padding: 20px;">
                    <img src="${src}" style="max-width: 90%; max-height: 90%; object-fit: contain; border-radius: 6px;">
                </div>
            `).join('')}
        </div>
    `;

    document.body.appendChild(modal);
    const track = modal.querySelector('#zoom-track');
    
    setTimeout(() => {
        track.scrollLeft = window.innerWidth * indexInicial;
    }, 50);

    if (imagenes.length > 1) {
        modal.querySelector('#next-zoom').onclick = () => track.scrollLeft += window.innerWidth;
        modal.querySelector('#prev-zoom').onclick = () => track.scrollLeft -= window.innerWidth;
    }

    modal.querySelector('#close-zoom').onclick = () => modal.remove();
}

// --- COMPARTIR POR WHATSAPP ---
window.compartirWhatsApp = function (event, id) {
    if (event) event.stopPropagation();
    const p = PRODUCTOS.find(prod => String(prod.id) === String(id));
    if (!p) return;

    const precioTxt = Number(p.precioMinorista).toLocaleString('es-AR');
    const msg = `¡Mira este modelo exclusivo en My Bella Afrodita!\n*${p.nombre}*\nPrecio: $${precioTxt}\nLink: ${window.location.origin}${window.location.pathname}?id=${p.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
};

// ==========================================================================
// SLIDE-OVER CART (DRAWER LATERAL DERECHO)
// ==========================================================================

window.abrirCarritoDrawer = function () {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    if (!drawer || !overlay) return;

    renderizarListaCarrito();

    overlay.classList.add('open');
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
};

window.cerrarCarritoDrawer = function () {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-drawer-overlay');
    if (!drawer || !overlay) return;

    overlay.classList.remove('open');
    drawer.classList.remove('open');
    document.body.style.overflow = '';
};

// --- CÁLCULO DE TOTALES (EVALÚA MINORISTA VS MAYORISTA Y CALCULA AHORRO) ---
function calcularTotalCarrito() {
    let totalGeneral = 0;
    let totalBaseMinorista = 0;
    let unidadesTotales = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    let cumpleCriterioCantidad = unidadesTotales >= 3;
    let detallesPromo = [];
    let aplicoAlgunaPromocion = false;

    carrito.forEach(item => {
        const p = PRODUCTOS.find(prod => String(prod.id) === String(item.id));
        const precioMinoristaEfectivo = p ? (p.precioMinorista || p.precio) : item.precio;
        
        totalBaseMinorista += precioMinoristaEfectivo * item.cantidad;

        if (p) {
            if (cumpleCriterioCantidad && p.precioMayorista && p.precioMayorista > 0) {
                totalGeneral += p.precioMayorista * item.cantidad;
                aplicoAlgunaPromocion = true;
            } else {
                totalGeneral += precioMinoristaEfectivo * item.cantidad;
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
        ahorro: totalBaseMinorista - totalGeneral,
        promos: detallesPromo,
        esMayorista: aplicoAlgunaPromocion,
        unidades: unidadesTotales
    };
}

// --- RENDERIZAR LISTA DENTRO DEL DRAWER ---
window.renderizarListaCarrito = function () {
    const container = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    const savingsContainer = document.getElementById('ux-savings-container');
    const savingsAmount = document.getElementById('ux-savings-amount');
    const drawerBadgeCount = document.getElementById('drawer-cart-count');

    if (!container) return;

    const res = calcularTotalCarrito();
    if (drawerBadgeCount) drawerBadgeCount.innerText = res.unidades;

    actualizarBarrasProgresoUX(res.unidades, res.ahorro);

    if (carrito.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="mb-3" style="font-size: 2.2rem; opacity: 0.2; color: var(--color-pasión, #8e62a3);">
                    <i class="fas fa-shopping-bag"></i>
                </div>
                <h6 class="text-uppercase fw-normal text-muted mb-3" style="font-size: 0.78rem; letter-spacing: 1.5px;">Tu bolsa de compras está vacía</h6>
                <button class="btn btn-dark btn-sm px-4 text-uppercase" 
                        onclick="cerrarCarritoDrawer()" 
                        style="letter-spacing: 1px; font-size: 0.68rem; border-radius: 3px;">
                    Explorar Colección
                </button>
            </div>`;

        if (totalElement) totalElement.innerText = '$0';
        if (savingsContainer) savingsContainer.classList.add('d-none');
        return;
    }

    let cartHtml = '';

    carrito.forEach((item, index) => {
        const p = PRODUCTOS.find(prod => String(prod.id) === String(item.id));
        const precioAplicado = (res.esMayorista && p?.precioMayorista) ? p.precioMayorista : (p?.precioMinorista || item.precio);
        const subtotalItem = precioAplicado * item.cantidad;
        const fotoCruda = item.imagen || (p?.imagenes && p.imagenes[0]) || '';
        const fotoItem = normalizarUrlImagen(fotoCruda);

        cartHtml += `
            <div class="drawer-cart-item">
                <!-- Miniatura 3:4 -->
                <img src="${fotoItem}" alt="${item.nombre}" class="drawer-item-img">

                <!-- Info Producto -->
                <div class="flex-grow-1 ps-1">
                    <div class="drawer-item-title">${item.nombre}</div>
                    <div class="small text-muted" style="font-size: 0.7rem;">
                        $${precioAplicado.toLocaleString('es-AR')} c/u
                        ${res.esMayorista && p?.precioMayorista ? '<span class="badge bg-success ms-1" style="font-size: 0.55rem;">MAYORISTA</span>' : ''}
                    </div>

                    <div class="d-flex align-items-center justify-content-between mt-2">
                        <!-- Stepper Cantidad -->
                        <div class="drawer-qty-stepper">
                            <button type="button" class="drawer-qty-btn" onclick="cambiarCantidad(${index}, -1)" title="Restar">−</button>
                            <span class="drawer-qty-num">${item.cantidad}</span>
                            <button type="button" class="drawer-qty-btn" onclick="cambiarCantidad(${index}, 1)" title="Sumar">+</button>
                        </div>

                        <!-- Subtotal -->
                        <div class="fw-bold text-dark small">
                            $${subtotalItem.toLocaleString('es-AR')}
                        </div>
                    </div>
                </div>

                <!-- Eliminar Item -->
                <div>
                    <button class="btn btn-link text-muted p-1 border-0" onclick="eliminarDelCarrito(${index})" title="Quitar">
                        <i class="fas fa-times" style="font-size: 0.85rem;"></i>
                    </button>
                </div>
            </div>`;
    });

    container.innerHTML = cartHtml;

    if (totalElement) {
        totalElement.innerText = `$${res.total.toLocaleString('es-AR')}`;
    }

    if (savingsContainer && savingsAmount) {
        if (res.esMayorista && res.ahorro > 0) {
            savingsContainer.classList.remove('d-none');
            savingsAmount.innerText = `-$${res.ahorro.toLocaleString('es-AR')}`;
        } else {
            savingsContainer.classList.add('d-none');
        }
    }
};

// --- ACTUALIZADOR DE BARRA DE PROGRESO COMERCIAL MAYORISTA ---
function actualizarBarrasProgresoUX(unidades, ahorro) {
    const progressBarFill = document.getElementById('ux-progress-bar-fill');
    const progressText = document.getElementById('ux-progress-text');
    const progressPercent = document.getElementById('ux-progress-percent');
    
    if (!progressBarFill) return;

    if (unidades === 0) {
        progressBarFill.style.width = '0%';
        if (progressText) progressText.innerHTML = 'Agrega prendas para activar el descuento mayorista.';
        if (progressPercent) progressPercent.innerText = '0/3';
        return;
    }

    if (unidades >= 3) {
        progressBarFill.style.width = '100%';
        progressBarFill.style.backgroundColor = '#28a745';
        
        if (progressText) progressText.innerHTML = '¡Felicitaciones! Activaste el precio Mayorista 🎁';
        if (progressPercent) progressPercent.innerText = `${unidades} prendas`;
    } else {
        const faltantes = 3 - unidades;
        const porcentaje = (unidades / 3) * 100;
        
        progressBarFill.style.width = `${porcentaje}%`;
        progressBarFill.style.backgroundColor = 'var(--color-pasión, #8e62a3)';
        
        if (progressText) progressText.innerHTML = `Agrega <b>${faltantes} ${faltantes === 1 ? 'prenda' : 'prendas'}</b> más para precio Mayorista 🔥`;
        if (progressPercent) progressPercent.innerText = `${unidades}/3`;
    }
}

// --- AGREGAR AL CARRITO (DISPARA EL DRAWER SLIDE-OVER INMEDIATO) ---
window.agregarAlCarrito = function (event, id) {
    if (event) event.stopPropagation();
    const p = PRODUCTOS.find(prod => String(prod.id) === String(id));
    if (!p) return;

    const existe = carrito.find(item => String(item.id) === String(id));
    if (existe) {
        existe.cantidad++;
    } else {
        const foto = (p.imagenes && p.imagenes.length > 0) ? p.imagenes[0] : '';
        carrito.push({ id: p.id, nombre: p.nombre, precio: p.precioMinorista, imagen: foto, cantidad: 1 });
    }

    actualizarYGuardar();

    // Notificación toast boutique
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: '¡Añadido a tu bolsa!',
        text: p.nombre,
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true,
        iconColor: '#8e62a3',
        width: '320px'
    });

    // Abrir Slide-Over Drawer automáticamente
    abrirCarritoDrawer();
};

window.cambiarCantidad = function (index, valor) {
    if (carrito[index].cantidad + valor > 0) {
        carrito[index].cantidad += valor;
    } else {
        carrito.splice(index, 1);
    }
    actualizarYGuardar();
    renderizarListaCarrito();
};

window.eliminarDelCarrito = function (index) {
    carrito.splice(index, 1);
    actualizarYGuardar();
    renderizarListaCarrito();
};

window.confirmarVaciarCarrito = function () {
    if (carrito.length === 0) return;

    Swal.fire({
        title: '¿Vaciar tu bolsa?',
        text: "Se quitarán todos los artículos seleccionados hasta el momento.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#1a1a1a',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, vaciar bolsa',
        cancelButtonText: 'Cancelar',
        borderRadius: '0'
    }).then((result) => {
        if (result.isConfirmed) {
            carrito = [];
            actualizarYGuardar();
            renderizarListaCarrito();
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
    
    const ocultarFalta = totalUnidades === 0;
    contador.style.display = ocultarFalta ? 'none' : 'flex';

    const { esMayorista } = calcularTotalCarrito();
    if (esMayorista) {
        contador.style.backgroundColor = "#28a745";
    } else {
        contador.style.backgroundColor = "#1a1a1a";
    }
}

// --- CHECKOUT DIRECTO A TRAVÉS DE LA API Y WHATSAPP ---
async function enviarPedidoWhatsApp() {
    if (!carrito || carrito.length === 0) {
        Swal.fire({
            title: "Bolsa vacía", 
            text: "Por favor selecciona al menos una prenda antes de finalizar.", 
            icon: "warning",
            confirmButtonColor: '#1a1a1a'
        });
        return;
    }

    cerrarCarritoDrawer();

    const { value: formValues } = await Swal.fire({
        title: 'Finalizar Pedido',
        html: `
            <div class="text-start">
                <p class="text-muted small mb-3">Ingresa tus datos para registrar la orden en el sistema y continuar la atención por WhatsApp.</p>
                <div class="mb-2">
                    <label class="form-label small fw-bold">Nombre y Apellido *</label>
                    <input type="text" id="swal-cliente-nombre" class="form-control" placeholder="Ej: Valentina Gómez">
                </div>
                <div class="mb-2">
                    <label class="form-label small fw-bold">Teléfono / WhatsApp *</label>
                    <input type="tel" id="swal-cliente-telefono" class="form-control" placeholder="Ej: 264 555-1234">
                </div>
                <div class="mb-2">
                    <label class="form-label small fw-bold">Dirección de Entrega (Opcional)</label>
                    <input type="text" id="swal-cliente-direccion" class="form-control" placeholder="Ej: Rivadavia, San Juan">
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: '<i class="fab fa-whatsapp me-1"></i> Confirmar Pedido',
        cancelButtonText: 'Volver a la bolsa',
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#777',
        didOpen: () => {
            const input = document.getElementById('swal-cliente-nombre');
            if (input) input.focus();
        },
        preConfirm: () => {
            const nombre = document.getElementById('swal-cliente-nombre')?.value.trim();
            const telefono = document.getElementById('swal-cliente-telefono')?.value.trim();
            const direccion = document.getElementById('swal-cliente-direccion')?.value.trim();

            if (!nombre) {
                Swal.showValidationMessage('¡Por favor ingresa tu nombre completo!');
                return false;
            }
            if (!telefono) {
                Swal.showValidationMessage('¡Ingresa tu número de teléfono para contactarte!');
                return false;
            }

            return { nombre, telefono, direccion };
        }
    });

    if (!formValues) {
        abrirCarritoDrawer();
        return;
    }

    Swal.fire({
        title: 'Registrando tu orden...',
        text: 'Generando código de seguimiento oficial',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const payload = {
            clienteNombre: formValues.nombre,
            clienteTelefono: formValues.telefono,
            clienteDireccion: formValues.direccion || null,
            items: carrito.map(item => ({
                productoId: Number(item.id),
                talle: item.talle || 'Único',
                cantidad: Number(item.cantidad) || 1
            }))
        };

        const res = await fetch('/api/ordenes/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || `HTTP ${res.status}`);
        }

        const ordenResponse = await res.json();

        // Vaciar la bolsa local una vez persistida la orden en MySQL
        carrito = [];
        actualizarYGuardar();
        renderizarListaCarrito();

        Swal.fire({
            icon: 'success',
            title: '¡Orden Creada con Éxito!',
            html: `Número de seguimiento: <b class="text-dark">#${ordenResponse.codigoSeguimiento}</b><br><small class="text-muted">Total: $${Number(ordenResponse.total).toLocaleString('es-AR')}</small><br><br>Abriendo WhatsApp para coordinar el pago y envío...`,
            showConfirmButton: true,
            confirmButtonText: 'Abrir WhatsApp',
            confirmButtonColor: '#28a745',
            timer: 3000
        }).then(() => {
            if (ordenResponse.whatsappUrl) {
                window.open(ordenResponse.whatsappUrl, '_blank');
            }
        });

        if (ordenResponse.whatsappUrl) {
            window.open(ordenResponse.whatsappUrl, '_blank');
        }

    } catch (error) {
        console.error("Error en checkout de orden:", error);
        Swal.fire({
            icon: 'error',
            title: 'No se pudo registrar la orden',
            text: error.message || 'Ocurrió un error al conectar con el servidor. Intenta de nuevo.',
            confirmButtonColor: '#1a1a1a'
        }).then(() => {
            abrirCarritoDrawer();
        });
    }
}