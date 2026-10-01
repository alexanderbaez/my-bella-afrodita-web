/* ==========================================================================
   LÓGICA DE NEGOCIO Y EXPERIENCIA DE COMPRA - MY BELLA AFRODITA
   (Estándar Boutique Luxury 2026 - Zara / Savage X Fenty UX Style)
   ========================================================================== */

const WHATSAPP_NUMBER = '5492646121771';

// --- CONFIGURACIÓN CENTRALIZADA DE APIS (Rutas relativas directas al host/puerto activo) ---
const API_BASE = ''; // Usa el origen activo del navegador automáticamente
const API_PRODUCTOS = `${API_BASE}/api/productos`;
const API_DESTACADOS = `${API_BASE}/api/productos/destacados`;
const API_AUTH_STATUS = `${API_BASE}/api/auth/status`;
const API_AUTH_LOGOUT = `${API_BASE}/api/auth/logout`;
const API_CHECKOUT = `${API_BASE}/api/ordenes/checkout`;
const API_RESENAS = `${API_BASE}/api/resenas`;
const API_RESENAS_DESTACADAS = `${API_BASE}/api/resenas/destacadas`;
const API_URL = API_PRODUCTOS; // Retrocompatibilidad para referencias existentes

// Exponer en window para consumo modular seguro en otras páginas (ej: producto.js)
window.API_BASE = API_BASE;
window.API_PRODUCTOS = API_PRODUCTOS;
window.API_DESTACADOS = API_DESTACADOS;
window.API_AUTH_STATUS = API_AUTH_STATUS;
window.API_AUTH_LOGOUT = API_AUTH_LOGOUT;
window.API_CHECKOUT = API_CHECKOUT;
window.API_RESENAS = API_RESENAS;
window.API_RESENAS_DESTACADAS = API_RESENAS_DESTACADAS;

function normalizarUrlImagen(url) {
    if (!url) return 'https://via.placeholder.com/300x400?text=My+Bella+Afrodita';
    let clean = String(url).trim();
    // Elimina host/puerto absoluto local o IP si existiese previamente en base de datos
    clean = clean.replace(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/.*)$/, '$1');
    clean = clean.replace(/^https?:\/\/(?:[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|localhost)(?::\d+)?(\/(?:uploads|images)\/.*)$/, '$1');
    if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
    if (clean.startsWith('../images/')) return clean.replace('../images/', '/images/');
    if (clean.startsWith('images/')) return '/' + clean;
    if (clean.startsWith('uploads/')) return '/' + clean;
    if (!clean.startsWith('/')) return '/' + clean;
    return clean;
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

// --- MÓDULO DE LOGÍSTICA & SELECCIÓN DE ENTREGA (EXCLUSIVO SAN JUAN - 100% ONLINE) ---
let TIPO_ENTREGA_SELECCIONADO = 'ENVIO_MOTO_SAN_JUAN';
const COSTOS_ENVIO = {
    ENVIO_MOTO_SAN_JUAN: 0
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
    TIPO_ENTREGA_SELECCIONADO = 'ENVIO_MOTO_SAN_JUAN';
    const cardMoto = document.getElementById('card-ship-moto');
    if (cardMoto) cardMoto.classList.add('active');
    renderizarListaCarrito();
};

// --- COMPARTIR PRODUCTO (ESTILO MERCADO LIBRE: NATIVE SHARE O PORTAPAPELES + TOAST CHAMPÁN) ---
window.compartirProducto = async function (e, id, nombre, precio) {
    if (e) {
        e.stopPropagation();
        e.preventDefault();
    }
    const permalink = `${window.location.origin}/producto.html?id=${id}`;
    const precioFormat = Number(precio || 0).toLocaleString('es-AR');
    const texto = `${nombre} - My Bella Afrodita ($${precioFormat})`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: `${nombre} | My Bella Afrodita`,
                text: texto,
                url: permalink
            });
            return;
        } catch (err) {
            if (err.name === 'AbortError') return;
        }
    }

    copiarEnlaceToast(permalink);
};

window.copiarEnlaceToast = function (url) {
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
        navigator.clipboard.writeText(url).then(dispararToast).catch(() => fallbackCopyScript(url, dispararToast));
    } else {
        fallbackCopyScript(url, dispararToast);
    }
};

function fallbackCopyScript(url, callback) {
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

document.addEventListener('DOMContentLoaded', async () => {
    actualizarContadorUI();
    iniciarRotadorAnuncios();
    verificarAdminEnTienda();

    // 1. CARGA DE PRENDAS DESTACADAS EN PORTADA (SI EXISTE EL CONTENEDOR EN INDEX.HTML)
    cargarDestacadosInicio();

    // 1.1 CARGA DE RESEÑAS DESTACADAS DE CLIENTAS
    cargarResenasDestacadas();

    // 2. CARGA ASÍNCRONA DE PRODUCTOS DESDE LA API SPRING BOOT / MYSQL PARA CATÁLOGO
    const contenedor = document.getElementById("contenedor-productos") || document.getElementById("productos-grid");
    if (contenedor) {
        try {
            contenedor.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="spinner-border text-dark" role="status" style="width: 2.2rem; height: 2.2rem; border-width: 0.18em;">
                        <span class="visually-hidden">Cargando colección...</span>
                    </div>
                    <p class="text-muted small mt-2 text-uppercase fw-semibold" style="letter-spacing: 1.5px; font-size: 0.72rem;">Cargando colección boutique...</p>
                </div>`;

            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            PRODUCTOS = await response.json();
            window.PRODUCTOS = PRODUCTOS;
            console.log('%c[CATÁLOGO] Prendas recibidas desde API:', 'color: #D4AF37; font-weight: bold;', PRODUCTOS.length);
        } catch (error) {
            console.error("Error al obtener los productos desde la API:", error);
            contenedor.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-exclamation-circle text-danger fa-2x mb-3"></i>
                    <h5 class="fw-bold text-dark font-playfair">No pudimos conectar con el catálogo</h5>
                    <p class="text-muted small">Por favor, confirma que el servidor de Tienda Bella Afrodita esté activo.</p>
                </div>`;
            return;
        }

        // Asegurarse de que el contenedor no tenga estilos que oculten las tarjetas
        contenedor.style.display = 'flex';
        contenedor.style.visibility = 'visible';
        contenedor.style.minHeight = '400px';

        // 3. CAPTURAMOS LA COLECCIÓN DESDE LA URL (ej: productos.html?categoria=CONJUNTOS)
        // Si no hay categoría especificada o no coincide ninguna, muestra la lista disponible por defecto
        const urlParams = new URLSearchParams(window.location.search);
        let catParam = urlParams.get('categoria') || urlParams.get('cat') || '';
        categoriaActiva = catParam;

        // 4. INICIALIZAMOS TALLES CONTEXTUALES Y FILTROS SEGÚN LA COLECCIÓN
        actualizarFiltrosTallesContextuales(categoriaActiva);
        aplicarFiltrosYOrdenCatalogo();
    }

    // Cerrar el Drawer con la tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarCarritoDrawer();
        }
    });

    // Detectar si vienen desde un link con id directo en otra página
    const urlParamsShared = new URLSearchParams(window.location.search);
    const productoId = urlParamsShared.get('id');
    if (productoId && !window.location.pathname.endsWith('producto.html')) {
        window.location.href = `./producto.html?id=${productoId}`;
    }
});

// Normalización flexible para filtros y categorías (insensible a acentos, mayúsculas y espacios)
const normalizar = (str) => (str || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function coincideCategoria(prodCat, catFiltro) {
    if (!catFiltro || catFiltro === 'TODOS' || catFiltro === 'todos') return true;
    const catProdNorm = normalizar(prodCat);
    const catFiltroNorm = normalizar(catFiltro);
    if (!catFiltroNorm) return true;

    // Substring bidireccional exacto (sensible y flexible a acentos/espacios/mayúsculas)
    if (catProdNorm.includes(catFiltroNorm) || catFiltroNorm.includes(catProdNorm)) return true;

    // Singular / Plural (ej: "conjuntos" vs "conjunto", "bombachas" vs "bombacha")
    const baseFiltro = catFiltroNorm.endsWith('s') ? catFiltroNorm.slice(0, -1) : catFiltroNorm;
    const baseProd = catProdNorm.endsWith('s') ? catProdNorm.slice(0, -1) : catProdNorm;
    if (baseFiltro && baseFiltro === baseProd) return true;

    // Sinónimos masculinos ("masculino", "hombres", "hombre", "boxer")
    const esHombresFiltro = catFiltroNorm.includes('hombre') || catFiltroNorm.includes('masculin') || catFiltroNorm.includes('boxer');
    const esHombresProd = catProdNorm.includes('hombre') || catProdNorm.includes('masculin') || catProdNorm.includes('boxer');
    if (esHombresFiltro && esHombresProd) return true;

    // Sinónimos bombachas / colaless
    const esBombachaFiltro = catFiltroNorm.includes('bombach') || catFiltroNorm.includes('colaless') || catFiltroNorm.includes('tanga') || catFiltroNorm.includes('panties');
    const esBombachaProd = catProdNorm.includes('bombach') || catProdNorm.includes('colaless') || catProdNorm.includes('tanga') || catProdNorm.includes('panties');
    if (esBombachaFiltro && esBombachaProd) return true;

    return false;
}

function normalizarCategoria(cat) {
    if (!cat) return '';
    const c = normalizar(cat);
    if (c.includes('masculin') || c.includes('hombr') || c.includes('boxer')) return 'hombres';
    if (c.includes('conjunt')) return 'conjuntos';
    if (c.includes('bombach') || c.includes('colaless') || c.includes('tanga')) return 'bombachas';
    if (c.includes('media')) return 'medias';
    return c;
}

// --- FILTROS DE CATÁLOGO Y TALLES CONTEXTUALES (DRAWER OFFCANVAS) ---
window.cambiarCategoriaDesdeDrawer = function(cat) {
    categoriaActiva = cat || '';
    talleFiltroActivo = 'TODOS';
    actualizarFiltrosTallesContextuales(categoriaActiva);
    aplicarFiltrosYOrdenCatalogo();
    try {
        const nuevaUrl = new URL(window.location);
        if (categoriaActiva) {
            nuevaUrl.searchParams.set('categoria', categoriaActiva.toUpperCase());
        } else {
            nuevaUrl.searchParams.delete('categoria');
        }
        window.history.replaceState({}, '', nuevaUrl);
    } catch(e) {}
};

window.seleccionarTalleDrawer = function(talle) {
    talleFiltroActivo = talle;
    const botones = document.querySelectorAll('#drawer-filtro-talles-container .talle-pill-clean');
    botones.forEach(btn => {
        const val = btn.innerText.trim();
        if (val.toUpperCase() === talle.toUpperCase() || (talle === 'TODOS' && val.toLowerCase() === 'todos')) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    aplicarFiltrosYOrdenCatalogo();
};

window.aplicarFiltrosDesdeDrawer = function() {
    aplicarFiltrosYOrdenCatalogo();
    const offcanvasEl = document.getElementById('offcanvasFiltros');
    if (offcanvasEl && typeof bootstrap !== 'undefined' && bootstrap.Offcanvas) {
        const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl) || new bootstrap.Offcanvas(offcanvasEl);
        bsOffcanvas.hide();
    }
};

window.limpiarTodosLosFiltros = function() {
    talleFiltroActivo = 'TODOS';
    busquedaCatalogo = '';

    const inputBusqueda = document.getElementById('buscador-catalogo');
    if (inputBusqueda) inputBusqueda.value = '';

    const btnLimpiar = document.getElementById('btn-limpiar-busqueda');
    if (btnLimpiar) btnLimpiar.classList.add('d-none');

    actualizarFiltrosTallesContextuales(categoriaActiva);
    aplicarFiltrosYOrdenCatalogo();
};

function actualizarFiltrosTallesContextuales(categoria) {
    const contenedorFiltros = document.getElementById('drawer-filtro-talles-container');
    const hint = document.getElementById('drawer-talle-context-hint');
    if (!contenedorFiltros) return;

    let tallesDisponibles = [];
    const catNorm = normalizarCategoria(categoria);

    if (!catNorm || catNorm === 'todos') {
        tallesDisponibles = ['1', '2', '3', '4', '85', '90', '95', '100', '105', 'S', 'M', 'L', 'XL', 'ÚNICO'];
        if (hint) hint.innerText = 'Todos los Talles';
    } else if (catNorm === 'conjuntos') {
        tallesDisponibles = ['85', '90', '95', '100', '105'];
        if (hint) hint.innerText = 'Corpiños / Busto';
    } else if (catNorm === 'bombachas') {
        tallesDisponibles = ['1', '2', '3', '4'];
        if (hint) hint.innerText = 'Colaless / Cadera';
    } else if (catNorm === 'hombres') {
        tallesDisponibles = ['S', 'M', 'L', 'XL'];
        if (hint) hint.innerText = 'Boxers Masculinos';
    } else if (catNorm === 'medias') {
        tallesDisponibles = ['ÚNICO'];
        if (hint) hint.innerText = 'Talle Único';
    } else {
        tallesDisponibles = ['85', '90', '95', '100', '105'];
        if (hint) hint.innerText = 'Corpiños / Busto';
    }

    let html = `<button type="button" class="talle-pill-clean ${talleFiltroActivo === 'TODOS' ? 'active' : ''}" onclick="seleccionarTalleDrawer('TODOS')">Todos</button>`;

    tallesDisponibles.forEach(t => {
        const activo = talleFiltroActivo.toUpperCase() === t.toUpperCase();
        html += `<button type="button" class="talle-pill-clean ${activo ? 'active' : ''}" onclick="seleccionarTalleDrawer('${t}')">${t}</button>`;
    });

    contenedorFiltros.innerHTML = html;

    // Sincronizar radio del drawer
    const radios = document.querySelectorAll('input[name="drawerCatFilter"]');
    radios.forEach(radio => {
        if (catNorm && radio.value === catNorm) {
            radio.checked = true;
        } else if (!catNorm && radio.value === 'todos') {
            radio.checked = true;
        }
    });
}

// Compatibilidad previa
window.filtrarPorTalle = function(talleSeleccionado) {
    seleccionarTalleDrawer(talleSeleccionado);
};

function actualizarBadgeFiltros() {
    let activos = 0;
    if (categoriaActiva && categoriaActiva !== 'todos') activos++;
    if (talleFiltroActivo && talleFiltroActivo !== 'TODOS') activos++;

    const badge = document.getElementById('badge-filtros-activos');
    if (badge) {
        if (activos > 0) {
            badge.innerText = activos;
            badge.classList.remove('d-none');
        } else {
            badge.classList.add('d-none');
        }
    }
}

function actualizarTituloYContadorCatalogo(cantidadVisible) {
    const tituloSeccion = document.getElementById('catalogo-titulo-editorial');
    const contadorPrendas = document.getElementById('catalogo-contador-prendas');
    const breadcrumbActive = document.getElementById('breadcrumb-categoria-activa');

    const catNorm = normalizarCategoria(categoriaActiva);
    let tituloTexto = "Colección Atelier";
    let breadcrumbTexto = "Todas las Colecciones";
    let docTitle = "Catálogo Exclusivo - My Bella Afrodita";

    if (!catNorm || catNorm === 'todos') {
        tituloTexto = "Colección Atelier";
        breadcrumbTexto = "Todas las Colecciones";
        docTitle = "Catálogo Exclusivo - My Bella Afrodita";
    } else if (catNorm === 'conjuntos') {
        tituloTexto = "Colección Conjuntos";
        breadcrumbTexto = "Colección Conjuntos";
        docTitle = "Colección Conjuntos - My Bella Afrodita";
    } else if (catNorm === 'bombachas') {
        tituloTexto = "Colección Bombachas";
        breadcrumbTexto = "Colección Bombachas";
        docTitle = "Colección Bombachas - My Bella Afrodita";
    } else if (catNorm === 'hombres') {
        tituloTexto = "Colección Masculino";
        breadcrumbTexto = "Colección Masculino";
        docTitle = "Colección Masculino - My Bella Afrodita";
    } else if (catNorm === 'medias') {
        tituloTexto = "Colección Medias";
        breadcrumbTexto = "Colección Medias";
        docTitle = "Colección Medias - My Bella Afrodita";
    } else {
        const catCap = catNorm.charAt(0).toUpperCase() + catNorm.slice(1);
        tituloTexto = `Colección ${catCap}`;
        breadcrumbTexto = `Colección ${catCap}`;
        docTitle = `Colección ${catCap} - My Bella Afrodita`;
    }

    if (breadcrumbActive) breadcrumbActive.innerText = breadcrumbTexto;
    document.title = docTitle;

    if (tituloSeccion) tituloSeccion.innerText = tituloTexto;

    if (contadorPrendas && cantidadVisible !== undefined) {
        contadorPrendas.innerText = `${cantidadVisible} ${cantidadVisible === 1 ? 'Modelo Exclusivo' : 'Modelos Exclusivos'}`;
    }

    // Actualizar estado 'active' en el navbar
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.classList.remove('active');
        const href = (link.getAttribute('href') || '').toLowerCase();
        if (catNorm && (href.includes(`categoria=${catNorm}`) || (catNorm === 'hombres' && href.includes('categoria=masculino')))) {
            link.classList.add('active');
        }
    });
}

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
    let catFiltro = categoriaActiva;

    // 1. Filtrar por categoría usando coincidencia flexible y normalizada
    let productosFiltrados = PRODUCTOS.filter(p => coincideCategoria(p.categoria, catFiltro));

    // Si se especificó una categoría pero ninguna prenda coincide con ella en toda la base,
    // mostrar la lista completa por defecto para no dejar en blanco la pantalla
    if (catFiltro && productosFiltrados.length === 0 && PRODUCTOS.length > 0) {
        console.warn(`[CATÁLOGO] Ninguna prenda coincidió con la categoría '${catFiltro}'. Mostrando lista disponible por defecto.`);
        productosFiltrados = [...PRODUCTOS];
        catFiltro = '';
    }

    // 2. Filtrar por talle activo
    if (talleFiltroActivo && talleFiltroActivo !== 'TODOS') {
        productosFiltrados = productosFiltrados.filter(p => {
            const coincideTalleArray = Array.isArray(p.talles) && p.talles.includes(talleFiltroActivo);
            const coincideVariante = Array.isArray(p.variantes) && p.variantes.some(v => v.talle === talleFiltroActivo && (v.stock || 0) > 0);
            return coincideTalleArray || coincideVariante;
        });
    }

    // 3. Filtrar reactivamente por búsqueda de texto (nombre o descripción)
    if (busquedaCatalogo) {
        const busqNorm = normalizar(busquedaCatalogo);
        productosFiltrados = productosFiltrados.filter(p => {
            const nom = normalizar(p.nombre);
            const desc = normalizar(p.descripcion);
            return nom.includes(busqNorm) || desc.includes(busqNorm);
        });
    }

    // 3. Logs de Diagnóstico:
    console.log('Prendas recibidas:', PRODUCTOS.length, 'Categoría URL:', catFiltro || '(todas)', 'Prendas tras filtro:', productosFiltrados.length);

    // 4. Ordenamiento reactivo
    if (ordenCatalogo === 'precio-asc') {
        productosFiltrados.sort((a, b) => (Number(a.precioMinorista) || 0) - (Number(b.precioMinorista) || 0));
    } else if (ordenCatalogo === 'precio-desc') {
        productosFiltrados.sort((a, b) => (Number(b.precioMinorista) || 0) - (Number(a.precioMinorista) || 0));
    } else if (ordenCatalogo === 'alfabetico') {
        productosFiltrados.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    } else {
        // "destacados": prioriza prendas con etiqueta (MÁS VENDIDO, OFERTA, NUEVO, etc.) y luego por ID
        productosFiltrados.sort((a, b) => {
            const tieneTagA = Boolean(a.etiqueta);
            const tieneTagB = Boolean(b.etiqueta);
            if (tieneTagA && !tieneTagB) return -1;
            if (!tieneTagA && tieneTagB) return 1;
            return (b.id || 0) - (a.id || 0);
        });
    }

    actualizarBadgeFiltros();
    actualizarTituloYContadorCatalogo(productosFiltrados.length);
    dibujarProductos(productosFiltrados);
}

// --- RESTABLECER CATÁLOGO COMPLETO ---
window.restablecerCatalogoCompleto = function () {
    categoriaActiva = '';
    talleFiltroActivo = 'TODOS';
    busquedaCatalogo = '';

    const inputBusqueda = document.getElementById('buscador-catalogo');
    if (inputBusqueda) inputBusqueda.value = '';

    const btnLimpiar = document.getElementById('btn-limpiar-busqueda');
    if (btnLimpiar) btnLimpiar.classList.add('d-none');

    try {
        const urlLimpia = window.location.pathname;
        window.history.replaceState({}, '', urlLimpia);
    } catch (e) {}

    actualizarFiltrosTallesContextuales('');
    aplicarFiltrosYOrdenCatalogo();
};

// --- DIBUJAR GRILLA DE PRODUCTOS (LOOK & FEEL ZARA / SAVAGE X FENTY) ---
function dibujarProductos(lista) {
    const contenedor = document.getElementById("contenedor-productos") || document.getElementById("productos-grid");
    if (!contenedor) return;

    contenedor.style.display = 'flex';
    contenedor.style.visibility = 'visible';
    contenedor.style.minHeight = '400px';
    contenedor.innerHTML = "";

    if (lista.length === 0) {
        contenedor.innerHTML = `
            <div class="col-12 text-center py-5 my-4">
                <div class="empty-state-luxury p-4 p-md-5 rounded-3 border mx-auto" style="max-width: 580px; background: rgba(250, 249, 246, 0.95); border-color: rgba(212, 175, 55, 0.3) !important;">
                    <i class="fas fa-gem text-muted fa-2x mb-3" style="color: #D4AF37 !important; opacity: 0.85;"></i>
                    <h4 class="fw-bold text-dark font-serif mb-2">No se encontraron prendas en esta colección</h4>
                    <p class="text-muted small mb-4">No hay modelos disponibles con los filtros actuales o en esta colección.</p>
                    <button type="button" class="btn btn-dark btn-sm px-4 py-2 text-uppercase fw-semibold" style="letter-spacing: 1px; font-size: 0.75rem;" onclick="window.restablecerCatalogoCompleto()">
                        Ver todas las colecciones
                    </button>
                </div>
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
                <!-- Contenedor Imagen 3:4 con Cross-Fade y Redirección Directa a Ficha -->
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

                        <!-- Precios con Redirección Directa -->
                        <div class="product-pricing-box d-flex align-items-baseline" style="cursor: pointer;" onclick="navegarAProducto('${p.id}')" title="Ver prenda">
                            <span class="price-retail-highlight">$${Number(p.precioMinorista).toLocaleString('es-AR')}</span>
                            ${wholesaleHtml}
                        </div>

                        <!-- Botones de Acción: Añadir y Compartir Estilo Mercado Libre -->
                        <div class="product-card-actions">
                            <button class="btn btn-add-boutique flex-grow-1" 
                                    ${!tieneStock ? 'disabled' : ''} 
                                    onclick="navegarAProducto('${p.id}')">
                                <i class="fas ${tieneStock ? 'fa-tag' : 'fa-times'} me-1.5"></i>
                                ${tieneStock ? 'Elegir Talle / Comprar' : 'Agotado'}
                            </button>
                            <button class="btn-share-card" 
                                    onclick="compartirProducto(event, '${p.id}', '${p.nombre.replace(/'/g, "\\'")}', '${p.precioMinorista}')" 
                                    title="Compartir enlace de la prenda">
                                <i class="fas fa-share-nodes"></i>
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
        const res = await fetch(API_AUTH_STATUS, { credentials: 'include' });
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
        await fetch(API_AUTH_LOGOUT, { method: 'POST', credentials: 'include' });
    } catch (e) {}
    sessionStorage.removeItem('myBellaAdminUser');
    localStorage.removeItem('myBellaAdminUser');
    window.location.reload();
};

// ==========================================================================
// REDIRECCIÓN DIRECTA A FICHA DE PRODUCTO (Eliminación de quick views/lightboxes)
// ==========================================================================
window.abrirQuickView = function (id) {
    navegarAProducto(id);
};

// --- CARGA DE DESTACADOS EN PORTADA DESDE /api/productos/destacados ---
async function cargarDestacadosInicio() {
    const contenedor = document.getElementById('featured-products-home');
    if (!contenedor) return;

    // Asegurar que el contenedor sea visible
    contenedor.style.display = 'flex';
    contenedor.style.visibility = 'visible';

    try {
        let destacados = [];
        try {
            const res = await fetch(API_DESTACADOS);
            if (res.ok) {
                const data = await res.json();
                console.log('[INICIO] Destacados recibidos:', Array.isArray(data) ? data.length : 0);
                if (Array.isArray(data) && data.length > 0) {
                    destacados = data;
                }
            } else {
                console.warn('[INICIO] /api/productos/destacados devolvió código HTTP:', res.status);
            }
        } catch (fetchError) {
            console.warn('[INICIO] Fallo al consultar /api/productos/destacados:', fetchError);
        }

        // FALLBACK: Si no hay destacados marcados con estrella o la API devolvió [],
        // tomar de 4 a 6 productos activos desde /api/productos
        if (!destacados || destacados.length === 0) {
            console.log('[INICIO] Lista de destacados vacía. Aplicando fallback automático desde /api/productos...');
            try {
                let catalogoGeneral = Array.isArray(PRODUCTOS) && PRODUCTOS.length > 0 ? PRODUCTOS : null;
                if (!catalogoGeneral) {
                    const resCatalogo = await fetch(API_URL);
                    if (resCatalogo.ok) {
                        catalogoGeneral = await resCatalogo.json();
                        PRODUCTOS = catalogoGeneral;
                        window.PRODUCTOS = catalogoGeneral;
                    }
                }
                if (Array.isArray(catalogoGeneral) && catalogoGeneral.length > 0) {
                    // Tomar las primeras 4 a 6 prendas
                    destacados = catalogoGeneral.slice(0, 6);
                    console.log('[INICIO] Destacados obtenidos vía fallback:', destacados.length);
                }
            } catch (errFallback) {
                console.error('[INICIO] Error en fallback de productos:', errFallback);
            }
        }

        // Renderizar prendas
        if (destacados && destacados.length > 0) {
            contenedor.innerHTML = '';
            destacados.forEach(p => {
                const fotos = Array.isArray(p.imagenes) && p.imagenes.length > 0 
                    ? p.imagenes.map(normalizarUrlImagen) 
                    : ['https://via.placeholder.com/300x400?text=My+Bella+Afrodita'];
                const fotoPrincipal = fotos[0];
                const fotoSecundaria = fotos.length > 1 ? fotos[1] : null;

                const divCol = document.createElement('div');
                divCol.className = 'col-6 col-md-4 col-lg-3 d-flex align-items-stretch';
                divCol.innerHTML = `
                    <div class="product-card-boutique w-100">
                        <div class="product-media-container position-relative" style="cursor: pointer;" onclick="navegarAProducto('${p.id}')">
                            <span class="badge-luxury-tag">⭐ Destacado</span>
                            <img src="${fotoPrincipal}" alt="${p.nombre}" class="img-primary" onerror="this.src='https://via.placeholder.com/300x400?text=My+Bella+Afrodita'">
                            ${fotoSecundaria ? `<img src="${fotoSecundaria}" alt="${p.nombre} dorsal" class="img-secondary">` : ''}
                        </div>
                        <div class="product-info-wrap">
                            <div>
                                <div class="product-category-label">${p.categoria || 'Colección'}</div>
                                <h3 class="product-title-luxury" style="cursor: pointer;" onclick="navegarAProducto('${p.id}')">${p.nombre}</h3>
                                <p class="product-desc-clamped">${p.descripcion || 'Confección boutique de alta calidad.'}</p>
                            </div>
                            <div class="mt-2">
                                <div class="product-pricing-box d-flex align-items-baseline" style="cursor: pointer;" onclick="navegarAProducto('${p.id}')">
                                    <span class="price-retail-highlight">$${Number(p.precioMinorista).toLocaleString('es-AR')}</span>
                                </div>
                                <div class="product-card-actions mt-2">
                                    <button class="btn btn-add-boutique flex-grow-1" onclick="navegarAProducto('${p.id}')">
                                        <i class="fas fa-tag me-1.5"></i> Elegir Talle / Comprar
                                    </button>
                                    <button class="btn-share-card" onclick="compartirProducto(event, '${p.id}', '${p.nombre.replace(/'/g, "\\'")}', '${p.precioMinorista}')" title="Compartir">
                                        <i class="fas fa-share-nodes"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>`;
                contenedor.appendChild(divCol);
            });
        } else {
            // Si no hay productos disponibles
            contenedor.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="p-4 rounded-3 border mx-auto" style="max-width: 500px; background: #FAF9F6; border-color: rgba(212, 175, 55, 0.3);">
                        <i class="fas fa-gem text-muted fa-2x mb-3" style="color: #D4AF37 !important;"></i>
                        <h5 class="fw-bold text-dark font-serif mb-2">Colección en Preparación</h5>
                        <p class="text-muted small mb-3">Estamos preparando las nuevas piezas de alta costura para esta temporada.</p>
                        <a href="./productos.html?categoria=CONJUNTOS" class="btn btn-dark btn-sm px-4 py-2 text-uppercase fw-semibold" style="letter-spacing: 1px; font-size: 0.75rem;">
                            Explorar Colecciones
                        </a>
                    </div>
                </div>`;
        }
    } catch (err) {
        console.error('[INICIO] Error fatal al cargar destacados en portada:', err);
        contenedor.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="p-4 rounded-3 border mx-auto" style="max-width: 500px; background: #FAF9F6; border-color: rgba(212, 175, 55, 0.3);">
                    <p class="text-muted small mb-3">Descubre nuestras colecciones exclusivas en el catálogo atelier.</p>
                    <div class="d-flex flex-wrap justify-content-center gap-2">
                        <a href="./productos.html?categoria=CONJUNTOS" class="btn btn-outline-dark btn-sm">Conjuntos</a>
                        <a href="./productos.html?categoria=BOMBACHAS" class="btn btn-outline-dark btn-sm">Bombachas</a>
                        <a href="./productos.html?categoria=MASCULINO" class="btn btn-outline-dark btn-sm">Masculino</a>
                        <a href="./productos.html?categoria=MEDIAS" class="btn btn-outline-dark btn-sm">Medias</a>
                    </div>
                </div>
            </div>`;
    } finally {
        // SIEMPRE oculta o remueve el spinner de carga para evitar que quede girando
        const spinner = contenedor.querySelector('.spinner-border, #spinner-destacados');
        if (spinner) {
            const parentCol = spinner.closest('.col-12');
            if (parentCol) {
                parentCol.remove();
            } else {
                spinner.remove();
            }
        }
    }
}
window.cargarDestacadosInicio = cargarDestacadosInicio;
window.cargarDestacadosHome = cargarDestacadosInicio;

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
        const p = (Array.isArray(PRODUCTOS) && PRODUCTOS.length > 0)
            ? PRODUCTOS.find(prod => String(prod.id) === String(item.id))
            : (typeof PRODUCTO_ACTUAL !== 'undefined' && String(PRODUCTO_ACTUAL?.id) === String(item.id) ? PRODUCTO_ACTUAL : null);

        const precioMinoristaEfectivo = p ? (p.precioMinorista || p.precio) : (item.precioMinorista || item.precio || 0);
        const precioMayoristaEfectivo = p ? p.precioMayorista : (item.precioMayorista || 0);
        
        totalBaseMinorista += precioMinoristaEfectivo * item.cantidad;

        if (cumpleCriterioCantidad && precioMayoristaEfectivo && precioMayoristaEfectivo > 0) {
            totalGeneral += precioMayoristaEfectivo * item.cantidad;
            aplicoAlgunaPromocion = true;
        } else {
            totalGeneral += precioMinoristaEfectivo * item.cantidad;
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
        const p = (Array.isArray(PRODUCTOS) && PRODUCTOS.length > 0)
            ? PRODUCTOS.find(prod => String(prod.id) === String(item.id))
            : (typeof PRODUCTO_ACTUAL !== 'undefined' && String(PRODUCTO_ACTUAL?.id) === String(item.id) ? PRODUCTO_ACTUAL : null);

        const precioUnitarioItem = item.precioMinorista || item.precio || 0;
        const precioMayoristaItem = item.precioMayorista || p?.precioMayorista || precioUnitarioItem;
        const precioAplicado = (res.esMayorista && precioMayoristaItem) ? precioMayoristaItem : (p?.precioMinorista || precioUnitarioItem);
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

    // Totales y Logística San Juan (100% Online - Cadetería a coordinar)
    const subtotalEl = document.getElementById('drawer-subtotal');
    if (subtotalEl) {
        subtotalEl.innerText = `$${res.total.toLocaleString('es-AR')}`;
    }

    const shippingCostEl = document.getElementById('drawer-shipping-cost');
    const shippingBadgeEl = document.getElementById('drawer-shipping-badge');
    if (shippingCostEl) {
        shippingCostEl.innerText = 'A cotizar por zona';
        shippingCostEl.className = 'fw-semibold text-muted';
    }
    if (shippingBadgeEl) {
        shippingBadgeEl.innerText = 'A coordinar';
        shippingBadgeEl.className = 'badge bg-warning text-dark';
    }

    if (totalElement) {
        // En el total del pedido figura el subtotal de prendas
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
    if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
    const p = (Array.isArray(PRODUCTOS) && PRODUCTOS.length > 0)
        ? PRODUCTOS.find(prod => String(prod.id) === String(id))
        : (typeof PRODUCTO_ACTUAL !== 'undefined' && String(PRODUCTO_ACTUAL?.id) === String(id) ? PRODUCTO_ACTUAL : null);

    if (!p) {
        console.warn(`[CARRITO] Prenda no localizada con ID ${id}`);
        return;
    }

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

    const precioMinoristaNum = Number(p.precioMinorista) || Number(p.precio) || 0;
    const precioMayoristaNum = Number(p.precioMayorista) || precioMinoristaNum;

    if (existe) {
        existe.cantidad += cantNum;
        existe.stockMax = maxStock;
        existe.precioMinorista = precioMinoristaNum;
        existe.precioMayorista = precioMayoristaNum;
        existe.precio = precioMinoristaNum;
    } else {
        const foto = (p.imagenes && p.imagenes.length > 0) ? p.imagenes[0] : '';
        carrito.push({
            id: Number(p.id),
            nombre: p.nombre,
            precio: precioMinoristaNum,
            precioMinorista: precioMinoristaNum,
            precioMayorista: precioMayoristaNum,
            imagen: foto,
            talle: talleElegido,
            stockMax: maxStock,
            cantidad: cantNum
        });
    }

    actualizarYGuardar();
    renderizarListaCarrito();

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

// Alias globales para consistencia y reactividad en componentes externos
window.modificarCantidadItem = window.cambiarCantidad;
window.eliminarItemCarrito = window.eliminarDelCarrito;

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

    const resTotales = calcularTotalCarrito();
    const departamentosSanJuan = [
        "Capital", "Rivadavia", "Santa Lucía", "Rawson", "Chimbas",
        "Pocito", "Albardón", "Caucete", "Otros"
    ];

    const { value: formValues } = await Swal.fire({
        title: 'Checkout · Envío a Domicilio (San Juan)',
        html: `
            <div class="text-start">
                <!-- Banner Método Logístico Transparente -->
                <div class="p-2.5 mb-3 rounded border" style="background: #FAF9F6; border-color: #E8E4D9 !important;">
                    <div class="d-flex align-items-center mb-1">
                        <span class="badge bg-dark text-white me-2" style="letter-spacing: 0.5px; font-size: 0.65rem;">OPERACIÓN 100% ONLINE</span>
                        <strong style="font-size: 0.8rem; color: #1a1a1a;">🛵 Envío a Domicilio en Moto (San Juan)</strong>
                    </div>
                    <p class="text-muted small mb-0" style="font-size: 0.72rem; line-height: 1.4;">
                        <i class="fas fa-info-circle text-warning me-1"></i> Costo de envío a coordinar según zona exacta (se abona al recibir o junto con el pago).
                    </p>
                </div>

                <div class="mb-2">
                    <label class="form-label small fw-bold text-uppercase" style="font-size: 0.68rem; letter-spacing: 0.5px;">1. Nombre y Apellido *</label>
                    <input type="text" id="swal-cliente-nombre" class="form-control form-control-sm" placeholder="Ej: Camila Gómez" autocomplete="name">
                </div>
                <div class="mb-2">
                    <label class="form-label small fw-bold text-uppercase" style="font-size: 0.68rem; letter-spacing: 0.5px;">2. WhatsApp de Contacto *</label>
                    <input type="tel" id="swal-cliente-telefono" class="form-control form-control-sm" placeholder="Ej: 264 555-1234" autocomplete="tel">
                </div>
                <div class="mb-2">
                    <label class="form-label small fw-bold text-uppercase" style="font-size: 0.68rem; letter-spacing: 0.5px;">3. Email <span class="text-muted fw-normal">(Opcional)</span></label>
                    <input type="email" id="swal-cliente-email" class="form-control form-control-sm" placeholder="Ej: camila@email.com" autocomplete="email">
                </div>
                <div class="mb-2">
                    <label class="form-label small fw-bold text-uppercase" style="font-size: 0.68rem; letter-spacing: 0.5px;">4. Departamento (San Juan) *</label>
                    <select id="swal-cliente-departamento" class="form-select form-select-sm">
                        <option value="">Selecciona tu departamento...</option>
                        ${departamentosSanJuan.map(d => `<option value="${d}">${d}</option>`).join('')}
                    </select>
                </div>
                <div class="mb-2">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <label class="form-label small fw-bold text-uppercase mb-0" style="font-size: 0.68rem; letter-spacing: 0.5px;">5. Dirección Exacta (Calle, Nro, Barrio) *</label>
                        <button type="button" id="btn-gps-ubicacion" class="btn btn-outline-dark btn-xs py-0 px-2 fw-normal" style="font-size: 0.68rem; border-radius: 12px;" title="Obtener mi posición GPS exacta para el cadete">
                            <i class="fas fa-crosshairs text-danger me-1"></i> 📍 Compartir mi ubicación GPS actual
                        </button>
                    </div>
                    <input type="text" id="swal-cliente-direccion" class="form-control form-control-sm" placeholder="Ej: Av. Libertador 1250 Oeste, Barrio Rivadavia">
                    <div id="gps-status-feedback" class="small mt-1 text-success fw-semibold d-none" style="font-size: 0.72rem;"></div>
                </div>
                <div class="mb-2">
                    <label class="form-label small fw-bold text-uppercase" style="font-size: 0.68rem; letter-spacing: 0.5px;">6. Entrecalles y Referencias para el Cadete *</label>
                    <input type="text" id="swal-cliente-referencias" class="form-control form-control-sm" placeholder="Ej: Entre Urquiza y Paula. Portón negro">
                    <small class="text-muted" style="font-size:0.67rem;">Requerido para que el cadete ubique tu domicilio sin demoras.</small>
                </div>

                <!-- Resumen de Pedido Transparente -->
                <div class="mt-3 pt-2 border-top d-flex justify-content-between align-items-center">
                    <div>
                        <span class="small text-muted" style="font-size: 0.72rem;">Subtotal Prendas:</span>
                        <div class="fw-bold text-dark font-serif" style="font-size: 1.05rem;">$${resTotales.total.toLocaleString('es-AR')}</div>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-light text-dark border px-2 py-1" style="font-size: 0.7rem;">Envío: A cotizar por zona</span>
                    </div>
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: '<i class="fab fa-whatsapp me-1.5"></i> CONFIRMAR PEDIDO Y COORDINAR PAGO',
        cancelButtonText: 'Volver a la bolsa',
        confirmButtonColor: '#121212',
        cancelButtonColor: '#706E6B',
        didOpen: () => {
            const input = document.getElementById('swal-cliente-nombre');
            if (input) input.focus();

            const btnGps = document.getElementById('btn-gps-ubicacion');
            const feedbackGps = document.getElementById('gps-status-feedback');
            const inputRef = document.getElementById('swal-cliente-referencias');

            if (btnGps) {
                btnGps.addEventListener('click', () => {
                    if (!navigator.geolocation) {
                        if (feedbackGps) {
                            feedbackGps.className = 'small mt-1 text-muted fw-normal';
                            feedbackGps.classList.remove('d-none');
                            feedbackGps.innerText = 'Tu navegador o dispositivo no soporta geolocalización. Puedes escribir tu dirección normalmente.';
                        }
                        return;
                    }

                    btnGps.disabled = true;
                    btnGps.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" style="width: 0.65rem; height: 0.65rem;"></span> Obteniendo GPS...';

                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const lat = position.coords.latitude.toFixed(6);
                            const lng = position.coords.longitude.toFixed(6);
                            const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;

                            btnGps.disabled = false;
                            btnGps.className = 'btn btn-success btn-xs py-0 px-2 fw-normal text-white';
                            btnGps.style.borderRadius = '12px';
                            btnGps.innerHTML = '✅ GPS adjuntado';

                            if (feedbackGps) {
                                feedbackGps.className = 'small mt-1 text-success fw-semibold';
                                feedbackGps.classList.remove('d-none');
                                feedbackGps.innerHTML = `<i class="fas fa-check-circle me-1"></i> Ubicación GPS obtenida correctamente.`;
                            }

                            if (inputRef) {
                                const actual = inputRef.value.trim();
                                if (!actual.includes('maps.google.com')) {
                                    inputRef.value = actual ? `${actual} | GPS: ${mapsLink}` : `GPS: ${mapsLink}`;
                                }
                            }
                        },
                        (error) => {
                            btnGps.disabled = false;
                            btnGps.innerHTML = '<i class="fas fa-crosshairs text-danger me-1"></i> 📍 Compartir mi ubicación GPS actual';
                            if (feedbackGps) {
                                feedbackGps.className = 'small mt-1 text-muted fw-normal';
                                feedbackGps.classList.remove('d-none');
                                feedbackGps.innerText = 'No se pudo acceder al GPS. Puedes escribir tu dirección y entrecalles normalmente.';
                            }
                        },
                        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                    );
                });
            }
        },
        preConfirm: () => {
            const nombre = document.getElementById('swal-cliente-nombre')?.value.trim();
            const telefono = document.getElementById('swal-cliente-telefono')?.value.trim();
            const email = document.getElementById('swal-cliente-email')?.value.trim();
            const depto = document.getElementById('swal-cliente-departamento')?.value.trim();
            const direccion = document.getElementById('swal-cliente-direccion')?.value.trim();
            const referencias = document.getElementById('swal-cliente-referencias')?.value.trim();

            if (!nombre) {
                Swal.showValidationMessage('¡Por favor ingresa tu nombre y apellido!');
                return false;
            }
            if (!telefono) {
                Swal.showValidationMessage('¡Ingresa tu número de WhatsApp para contactarte!');
                return false;
            }
            if (!depto) {
                Swal.showValidationMessage('¡Selecciona tu Departamento de San Juan!');
                return false;
            }
            if (!direccion || direccion.length < 4) {
                Swal.showValidationMessage('¡Ingresa tu calle y número o barrio exacto!');
                return false;
            }
            if (!referencias || referencias.length < 3) {
                Swal.showValidationMessage('¡Indica entrecalles o referencias para el cadete en moto!');
                return false;
            }

            // Formato estructurado: [Departamento] - Dirección: [Calle, Nro, Entrecalles]
            const direccionCompleta = `${depto} - Dirección: ${direccion}, Entrecalles: ${referencias}`;
            return {
                nombre,
                telefono,
                email,
                depto,
                direccionExacta: direccion,
                referencias,
                direccion: direccionCompleta,
                tipoEntrega: 'ENVIO_MOTO_SAN_JUAN'
            };
        }
    });

    if (!formValues) {
        abrirCarritoDrawer();
        return;
    }

    TIPO_ENTREGA_SELECCIONADO = 'ENVIO_MOTO_SAN_JUAN';
    const costoEnvio = 0;

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
            clienteEmail: formValues.email || null,
            clienteDireccion: formValues.direccion,
            tipoEntrega: 'ENVIO_MOTO_SAN_JUAN',
            costoEnvio: costoEnvio,
            items: carrito.map(item => ({
                productoId: Number(item.id),
                talle: item.talle || 'Único',
                cantidad: Number(item.cantidad) || 1
            }))
        };

        const res = await fetch(API_CHECKOUT, {
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

        // Construir URL WhatsApp en caso de fallback si la API no la devolviera
        let waUrl = ordenResponse.whatsappUrl;
        if (!waUrl) {
            const tel = "5492646121771";
            let msg = `🛍️ *NUEVO PEDIDO: MY BELLA AFRODITA*\n`;
            msg += `🔖 *Código:* #${ordenResponse.codigoSeguimiento}\n`;
            msg += `------------------------------------------\n`;
            msg += `👤 *Cliente:* ${formValues.nombre}\n`;
            msg += `📱 *Teléfono:* ${formValues.telefono}\n`;
            msg += `🛵 *Entrega:* Envío en Moto a ${formValues.depto} - Dirección: ${formValues.direccionExacta}, ${formValues.referencias} (Costo de envío a coordinar)\n`;
            msg += `------------------------------------------\n`;
            msg += `📦 *Envío:* A cotizar por zona\n`;
            msg += `💰 *TOTAL PRENDAS: $${Number(ordenResponse.total).toLocaleString('es-AR')}*\n`;
            waUrl = `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
        }

        Swal.fire({
            icon: 'success',
            title: '¡Gracias por tu compra en Lencería Mi Bella Afrodita! 💕',
            html: `
                <div class="text-center py-2">
                    <div class="badge bg-dark px-3 py-1.5 my-2 font-monospace" style="font-size: 0.95rem; letter-spacing: 1px;">
                        Pedido #${ordenResponse.codigoSeguimiento}
                    </div>
                    <p class="text-muted small mt-2 mb-3" style="line-height: 1.6; font-size: 0.88rem;">
                        Tu pedido ha sido recibido con éxito en nuestro atelier online.<br>
                        <b>En breve nos comunicaremos a tu WhatsApp</b> para informarte el costo exacto del cadete en moto y coordinar el horario de entrega.
                    </p>
                    <div class="p-2.5 rounded bg-light border text-start small mb-2" style="font-size: 0.78rem;">
                        <div class="d-flex justify-content-between mb-1">
                            <span class="text-muted">Subtotal Prendas:</span>
                            <strong class="text-dark">$${Number(ordenResponse.total).toLocaleString('es-AR')}</strong>
                        </div>
                        <div class="d-flex justify-content-between mb-1">
                            <span class="text-muted">Envío en Moto:</span>
                            <span class="text-primary fw-semibold">A cotizar según tu zona</span>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span class="text-muted">Destino:</span>
                            <span class="text-truncate ps-2" style="max-width: 230px;">${formValues.depto}, ${formValues.direccionExacta}</span>
                        </div>
                    </div>
                </div>
            `,
            showConfirmButton: true,
            confirmButtonText: 'Entendido, muchas gracias',
            confirmButtonColor: '#121212',
            showCancelButton: true,
            cancelButtonText: '<i class="fab fa-whatsapp me-1 text-success"></i> Abrir WhatsApp (Opcional)',
            cancelButtonColor: '#706E6B'
        }).then((result) => {
            if (result.dismiss === Swal.DismissReason.cancel && waUrl) {
                window.open(waUrl, '_blank');
            }
        });

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

/* ==========================================================================
   MÓDULO DE RESEÑAS REALES DE CLIENTAS (EXPERIENCIA ATELIER)
   ========================================================================== */

const RESENAS_DEFAULT = [
    {
        nombreCliente: "Camila M.",
        departamento: "Capital",
        estrellas: 5,
        comentario: "La suavidad de las telas y el calce son impecables. La atención por WhatsApp para el talle fue excelente."
    },
    {
        nombreCliente: "Paula V.",
        departamento: "Rivadavia",
        estrellas: 5,
        comentario: "Me llegó en moto súper rápido y el empaque muy cuidado y discreto. Feliz con mi conjunto."
    },
    {
        nombreCliente: "Luciana R.",
        departamento: "Santa Lucía",
        estrellas: 5,
        comentario: "Hermosa lencería, los elásticos no marcan y la puntilla es de primera calidad."
    }
];

function obtenerIniciales(nombre) {
    if (!nombre) return "BA";
    const parts = nombre.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
}

function generarHtmlEstrellas(cantidad) {
    let html = '';
    const num = Math.max(1, Math.min(5, cantidad || 5));
    for (let i = 1; i <= 5; i++) {
        if (i <= num) {
            html += '<i class="fas fa-star"></i>';
        } else {
            html += '<i class="far fa-star text-muted opacity-50"></i>';
        }
    }
    return html;
}

window.cargarResenasDestacadas = async function () {
    const contenedor = document.getElementById("contenedor-resenas");
    if (!contenedor) return;

    try {
        const res = await fetch(API_RESENAS_DESTACADAS);
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                renderizarResenasCards(data);
                return;
            }
        }
    } catch (e) {
        console.warn("[RESEÑAS] No se pudo cargar /api/resenas/destacadas, usando testimonios predeterminados:", e);
    }

    // Si la API devuelve vacío o falla conexión, renderizamos los 3 por defecto
    renderizarResenasCards(RESENAS_DEFAULT);
};

let carruselResenasIndice = 0;
let carruselResenasInterval = null;
let carruselResenasTotalItems = 0;

function obtenerItemsVisiblesCarrusel() {
    if (window.innerWidth >= 992) return 3;
    if (window.innerWidth >= 768) return 2;
    return 1;
}

function renderizarResenasCards(lista) {
    const contenedor = document.getElementById("contenedor-resenas");
    if (!contenedor) return;

    carruselResenasTotalItems = lista.length;

    contenedor.innerHTML = lista.map(resena => {
        const iniciales = obtenerIniciales(resena.nombreCliente);
        const estrellasHtml = generarHtmlEstrellas(resena.estrellas);
        const depto = resena.departamento ? `${resena.departamento}, San Juan` : 'San Juan';

        return `
            <div class="review-slide-item">
                <div class="testimonial-card-boutique">
                    <div>
                        <div class="testimonial-stars">
                            ${estrellasHtml}
                        </div>
                        <p class="testimonial-quote">
                            "${resena.comentario}"
                        </p>
                    </div>
                    <div class="testimonial-author-wrap">
                        <div class="author-avatar-badge">${iniciales}</div>
                        <div>
                            <div class="author-name">${resena.nombreCliente}</div>
                            <div class="author-location"><i class="fas fa-map-marker-alt me-1" style="color: var(--gold-dark, #C5A059);"></i> ${depto}</div>
                        </div>
                        <span class="badge-verified-purchase">
                            <i class="fas fa-check-circle"></i> Verificada
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join("");

    inicializarCarruselResenas(lista.length);
}

window.inicializarCarruselResenas = function (total) {
    if (typeof total === 'number') {
        carruselResenasTotalItems = total;
    }
    carruselResenasIndice = 0;
    actualizarCarruselResenasUI();
    iniciarAutoPlayResenas();
};

window.moverCarruselResenas = function (direccion) {
    const visibles = obtenerItemsVisiblesCarrusel();
    const maxIndice = Math.max(0, carruselResenasTotalItems - visibles);
    if (maxIndice <= 0) return;

    carruselResenasIndice += direccion;
    if (carruselResenasIndice > maxIndice) {
        carruselResenasIndice = 0;
    } else if (carruselResenasIndice < 0) {
        carruselResenasIndice = maxIndice;
    }
    actualizarCarruselResenasUI();
    reiniciarAutoPlayResenas();
};

window.irACarruselResenas = function (indice) {
    const visibles = obtenerItemsVisiblesCarrusel();
    const maxIndice = Math.max(0, carruselResenasTotalItems - visibles);
    carruselResenasIndice = Math.max(0, Math.min(indice, maxIndice));
    actualizarCarruselResenasUI();
    reiniciarAutoPlayResenas();
};

function actualizarCarruselResenasUI() {
    const track = document.getElementById("contenedor-resenas");
    const dotsContainer = document.getElementById("reviewsCarouselDots");
    const btnPrev = document.getElementById("btnPrevResena");
    const btnNext = document.getElementById("btnNextResena");
    if (!track) return;

    const visibles = obtenerItemsVisiblesCarrusel();
    const maxIndice = Math.max(0, carruselResenasTotalItems - visibles);

    // Si la cantidad de testimonios cabe completa en pantalla, ocultamos flechas y dots
    if (carruselResenasTotalItems <= visibles) {
        if (btnPrev) btnPrev.style.display = 'none';
        if (btnNext) btnNext.style.display = 'none';
        if (dotsContainer) dotsContainer.style.display = 'none';
        track.style.transform = `translateX(0px)`;
        return;
    }

    if (btnPrev) btnPrev.style.display = 'flex';
    if (btnNext) btnNext.style.display = 'flex';
    if (dotsContainer) dotsContainer.style.display = 'flex';

    const slides = track.querySelectorAll(".review-slide-item");
    if (slides.length > 0 && slides[0]) {
        const slideWidth = slides[0].getBoundingClientRect().width;
        const gap = 24; // Mismo gap que CSS .reviews-carousel-track
        const desplazamiento = carruselResenasIndice * (slideWidth + gap);
        track.style.transform = `translateX(-${desplazamiento}px)`;
    }

    // Renderizar dots
    if (dotsContainer) {
        const totalDots = maxIndice + 1;
        let dotsHtml = '';
        for (let i = 0; i < totalDots; i++) {
            dotsHtml += `
                <button type="button" class="carousel-dot ${i === carruselResenasIndice ? 'active' : ''}" 
                        onclick="irACarruselResenas(${i})" 
                        aria-label="Ir a diapositiva ${i + 1}"></button>
            `;
        }
        dotsContainer.innerHTML = dotsHtml;
    }
}

function iniciarAutoPlayResenas() {
    detenerAutoPlayResenas();
    const visibles = obtenerItemsVisiblesCarrusel();
    if (carruselResenasTotalItems <= visibles) return;

    carruselResenasInterval = setInterval(() => {
        moverCarruselResenas(1);
    }, 5000);
}

function detenerAutoPlayResenas() {
    if (carruselResenasInterval) {
        clearInterval(carruselResenasInterval);
        carruselResenasInterval = null;
    }
}

function reiniciarAutoPlayResenas() {
    detenerAutoPlayResenas();
    iniciarAutoPlayResenas();
}

window.abrirModalResena = function () {
    const modalEl = document.getElementById("modalNuevaResena");
    if (!modalEl) return;

    const form = document.getElementById("formNuevaResena");
    if (form) form.reset();

    seleccionarEstrellas(5);
    const charCount = document.getElementById("charCountResena");
    if (charCount) charCount.textContent = "0";

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
};

window.seleccionarEstrellas = function (n) {
    const input = document.getElementById("resenaEstrellasInput");
    if (input) input.value = n;

    const stars = document.querySelectorAll("#starRatingSelector .star-item");
    stars.forEach(star => {
        const rating = parseInt(star.getAttribute("data-rating"), 10);
        if (rating <= n) {
            star.classList.add("active");
        } else {
            star.classList.remove("active");
        }
    });
};

window.enviarNuevaResena = async function (e) {
    e.preventDefault();

    const nombre = document.getElementById("resenaNombre")?.value?.trim();
    const depto = document.getElementById("resenaDepto")?.value?.trim();
    const estrellas = parseInt(document.getElementById("resenaEstrellasInput")?.value || "5", 10);
    const comentario = document.getElementById("resenaComentario")?.value?.trim();
    const btnSubmit = document.getElementById("btnEnviarResena");

    if (!nombre || !depto || !comentario) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos requeridos',
            text: 'Por favor completa todos los campos del formulario.',
            confirmButtonColor: '#9E2A4B'
        });
        return;
    }

    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Publicando...`;
    }

    try {
        const resp = await fetch(API_RESENAS, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nombreCliente: nombre,
                departamento: depto,
                estrellas: estrellas,
                comentario: comentario
            })
        });

        if (!resp.ok) {
            throw new Error(`Error en el servidor (${resp.status})`);
        }

        // Cerrar modal
        const modalEl = document.getElementById("modalNuevaResena");
        if (modalEl) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        }

        // Feedback positivo solicitado
        Swal.fire({
            icon: 'success',
            title: '¡Muchas Gracias!',
            text: '¡Gracias por compartir tu experiencia! Tu reseña será visible una vez validada.',
            confirmButtonColor: '#9E2A4B',
            confirmButtonText: 'Aceptar'
        });

    } catch (err) {
        console.error("Error al enviar reseña:", err);
        Swal.fire({
            icon: 'error',
            title: 'No se pudo enviar la reseña',
            text: 'Ocurrió un problema de comunicación. Por favor intenta nuevamente.',
            confirmButtonColor: '#9E2A4B'
        });
    } finally {
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `Publicar mi Reseña 💕`;
        }
    }
};

// Eventos del carrusel y contador de caracteres
document.addEventListener("DOMContentLoaded", () => {
    const textarea = document.getElementById("resenaComentario");
    const charCount = document.getElementById("charCountResena");
    if (textarea && charCount) {
        textarea.addEventListener("input", () => {
            charCount.textContent = textarea.value.length;
        });
    }

    const outer = document.getElementById("reviewsCarouselOuter");
    if (outer) {
        let touchStartX = 0;
        let touchStartY = 0;
        outer.addEventListener("mouseenter", detenerAutoPlayResenas);
        outer.addEventListener("mouseleave", iniciarAutoPlayResenas);
        outer.addEventListener("touchstart", (e) => {
            detenerAutoPlayResenas();
            if (e.touches && e.touches[0]) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            }
        }, { passive: true });
        outer.addEventListener("touchend", (e) => {
            iniciarAutoPlayResenas();
            if (e.changedTouches && e.changedTouches[0]) {
                const diffX = e.changedTouches[0].clientX - touchStartX;
                const diffY = e.changedTouches[0].clientY - touchStartY;
                // Si el gesto fue predominantemente horizontal y superó 40px
                if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
                    if (diffX < 0) {
                        moverCarruselResenas(1);
                    } else {
                        moverCarruselResenas(-1);
                    }
                }
            }
        }, { passive: true });
    }

    window.addEventListener("resize", () => {
        clearTimeout(window._resizeTimerResenas);
        window._resizeTimerResenas = setTimeout(() => {
            actualizarCarruselResenasUI();
        }, 150);
    });
});