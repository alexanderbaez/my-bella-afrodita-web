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
let busquedaCatalogo = '';
let ordenCatalogo = 'destacados';
let esAdminActivo = false;
let datosAdmin = null;
let modalQuickViewInstancia = null;
let talleSeleccionadoQuickView = null;
let cantidadQuickView = 1;
const talleSeleccionadoPorProducto = {};

// --- MÓDULO DE LOGÍSTICA & SELECCIÓN DE ENTREGA ---
let TIPO_ENTREGA_SELECCIONADO = 'RETIRO_SHOWROOM';
const COSTOS_ENVIO = {
    RETIRO_SHOWROOM: 0,
    ENVIO_SAN_JUAN: 2500,
    ENVIO_NACIONAL: 6500
};

window.navegarAProducto = function (id) {
    if (!id) return;
    window.location.href = `./producto.html?id=${id}`;
};

window.abrirCentroConfianza = function (tabName) {
    const modalEl = document.getElementById('modalCentroConfianza');
    if (modalEl) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
        if (tabName) {
            const trigger = document.getElementById(`tab-${tabName}-btn`);
            if (trigger) {
                bootstrap.Tab.getOrCreateInstance(trigger).show();
            }
        }
    }
};

window.abrirGuiaMedidas = function () {
    const modalEl = document.getElementById('modalGuiaMedidas');
    if (modalEl) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    }
};

window.cambiarMetodoEntrega = function (tipo) {
    if (!COSTOS_ENVIO.hasOwnProperty(tipo)) return;
    TIPO_ENTREGA_SELECCIONADO = tipo;

    const radios = document.querySelectorAll('input[name="radioEntrega"]');
    radios.forEach(r => {
        r.checked = (r.value === tipo);
    });

    const cards = [
        { id: 'card-ship-showroom', tipo: 'RETIRO_SHOWROOM' },
        { id: 'card-ship-sanjuan', tipo: 'ENVIO_SAN_JUAN' },
        { id: 'card-ship-nacional', tipo: 'ENVIO_NACIONAL' }
    ];
    cards.forEach(c => {
        const el = document.getElementById(c.id);
        if (el) {
            if (c.tipo === tipo) el.classList.add('active');
            else el.classList.remove('active');
        }
    });

    renderizarListaCarrito();
};

document.addEventListener('DOMContentLoaded', async () => {
    actualizarContadorUI();
    iniciarRotadorAnuncios();
    verificarAdminEnTienda();

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
            actualizarFiltrosTallesContextuales(catNorm);
            aplicarFiltrosYOrdenCatalogo();
        } else {
            if (tituloSeccion) tituloSeccion.innerText = "Nuestro Catálogo Completo";
            actualizarFiltrosTallesContextuales(null);
            aplicarFiltrosYOrdenCatalogo();
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

    let html = `<button class="filter-pill-luxury ${talleFiltroActivo === 'TODOS' ? 'active' : ''}" onclick="filtrarPorTalle('TODOS')">TODOS</button>`;

    tallesOrdenados.forEach(t => {
        const activo = talleFiltroActivo === t;
        html += `<button class="filter-pill-luxury ${activo ? 'active' : ''}" onclick="filtrarPorTalle('${t}')">${t}</button>`;
    });

    contenedorFiltros.innerHTML = html;

    // Sincronizar estilo activo de las píldoras de categoría en productos.html
    ['todos', 'conjuntos', 'bombachas', 'hombres', 'medias'].forEach(catId => {
        const chip = document.getElementById(`chip-cat-${catId}`);
        if (chip) {
            if ((!categoria && catId === 'todos') || (categoria && categoria.toLowerCase() === catId)) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        }
    });
}

// --- FILTRADO POR TALLE DESDE LA BARRA ---
window.filtrarPorTalle = function(talleSeleccionado) {
    talleFiltroActivo = talleSeleccionado;

    // Actualizar botones de talle en la UI
    const botones = document.querySelectorAll('#filtro-talles-container .filter-pill-luxury, #filtro-talles-container .btn');
    botones.forEach(btn => {
        if (btn.innerText.trim() === talleSeleccionado) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    aplicarFiltrosYOrdenCatalogo();
};

// --- CONTROL DE BÚSQUEDA Y ORDENAMIENTO EN VIVO ---
window.manejarBusquedaCatalogo = function (valor) {
    busquedaCatalogo = (valor || '').trim().toLowerCase();
    const btnLimpiar = document.getElementById('btn-limpiar-busqueda');
    if (btnLimpiar) {
        if (busquedaCatalogo.length > 0) {
            btnLimpiar.classList.remove('d-none');
        } else {
            btnLimpiar.classList.add('d-none');
        }
    }
    aplicarFiltrosYOrdenCatalogo();
};

window.limpiarBusquedaCatalogo = function () {
    const input = document.getElementById('buscador-catalogo');
    if (input) input.value = '';
    busquedaCatalogo = '';
    const btnLimpiar = document.getElementById('btn-limpiar-busqueda');
    if (btnLimpiar) btnLimpiar.classList.add('d-none');
    aplicarFiltrosYOrdenCatalogo();
};

window.manejarOrdenamientoCatalogo = function (criterio) {
    ordenCatalogo = criterio;
    aplicarFiltrosYOrdenCatalogo();
};

function aplicarFiltrosYOrdenCatalogo() {
    // 1. Filtrar por categoría activa (si existe en URL)
    let resultado = categoriaActiva 
        ? PRODUCTOS.filter(p => p.categoria && p.categoria.toLowerCase() === categoriaActiva.toLowerCase())
        : [...PRODUCTOS];

    // 2. Filtrar por talle activo
    if (talleFiltroActivo && talleFiltroActivo !== 'TODOS') {
        resultado = resultado.filter(p => {
            const coincideTalleArray = Array.isArray(p.talles) && p.talles.includes(talleFiltroActivo);
            const coincideVariante = Array.isArray(p.variantes) && p.variantes.some(v => v.talle === talleFiltroActivo && (v.stock || 0) > 0);
            return coincideTalleArray || coincideVariante;
        });
    }

    // 3. Filtrar reactivamente por búsqueda de texto (nombre o descripción)
    if (busquedaCatalogo) {
        resultado = resultado.filter(p => {
            const nom = (p.nombre || '').toLowerCase();
            const desc = (p.descripcion || '').toLowerCase();
            return nom.includes(busquedaCatalogo) || desc.includes(busquedaCatalogo);
        });
    }

    // 4. Ordenamiento reactivo
    if (ordenCatalogo === 'precio-asc') {
        resultado.sort((a, b) => (Number(a.precioMinorista) || 0) - (Number(b.precioMinorista) || 0));
    } else if (ordenCatalogo === 'precio-desc') {
        resultado.sort((a, b) => (Number(b.precioMinorista) || 0) - (Number(a.precioMinorista) || 0));
    } else if (ordenCatalogo === 'alfabetico') {
        resultado.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    } else {
        // "destacados": prioriza prendas con etiqueta (MÁS VENDIDO, OFERTA, NUEVO, etc.) y luego por ID
        resultado.sort((a, b) => {
            const tieneTagA = Boolean(a.etiqueta);
            const tieneTagB = Boolean(b.etiqueta);
            if (tieneTagA && !tieneTagB) return -1;
            if (!tieneTagA && tieneTagB) return 1;
            return (b.id || 0) - (a.id || 0);
        });
    }

    dibujarProductos(resultado);
}

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
        const variantes = Array.isArray(p.variantes) ? p.variantes : [];
        const stockTotal = variantes.length > 0
            ? variantes.reduce((acc, v) => acc + (v.stock || 0), 0)
            : (p.stock !== false ? 1 : 0);
        const tieneStock = p.stock !== false && (variantes.length === 0 || stockTotal > 0);
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

        // Talles sobre la base de la foto (con indicación de agotado si corresponde)
        const tallesHtml = variantes.length > 0
            ? `<div class="product-sizes-overlay">
                   ${variantes.slice(0, 4).map(v => `<span class="size-pill-mini ${(v.stock || 0) <= 0 ? 'agotado' : ''}">T.${v.talle}</span>`).join('')}
                   ${variantes.length > 4 ? `<span class="size-pill-mini">+${variantes.length - 4}</span>` : ''}
               </div>`
            : (tallesProducto.length > 0
                ? `<div class="product-sizes-overlay">
                       ${tallesProducto.slice(0, 4).map(t => `<span class="size-pill-mini">T.${t}</span>`).join('')}
                       ${tallesProducto.length > 4 ? `<span class="size-pill-mini">+${tallesProducto.length - 4}</span>` : ''}
                   </div>`
                : '');

        // Selector Interactivo de Talles en Ficha
        let selectorTallesHtml = '';
        if (variantes.length > 0) {
            if (!talleSeleccionadoPorProducto[p.id]) {
                const primerDisponible = variantes.find(v => (v.stock || 0) > 0);
                talleSeleccionadoPorProducto[p.id] = primerDisponible ? primerDisponible.talle : variantes[0].talle;
            }
            const talleActivo = talleSeleccionadoPorProducto[p.id];
            const varianteActiva = variantes.find(v => v.talle === talleActivo);
            const stockActivo = varianteActiva ? (varianteActiva.stock || 0) : 0;
            const stockAlerta = stockActivo > 0 && stockActivo <= 2 
                ? `<span class="badge bg-warning text-dark ms-1" style="font-size:0.55rem;">¡Últimas ${stockActivo}!</span>` 
                : '';

            selectorTallesHtml = `
                <div class="product-size-selector-wrap">
                    <div class="product-size-label">
                        <span>Talle:</span>
                        <span id="stock-indicador-${p.id}">${stockAlerta}</span>
                    </div>
                    <div class="product-size-chips" id="chips-talle-${p.id}">
                        ${variantes.map(v => {
                            const agotado = (v.stock || 0) <= 0;
                            const esActivo = !agotado && v.talle === talleActivo;
                            return `
                                <button type="button" 
                                        class="btn-talle-select ${agotado ? 'disabled out-of-stock' : ''} ${esActivo ? 'active' : ''}" 
                                        data-prod-id="${p.id}" 
                                        data-talle="${v.talle}" 
                                        data-stock="${v.stock || 0}" 
                                        ${agotado ? 'disabled title="Talle agotado"' : `title="${v.stock} disponibles"`} 
                                        onclick="seleccionarTalleEnCard('${p.id}', '${v.talle}', ${v.stock || 0}, event)">
                                    ${v.talle}
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>`;
        }

        // Bloque de Precios (Minorista destacado + Mayorista sutil en tono oro viejo)
        const wholesaleHtml = p.precioMayorista 
            ? `<span class="price-wholesale-pill" title="Llevando 3 o más prendas de la tienda">Mayorista x3: $${Number(p.precioMayorista).toLocaleString('es-AR')}</span>`
            : '';

        // Botón flotante para edición directa en Admin (solo visible si es ROLE_ADMIN)
        const adminBtnHtml = esAdminActivo
            ? `<a href="/admin.html?editProduct=${p.id}" class="btn-quick-admin-edit" title="Editar prenda en Backoffice" onclick="event.stopPropagation()">
                   <i class="fas fa-pencil-alt me-1"></i>Editar
               </a>`
            : '';

        divCol.innerHTML = `
            <div class="product-card-boutique w-100">
                <!-- Contenedor Imagen 3:4 con Cross-Fade y Navegación limpia al detalle -->
                <div class="product-media-container position-relative" style="cursor: pointer;" onclick="navegarAProducto('${p.id}')">
                    ${adminBtnHtml}
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
                        <h3 class="product-title-luxury" title="${p.nombre}" style="cursor: pointer;" onclick="navegarAProducto('${p.id}')">${p.nombre}</h3>
                        <p class="product-desc-clamped">${p.descripcion || 'Confección boutique de alta calidad y confort.'}</p>
                    </div>

                    <div>
                        ${selectorTallesHtml}

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

window.seleccionarTalleEnCard = function(prodId, talle, stock, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    if (stock <= 0) return;
    talleSeleccionadoPorProducto[prodId] = talle;

    const container = document.getElementById(`chips-talle-${prodId}`);
    if (container) {
        container.querySelectorAll('.btn-talle-select').forEach(btn => {
            if (btn.getAttribute('data-talle') === talle) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    const indicador = document.getElementById(`stock-indicador-${prodId}`);
    if (indicador) {
        if (stock <= 2 && stock > 0) {
            indicador.innerHTML = `<span class="badge bg-warning text-dark" style="font-size:0.55rem;">¡Últimas ${stock}!</span>`;
        } else {
            indicador.innerHTML = '';
        }
    }
};

// ==========================================================================
// BARRA DE ANUNCIOS PROMOCIONALES (ROTADOR SUAVE)
// ==========================================================================
function iniciarRotadorAnuncios() {
    const mensajes = document.querySelectorAll('.promo-announcement-bar .promo-text');
    if (!mensajes || mensajes.length === 0) return;
    let indiceActual = 0;

    setInterval(() => {
        mensajes[indiceActual].classList.remove('active');
        indiceActual = (indiceActual + 1) % mensajes.length;
        mensajes[indiceActual].classList.add('active');
    }, 4500);
}

// ==========================================================================
// BARRA DE HERRAMIENTAS DE ADMINISTRADOR EN TIENDA (ADMIN QUICK BAR)
// ==========================================================================
async function verificarAdminEnTienda() {
    try {
        const res = await fetch('/api/auth/status', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.authenticated && data.rol === 'ROLE_ADMIN') {
            esAdminActivo = true;
            datosAdmin = data;
            renderizarAdminQuickBar(data);
            // Re-renderizamos para inyectar los botones de "✏️ Editar" en los productos
            if (PRODUCTOS.length > 0) {
                aplicarFiltrosYOrdenCatalogo();
            }
        }
    } catch (e) {
        // Visitante normal o no autenticado
    }
}

function renderizarAdminQuickBar(data) {
    const mount = document.getElementById('admin-quickbar-mount');
    const barHtml = `
        <div class="admin-top-bar" id="admin-top-bar-injected">
            <div class="container d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-2">
                    <span class="admin-badge-live">
                        <i class="fas fa-user-shield me-1"></i>MODO ADMINISTRADOR ACTIVO
                    </span>
                    <span class="small text-white-50 d-none d-md-inline" style="font-size: 0.72rem;">
                        ${data.email || 'lopezandre26@gmail.com'}
                    </span>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <a href="/admin.html" class="btn-admin-nav" title="Volver al panel administrativo">
                        <i class="fas fa-cog me-1"></i>Volver al Panel de Control
                    </a>
                    <button type="button" class="btn-admin-logout" onclick="cerrarSesionAdminDesdeTienda()" title="Cerrar sesión de administrador">
                        <i class="fas fa-sign-out-alt me-1"></i>Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    `;

    if (mount) {
        mount.innerHTML = barHtml;
    } else {
        const div = document.createElement('div');
        div.innerHTML = barHtml;
        document.body.prepend(div.firstElementChild);
    }
}

window.cerrarSesionAdminDesdeTienda = async function () {
    try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {}
    sessionStorage.removeItem('myBellaAdminUser');
    localStorage.removeItem('myBellaAdminUser');
    window.location.reload();
};

// ==========================================================================
// MODAL QUICK VIEW EDITORIAL CON GUÍA DE MEDIDAS (LOOK & FEEL BOUTIQUE)
// ==========================================================================
window.abrirQuickView = function (id) {
    const p = PRODUCTOS.find(prod => String(prod.id) === String(id));
    if (!p) return;

    let modalElem = document.getElementById('modalQuickView');
    if (!modalElem) {
        modalElem = document.createElement('div');
        modalElem.className = 'modal fade';
        modalElem.id = 'modalQuickView';
        modalElem.tabIndex = -1;
        modalElem.innerHTML = `
            <div class="modal-dialog modal-dialog-centered modal-quickview-dialog">
                <div class="modal-content border-0 shadow-lg" style="border-radius: 12px; overflow: hidden; background: #fff;">
                    <div class="modal-header border-0 pb-0 pt-3 pe-3 justify-content-end">
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body p-4 pt-1" id="modal-quickview-content"></div>
                </div>
            </div>`;
        document.body.appendChild(modalElem);
    }

    if (!modalQuickViewInstancia) {
        modalQuickViewInstancia = new bootstrap.Modal(modalElem);
    }

    const modalContent = document.getElementById('modal-quickview-content');
    if (!modalContent) return;

    const fotos = Array.isArray(p.imagenes) && p.imagenes.length > 0 
        ? p.imagenes.map(normalizarUrlImagen) 
        : ['https://via.placeholder.com/300x400?text=My+Bella+Afrodita'];
    const fotoPrincipal = fotos[0];

    const variantes = Array.isArray(p.variantes) ? p.variantes : [];
    const stockTotal = variantes.length > 0
        ? variantes.reduce((acc, v) => acc + (v.stock || 0), 0)
        : (p.stock !== false ? 1 : 0);
    const tieneStock = p.stock !== false && (variantes.length === 0 || stockTotal > 0);

    if (variantes.length > 0) {
        const primeroDisponible = variantes.find(v => (v.stock || 0) > 0);
        talleSeleccionadoQuickView = primeroDisponible ? primeroDisponible.talle : variantes[0].talle;
    } else if (Array.isArray(p.talles) && p.talles.length > 0) {
        talleSeleccionadoQuickView = p.talles[0];
    } else {
        talleSeleccionadoQuickView = null;
    }

    cantidadQuickView = 1;

    const thumbsHtml = fotos.length > 1 ? `
        <div class="quickview-thumbs-track mt-2">
            ${fotos.map((src, idx) => `
                <img src="${src}" class="quickview-thumb-item ${idx === 0 ? 'active' : ''}" 
                     alt="Foto ${idx + 1}" 
                     onclick="cambiarFotoQuickView('${src}', this)">
            `).join('')}
        </div>
    ` : '';

    const tallesChipsHtml = variantes.length > 0 ? `
        <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center mb-1.5">
                <span class="small fw-bold text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.5px;">Seleccionar Talle:</span>
                <button type="button" class="btn-tab-guide" onclick="toggleGuiaTallesModal()">
                    <i class="fas fa-ruler-combined me-1"></i>Guía de Talles (cm)
                </button>
            </div>
            <div class="d-flex flex-wrap gap-2" id="quickview-talles-chips">
                ${variantes.map(v => {
                    const agotado = (v.stock || 0) <= 0;
                    const esActivo = !agotado && v.talle === talleSeleccionadoQuickView;
                    return `
                        <button type="button" 
                                class="btn-talle-select ${agotado ? 'disabled out-of-stock' : ''} ${esActivo ? 'active' : ''}" 
                                ${agotado ? 'disabled title="Agotado"' : `title="${v.stock} disponibles"`} 
                                onclick="seleccionarTalleQuickView('${v.talle}', ${v.stock || 0}, this)">
                            ${v.talle}
                        </button>
                    `;
                }).join('')}
            </div>
            <div id="quickview-stock-feedback" class="mt-1 small text-muted" style="font-size: 0.72rem;"></div>
        </div>
    ` : (Array.isArray(p.talles) && p.talles.length > 0 ? `
        <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center mb-1.5">
                <span class="small fw-bold text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.5px;">Talles Disponibles:</span>
                <button type="button" class="btn-tab-guide" onclick="toggleGuiaTallesModal()">
                    <i class="fas fa-ruler-combined me-1"></i>Guía de Talles (cm)
                </button>
            </div>
            <div class="d-flex flex-wrap gap-2">
                ${p.talles.map(t => `<span class="badge bg-light text-dark border px-2.5 py-1.5">${t}</span>`).join('')}
            </div>
        </div>
    ` : '');

    const badgePromoHtml = p.etiqueta ? `<span class="badge bg-dark text-white px-2 py-1 mb-2" style="font-size: 0.65rem; letter-spacing: 1px;">${p.etiqueta}</span>` : '';

    const wholesaleHtml = p.precioMayorista ? `
        <div class="p-2.5 rounded bg-light border mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <span class="small fw-bold text-success" style="font-size: 0.75rem;">
                    <i class="fas fa-tag me-1"></i>Precio Mayorista (3+ prendas):
                </span>
                <span class="fw-bold text-dark h6 mb-0">$${Number(p.precioMayorista).toLocaleString('es-AR')}</span>
            </div>
            <small class="text-muted d-block" style="font-size: 0.68rem;">Combina libremente prendas de cualquier categoría en tu carrito.</small>
        </div>
    ` : '';

    modalContent.innerHTML = `
        <div class="row g-4 align-items-start">
            <!-- Galería de Fotos -->
            <div class="col-md-6 text-center">
                <img id="quickview-img-display" src="${fotoPrincipal}" alt="${p.nombre}" class="quickview-img-main">
                ${thumbsHtml}
            </div>

            <!-- Ficha Técnica & Compra Rápida -->
            <div class="col-md-6">
                <div class="text-uppercase small fw-bold text-muted mb-1" style="font-size: 0.7rem; letter-spacing: 1.5px;">${p.categoria || 'Lencería Boutique'}</div>
                <h2 class="font-playfair fw-bold text-dark mb-2" style="font-size: 1.45rem;">${p.nombre}</h2>
                ${badgePromoHtml}

                <div class="d-flex align-items-baseline gap-2 mb-3">
                    <span class="h3 fw-bold mb-0" style="color: var(--color-pasión, #8e62a3);">$${Number(p.precioMinorista).toLocaleString('es-AR')}</span>
                    <span class="text-muted small">Minorista</span>
                </div>

                ${wholesaleHtml}

                <p class="text-muted small mb-3" style="line-height: 1.5; font-size: 0.8rem;">
                    ${p.descripcion || 'Confección boutique de alta calidad y diseño pensado para realzar tu belleza con el máximo confort.'}
                </p>

                ${tallesChipsHtml}

                <!-- Tabla Colapsable de Guía de Medidas (cm) -->
                <div id="quickview-guia-talles-collapse" class="d-none mb-3 p-3 bg-light rounded border">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="small fw-bold text-dark" style="font-size: 0.75rem;">
                            <i class="fas fa-ruler me-1" style="color: var(--color-pasión, #8e62a3);"></i> Tabla de Medidas Corporales (cm)
                        </span>
                        <button type="button" class="btn-close btn-sm" style="font-size: 0.6rem;" onclick="toggleGuiaTallesModal()"></button>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-sm table-bordered text-center table-size-guide mb-1 bg-white">
                            <thead>
                                <tr>
                                    <th>Talle</th>
                                    <th>Busto</th>
                                    <th>Bajo Busto</th>
                                    <th>Cadera</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td><strong>85 / 1 / S</strong></td><td>83 - 87 cm</td><td>68 - 72 cm</td><td>88 - 92 cm</td></tr>
                                <tr><td><strong>90 / 2 / M</strong></td><td>88 - 92 cm</td><td>73 - 77 cm</td><td>93 - 97 cm</td></tr>
                                <tr><td><strong>95 / 3 / L</strong></td><td>93 - 97 cm</td><td>78 - 82 cm</td><td>98 - 102 cm</td></tr>
                                <tr><td><strong>100 / 4 / XL</strong></td><td>98 - 102 cm</td><td>83 - 87 cm</td><td>103 - 108 cm</td></tr>
                                <tr><td><strong>105 / XXL</strong></td><td>103 - 108 cm</td><td>88 - 93 cm</td><td>109 - 114 cm</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="text-muted" style="font-size: 0.68rem;">* Medidas de referencia para calce exacto. Si dudas entre dos talles, te sugerimos elegir el mayor.</div>
                </div>

                <!-- Selector de Cantidad y Botón Añadir a la Bolsa -->
                <div class="d-flex gap-2 align-items-center pt-2">
                    <div class="d-flex align-items-center border rounded" style="background: #fff; height: 42px;">
                        <button type="button" class="btn btn-sm btn-link text-dark px-2.5 text-decoration-none fw-bold" onclick="modificarCantidadQuickView(-1)">−</button>
                        <span id="quickview-cant-display" class="px-2 fw-bold" style="font-size: 0.85rem; min-width: 28px; text-align: center;">1</span>
                        <button type="button" class="btn btn-sm btn-link text-dark px-2.5 text-decoration-none fw-bold" onclick="modificarCantidadQuickView(1)">+</button>
                    </div>

                    <button class="btn btn-dark w-100 fw-bold shadow-sm" style="height: 42px; font-size: 0.85rem; border-radius: 6px;" 
                            ${!tieneStock ? 'disabled' : ''} 
                            onclick="agregarAlCarritoDesdeQuickView('${p.id}')">
                        <i class="fas ${tieneStock ? 'fa-shopping-bag' : 'fa-times'} me-1.5"></i>
                        ${tieneStock ? 'Añadir a la Bolsa' : 'Agotado'}
                    </button>
                </div>

                <!-- Enlace de consulta directa por WhatsApp -->
                <div class="mt-3 text-center">
                    <a href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola! Quisiera consultar sobre el modelo ' + p.nombre + (talleSeleccionadoQuickView ? ' en talle ' + talleSeleccionadoQuickView : ''))}" 
                       target="_blank" class="small text-success text-decoration-none fw-semibold" style="font-size: 0.75rem;">
                        <i class="fab fa-whatsapp me-1"></i>¿Dudas con tu talle? Te asesoramos en vivo por WhatsApp
                    </a>
                </div>
            </div>
        </div>
    `;

    actualizarFeedbackStockQuickView(p);
    modalQuickViewInstancia.show();
};

window.cambiarFotoQuickView = function (src, thumbElem) {
    const mainImg = document.getElementById('quickview-img-display');
    if (mainImg) mainImg.src = src;

    document.querySelectorAll('.quickview-thumb-item').forEach(el => el.classList.remove('active'));
    if (thumbElem) thumbElem.classList.add('active');
};

window.seleccionarTalleQuickView = function (talle, stock, btnElem) {
    if (stock <= 0) return;
    talleSeleccionadoQuickView = talle;

    const container = document.getElementById('quickview-talles-chips');
    if (container) {
        container.querySelectorAll('.btn-talle-select').forEach(el => el.classList.remove('active'));
    }
    if (btnElem) btnElem.classList.add('active');

    const feedback = document.getElementById('quickview-stock-feedback');
    if (feedback) {
        if (stock <= 2) {
            feedback.innerHTML = `<span class="badge bg-warning text-dark"><i class="fas fa-exclamation-triangle me-1"></i>¡Últimas ${stock} unidades disponibles en talle ${talle}!</span>`;
        } else {
            feedback.innerHTML = `<span class="text-success"><i class="fas fa-check-circle me-1"></i>Stock disponible (${stock} unidades).</span>`;
        }
    }
};

function actualizarFeedbackStockQuickView(p) {
    const feedback = document.getElementById('quickview-stock-feedback');
    if (!feedback) return;
    if (Array.isArray(p.variantes) && p.variantes.length > 0 && talleSeleccionadoQuickView) {
        const v = p.variantes.find(item => item.talle === talleSeleccionadoQuickView);
        const stock = v ? (v.stock || 0) : 0;
        if (stock <= 2 && stock > 0) {
            feedback.innerHTML = `<span class="badge bg-warning text-dark"><i class="fas fa-exclamation-triangle me-1"></i>¡Últimas ${stock} unidades disponibles en talle ${talleSeleccionadoQuickView}!</span>`;
        } else if (stock > 2) {
            feedback.innerHTML = `<span class="text-success"><i class="fas fa-check-circle me-1"></i>Stock disponible (${stock} unidades).</span>`;
        }
    }
}

window.toggleGuiaTallesModal = function () {
    const guia = document.getElementById('quickview-guia-talles-collapse');
    if (guia) {
        guia.classList.toggle('d-none');
    }
};

window.modificarCantidadQuickView = function (delta) {
    cantidadQuickView = Math.max(1, cantidadQuickView + delta);
    const display = document.getElementById('quickview-cant-display');
    if (display) display.innerText = cantidadQuickView;
};

window.agregarAlCarritoDesdeQuickView = function (id) {
    agregarAlCarrito(null, id, talleSeleccionadoQuickView, cantidadQuickView);
    if (modalQuickViewInstancia) {
        modalQuickViewInstancia.hide();
    }
};

// --- ZOOM DE PRODUCTO (COMPATIBILIDAD) ---
window.abrirZoomPorProducto = function(id) {
    abrirQuickView(id);
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
                        ${item.talle ? `<span class="badge bg-light text-dark border me-1">Talle ${item.talle}</span>` : ''}
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

    // Cálculo del Costo de Envío y Total Final
    const costoEnvio = COSTOS_ENVIO[TIPO_ENTREGA_SELECCIONADO] || 0;
    const totalConEnvio = res.total + costoEnvio;

    const subtotalEl = document.getElementById('drawer-subtotal');
    if (subtotalEl) {
        subtotalEl.innerText = `$${res.total.toLocaleString('es-AR')}`;
    }

    const shippingCostEl = document.getElementById('drawer-shipping-cost');
    const shippingBadgeEl = document.getElementById('drawer-shipping-badge');
    if (shippingCostEl) {
        if (costoEnvio === 0) {
            shippingCostEl.innerText = 'Gratis';
            shippingCostEl.className = 'fw-semibold text-success';
        } else {
            shippingCostEl.innerText = `+$${costoEnvio.toLocaleString('es-AR')}`;
            shippingCostEl.className = 'fw-bold text-dark';
        }
    }
    if (shippingBadgeEl) {
        if (TIPO_ENTREGA_SELECCIONADO === 'RETIRO_SHOWROOM') {
            shippingBadgeEl.innerText = '¡Gratis!';
            shippingBadgeEl.className = 'badge-free-shipping';
        } else if (TIPO_ENTREGA_SELECCIONADO === 'ENVIO_SAN_JUAN') {
            shippingBadgeEl.innerText = 'San Juan';
            shippingBadgeEl.className = 'badge bg-warning text-dark';
        } else {
            shippingBadgeEl.innerText = 'Nacional';
            shippingBadgeEl.className = 'badge bg-dark text-white';
        }
    }

    if (totalElement) {
        totalElement.innerText = `$${totalConEnvio.toLocaleString('es-AR')}`;
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

// --- ACTUALIZADOR DE BARRA DE PROGRESO COMERCIAL MAYORISTA CON MICRO-ANIMACIÓN ---
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
        progressBarFill.style.background = 'linear-gradient(90deg, #C5A880, #D4AF37, #C5A880)';
        
        if (progressText) progressText.innerHTML = '🎉 ¡Felicitaciones! Acceso Mayorista Activado en tu bolsa ✨';
        if (progressPercent) progressPercent.innerText = `${unidades} prendas`;
    } else {
        const faltantes = 3 - unidades;
        const porcentaje = (unidades / 3) * 100;
        
        progressBarFill.style.width = `${porcentaje}%`;
        progressBarFill.style.background = 'linear-gradient(90deg, #C5A880, #D4AF37, #C5A880)';
        
        if (faltantes === 1) {
            if (progressText) progressText.innerHTML = `⚡ ¡Estás a <b>1 sola prenda</b> de activar el Descuento Mayorista!`;
        } else {
            if (progressText) progressText.innerHTML = `🔥 Te ${faltantes === 1 ? 'falta' : 'faltan'} <b>${faltantes} prendas</b> para tarifa mayorista`;
        }
        if (progressPercent) progressPercent.innerText = `${unidades}/3`;
    }
}

// --- AGREGAR AL CARRITO (DISPARA EL DRAWER SLIDE-OVER INMEDIATO) ---
window.agregarAlCarrito = function (event, id, talleForzado = null, cantidadToAdd = 1) {
    if (event) event.stopPropagation();
    const p = PRODUCTOS.find(prod => String(prod.id) === String(id));
    if (!p) return;

    const variantes = Array.isArray(p.variantes) ? p.variantes : [];
    let talleElegido = 'Único';
    let maxStock = 999;

    if (talleForzado) {
        talleElegido = talleForzado;
        if (variantes.length > 0) {
            const v = variantes.find(item => item.talle === talleForzado);
            maxStock = v ? (v.stock || 0) : 999;
        }
    } else if (variantes.length > 0) {
        let talleSel = talleSeleccionadoPorProducto[p.id];
        let variante = variantes.find(v => v.talle === talleSel);
        
        // Si no hay variante seleccionada o la seleccionada no tiene stock, buscar la primera con stock
        if (!variante || (variante.stock || 0) <= 0) {
            variante = variantes.find(v => (v.stock || 0) > 0);
        }

        if (!variante || (variante.stock || 0) <= 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Talle Agotado',
                text: 'Lo sentimos, este modelo no cuenta con stock disponible en este momento.',
                confirmButtonColor: '#1a1a1a'
            });
            return;
        }

        talleElegido = variante.talle;
        maxStock = variante.stock;
    } else {
        if (p.stock === false) {
            Swal.fire({
                icon: 'warning',
                title: 'Agotado',
                text: 'Este producto se encuentra momentáneamente sin stock.',
                confirmButtonColor: '#1a1a1a'
            });
            return;
        }
    }

    const cantNum = Math.max(1, parseInt(cantidadToAdd, 10) || 1);

    // Verificar si ya existe este producto con el mismo talle en el carrito
    const existe = carrito.find(item => String(item.id) === String(id) && item.talle === talleElegido);
    const cantidadActual = existe ? existe.cantidad : 0;

    if (cantidadActual + cantNum > maxStock) {
        Swal.fire({
            icon: 'warning',
            title: 'Stock Límite Alcanzado',
            text: `Solo disponemos de ${maxStock} unidad${maxStock === 1 ? '' : 'es'} en talle ${talleElegido}.`,
            confirmButtonColor: '#1a1a1a'
        });
        return;
    }

    if (existe) {
        existe.cantidad += cantNum;
        existe.stockMax = maxStock;
    } else {
        const foto = (p.imagenes && p.imagenes.length > 0) ? p.imagenes[0] : '';
        carrito.push({
            id: p.id,
            nombre: p.nombre,
            precio: p.precioMinorista,
            imagen: foto,
            talle: talleElegido,
            stockMax: maxStock,
            cantidad: cantNum
        });
    }

    actualizarYGuardar();

    // Notificación toast boutique
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: '¡Añadido a tu bolsa!',
        text: `${p.nombre} (Talle ${talleElegido}) x${cantNum}`,
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
    if (!carrito[index]) return;
    const item = carrito[index];

    if (valor > 0) {
        const p = PRODUCTOS.find(prod => String(prod.id) === String(item.id));
        let maxDisponible = item.stockMax || 999;
        if (p && Array.isArray(p.variantes)) {
            const v = p.variantes.find(va => va.talle === item.talle);
            if (v && v.stock !== undefined) {
                maxDisponible = v.stock;
                item.stockMax = maxDisponible;
            }
        }

        if (item.cantidad + valor > maxDisponible) {
            Swal.fire({
                icon: 'warning',
                title: 'Stock Límite',
                text: `No es posible agregar más unidades. Solo quedan ${maxDisponible} unidad${maxDisponible === 1 ? '' : 'es'} en talle ${item.talle}.`,
                confirmButtonColor: '#1a1a1a'
            });
            return;
        }
    }

    if (item.cantidad + valor > 0) {
        item.cantidad += valor;
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
                <p class="text-muted small mb-3">Ingresa tus datos y confirma el método de entrega para registrar tu orden oficial.</p>
                <div class="mb-2">
                    <label class="form-label small fw-bold">Nombre y Apellido *</label>
                    <input type="text" id="swal-cliente-nombre" class="form-control" placeholder="Ej: Valentina Gómez">
                </div>
                <div class="mb-2">
                    <label class="form-label small fw-bold">Teléfono / WhatsApp *</label>
                    <input type="tel" id="swal-cliente-telefono" class="form-control" placeholder="Ej: 264 555-1234">
                </div>
                <div class="mb-2">
                    <label class="form-label small fw-bold">Método de Despacho / Entrega *</label>
                    <select id="swal-tipo-entrega" class="form-select form-select-sm mb-1" onchange="window.actualizarModalEnvio(this.value)">
                        <option value="RETIRO_SHOWROOM" ${TIPO_ENTREGA_SELECCIONADO === 'RETIRO_SHOWROOM' ? 'selected' : ''}>1) Retiro en Showroom (San Juan - ¡Gratis!)</option>
                        <option value="ENVIO_SAN_JUAN" ${TIPO_ENTREGA_SELECCIONADO === 'ENVIO_SAN_JUAN' ? 'selected' : ''}>2) Envío a Domicilio en San Juan (+$2.500)</option>
                        <option value="ENVIO_NACIONAL" ${TIPO_ENTREGA_SELECCIONADO === 'ENVIO_NACIONAL' ? 'selected' : ''}>3) Envío Nacional por Correo (+$6.500)</option>
                    </select>
                </div>
                <div class="mb-2">
                    <label class="form-label small fw-bold" id="swal-label-direccion">Dirección y Localidad ${TIPO_ENTREGA_SELECCIONADO === 'RETIRO_SHOWROOM' ? '(Opcional)' : '*'}</label>
                    <input type="text" id="swal-cliente-direccion" class="form-control" placeholder="Calle, Altura, Barrio, Localidad y Código Postal">
                    <small class="text-muted" style="font-size:0.68rem;">Requerida para envíos a domicilio o despacho nacional.</small>
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

            window.actualizarModalEnvio = function(tipo) {
                const label = document.getElementById('swal-label-direccion');
                if (label) {
                    label.innerText = tipo === 'RETIRO_SHOWROOM' 
                        ? 'Dirección y Localidad (Opcional)' 
                        : 'Dirección y Localidad * (Requerida)';
                }
            };
        },
        preConfirm: () => {
            const nombre = document.getElementById('swal-cliente-nombre')?.value.trim();
            const telefono = document.getElementById('swal-cliente-telefono')?.value.trim();
            const direccion = document.getElementById('swal-cliente-direccion')?.value.trim();
            const tipoEntrega = document.getElementById('swal-tipo-entrega')?.value || TIPO_ENTREGA_SELECCIONADO;

            if (!nombre) {
                Swal.showValidationMessage('¡Por favor ingresa tu nombre completo!');
                return false;
            }
            if (!telefono) {
                Swal.showValidationMessage('¡Ingresa tu número de teléfono para contactarte!');
                return false;
            }
            if (tipoEntrega !== 'RETIRO_SHOWROOM' && (!direccion || direccion.length < 5)) {
                Swal.showValidationMessage('¡Para envíos a domicilio o correo nacional, ingresa tu dirección completa y localidad!');
                return false;
            }

            return { nombre, telefono, direccion, tipoEntrega };
        }
    });

    if (!formValues) {
        abrirCarritoDrawer();
        return;
    }

    TIPO_ENTREGA_SELECCIONADO = formValues.tipoEntrega;
    const costoEnvio = COSTOS_ENVIO[TIPO_ENTREGA_SELECCIONADO] || 0;

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
            tipoEntrega: formValues.tipoEntrega,
            costoEnvio: costoEnvio,
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