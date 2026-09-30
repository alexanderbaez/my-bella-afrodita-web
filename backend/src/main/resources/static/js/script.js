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

// --- MÓDULO DE LOGÍSTICA & SELECCIÓN DE ENTREGA (EXCLUSIVO SAN JUAN) ---
let TIPO_ENTREGA_SELECCIONADO = 'RETIRO_SHOWROOM';
const COSTOS_ENVIO = {
    RETIRO_SHOWROOM: 0,
    ENVIO_MOTO_SAN_JUAN: 2500
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
        { id: 'card-ship-moto', tipo: 'ENVIO_MOTO_SAN_JUAN' }
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
                    <p class="text-muted small">Por favor, confirma que el servidor de Tienda Bella Afrodita esté activo en el puerto 8080.</p>
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
                                    onclick="agregarAlCarrito(event, '${p.id}')">
                                <i class="fas ${tieneStock ? 'fa-shopping-bag' : 'fa-times'} me-1.5"></i>
                                ${tieneStock ? 'Añadir a la Bolsa' : 'Agotado'}
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
            const res = await fetch('/api/productos/destacados');
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
                                    <button class="btn btn-add-boutique flex-grow-1" onclick="agregarAlCarrito(event, '${p.id}')">
                                        <i class="fas fa-shopping-bag me-1.5"></i> Añadir a la Bolsa
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

    const departamentosSanJuan = [
        "Capital", "Rawson", "Rivadavia", "Santa Lucía", "Chimbas",
        "Pocito", "Caucete", "Albardón", "Sarmiento", "25 de Mayo",
        "San Martín", "Angaco", "Zonda", "Ullum", "9 de Julio",
        "Jáchal", "Valle Fértil", "Iglesia", "Calingasta"
    ];

    const { value: formValues } = await Swal.fire({
        title: 'Checkout · San Juan Boutique',
        html: `
            <div class="text-start">
                <p class="text-muted small mb-3" style="letter-spacing: 0.2px; font-size: 0.77rem;">
                    <i class="fas fa-lock me-1 text-success"></i> Compra directa sin registros. Entregas exclusivas en la Provincia de San Juan.
                </p>
                <div class="mb-2.5">
                    <label class="form-label small fw-bold text-uppercase" style="font-size: 0.69rem; letter-spacing: 0.6px;">1. Nombre y Apellido *</label>
                    <input type="text" id="swal-cliente-nombre" class="form-control form-control-sm" placeholder="Ej: Valentina Gómez" autocomplete="name">
                </div>
                <div class="mb-2.5">
                    <label class="form-label small fw-bold text-uppercase" style="font-size: 0.69rem; letter-spacing: 0.6px;">2. WhatsApp / Teléfono de contacto *</label>
                    <input type="tel" id="swal-cliente-telefono" class="form-control form-control-sm" placeholder="Ej: 264 555-1234" autocomplete="tel">
                </div>
                <div class="mb-2.5">
                    <label class="form-label small fw-bold text-uppercase" style="font-size: 0.69rem; letter-spacing: 0.6px;">3. Email <span class="text-muted fw-normal">(Opcional)</span></label>
                    <input type="email" id="swal-cliente-email" class="form-control form-control-sm" placeholder="Ej: valentina@email.com" autocomplete="email">
                </div>
                <div class="mb-2.5">
                    <label class="form-label small fw-bold text-uppercase" style="font-size: 0.69rem; letter-spacing: 0.6px;">4. Método de Entrega (San Juan) *</label>
                    <select id="swal-tipo-entrega" class="form-select form-select-sm mb-1.5" onchange="window.actualizarModalEnvio(this.value)">
                        <option value="RETIRO_SHOWROOM" ${TIPO_ENTREGA_SELECCIONADO === 'RETIRO_SHOWROOM' ? 'selected' : ''}>1) Retiro en Showroom / Punto Físico (Gratis)</option>
                        <option value="ENVIO_MOTO_SAN_JUAN" ${TIPO_ENTREGA_SELECCIONADO === 'ENVIO_MOTO_SAN_JUAN' ? 'selected' : ''}>2) Envío en Moto / Cadetería (San Juan - $2.500)</option>
                    </select>
                </div>
                <div id="swal-cadeteria-fields" class="${TIPO_ENTREGA_SELECCIONADO === 'RETIRO_SHOWROOM' ? 'd-none' : ''}">
                    <div class="mb-2.5">
                        <label class="form-label small fw-bold text-uppercase" style="font-size: 0.69rem; letter-spacing: 0.6px;">5. Departamento (San Juan) *</label>
                        <select id="swal-cliente-departamento" class="form-select form-select-sm">
                            <option value="">Selecciona tu departamento...</option>
                            ${departamentosSanJuan.map(d => `<option value="${d}">${d}</option>`).join('')}
                        </select>
                    </div>
                    <div class="mb-2.5">
                        <label class="form-label small fw-bold text-uppercase" style="font-size: 0.69rem; letter-spacing: 0.6px;">6. Dirección Exacta (Calle y Altura / Barrio / Mza) *</label>
                        <input type="text" id="swal-cliente-direccion" class="form-control form-control-sm" placeholder="Ej: Av. Libertador 1250 Oeste, Piso 2 B">
                    </div>
                    <div class="mb-2">
                        <label class="form-label small fw-bold text-uppercase" style="font-size: 0.69rem; letter-spacing: 0.6px;">7. Entrecalles y Referencias para la Cadetería *</label>
                        <input type="text" id="swal-cliente-referencias" class="form-control form-control-sm" placeholder="Ej: Entre Urquiza y Paula A. de Sarmiento. Portón negro">
                        <small class="text-muted" style="font-size:0.67rem;">Indispensable para que la moto de cadetería ubique tu domicilio sin demoras.</small>
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

            window.actualizarModalEnvio = function(tipo) {
                const cadeteriaContainer = document.getElementById('swal-cadeteria-fields');
                if (cadeteriaContainer) {
                    if (tipo === 'ENVIO_MOTO_SAN_JUAN') {
                        cadeteriaContainer.classList.remove('d-none');
                    } else {
                        cadeteriaContainer.classList.add('d-none');
                    }
                }
            };
        },
        preConfirm: () => {
            const nombre = document.getElementById('swal-cliente-nombre')?.value.trim();
            const telefono = document.getElementById('swal-cliente-telefono')?.value.trim();
            const email = document.getElementById('swal-cliente-email')?.value.trim();
            const tipoEntrega = document.getElementById('swal-tipo-entrega')?.value || TIPO_ENTREGA_SELECCIONADO;

            if (!nombre) {
                Swal.showValidationMessage('¡Por favor ingresa tu nombre completo!');
                return false;
            }
            if (!telefono) {
                Swal.showValidationMessage('¡Ingresa tu número de WhatsApp para contactarte!');
                return false;
            }

            let direccionCompleta = 'Retiro en Showroom / Punto Físico';
            if (tipoEntrega === 'ENVIO_MOTO_SAN_JUAN') {
                const depto = document.getElementById('swal-cliente-departamento')?.value.trim();
                const direccion = document.getElementById('swal-cliente-direccion')?.value.trim();
                const referencias = document.getElementById('swal-cliente-referencias')?.value.trim();

                if (!depto) {
                    Swal.showValidationMessage('¡Selecciona el departamento de San Juan para el envío en moto!');
                    return false;
                }
                if (!direccion || direccion.length < 5) {
                    Swal.showValidationMessage('¡Ingresa la calle y número o barrio para la cadetería!');
                    return false;
                }
                if (!referencias || referencias.length < 4) {
                    Swal.showValidationMessage('¡Indica entrecalles o referencias visuales para la moto de cadetería!');
                    return false;
                }

                direccionCompleta = `${direccion} (Depto: ${depto}) - Ref: ${referencias}`;
            }

            return { nombre, telefono, email, direccion: direccionCompleta, tipoEntrega };
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
            clienteEmail: formValues.email || null,
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