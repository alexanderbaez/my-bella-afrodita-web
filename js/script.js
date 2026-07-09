/* ==========================================================================
   LÓGICA DE NEGOCIO OPTIMIZADA V2 - MY BELLA AFRODITA (BOUTIQUE UX STYLE)
   ========================================================================== */

const WHATSAPP_NUMBER = '5492646121771';
let carrito = JSON.parse(localStorage.getItem('myBellaCarrito')) || [];
let avisoMayoristaMostrado = JSON.parse(localStorage.getItem('avisoMayoristaMostrado')) || false;
let talleFiltroActivo = 'TODOS'; // Estado global del filtro de talles

document.addEventListener('DOMContentLoaded', () => {
    // Aplicar el fondo del :root al body
    document.body.style.backgroundColor = "var(--brand-bg)";

    actualizarContadorUI();

    if (typeof PRODUCTOS === 'undefined') return;

    const contenedor = document.getElementById("contenedor-productos");
    if (contenedor) {
        // 1. CAPTURAMOS LA CATEGORÍA DESDE LA URL (ej: catalogo.html?cat=bombachas)
        const urlParams = new URLSearchParams(window.location.search);
        const categoriaBuscada = urlParams.get('cat'); 

        // 2. CAMBIAMOS EL TÍTULO VISUAL SEGÚN LA CATEGORÍA
        const tituloSeccion = document.querySelector('.section-title');
        const txtSubtitulo = document.querySelector('.text-uppercase.small.fw-bold');
        const breadcrumbActive = document.querySelector('.breadcrumb-item.active');

        if (categoriaBuscada) {
            if (categoriaBuscada === 'bombachas') {
                if (tituloSeccion) tituloSeccion.innerText = "Bombachas, Colaless y Vedetinas";
                if (txtSubtitulo) txtSubtitulo.innerText = "Colección Íntima";
                if (breadcrumbActive) breadcrumbActive.innerText = "Bombachas";
                document.title = "Bombachas - My Bella Afrodita";
            } else if (categoriaBuscada === 'conjuntos') {
                if (tituloSeccion) tituloSeccion.innerText = "Conjuntos Exclusivos";
                if (txtSubtitulo) txtSubtitulo.innerText = "Colección Premium";
                if (breadcrumbActive) breadcrumbActive.innerText = "Conjuntos";
                document.title = "Conjuntos - My Bella Afrodita";
            } else if (categoriaBuscada === 'hombres') {
                if (tituloSeccion) tituloSeccion.innerText = "Boxers y Slips";
                if (txtSubtitulo) txtSubtitulo.innerText = "Colección Essential";
                if (breadcrumbActive) breadcrumbActive.innerText = "Para Ellos";
                document.title = "Hombres - My Bella Afrodita";
            } else if (categoriaBuscada === 'medias') {
                if (tituloSeccion) tituloSeccion.innerText = "Medias para Él y Ella";
                if (txtSubtitulo) txtSubtitulo.innerText = "Esenciales";
                if (breadcrumbActive) breadcrumbActive.innerText = "Medias";
                document.title = "Medias - My Bella Afrodita";
            }

            // 3. FILTRAMOS TU ARRAY DE PRODUCTOS
            const filtrados = PRODUCTOS.filter(p => p.categoria.toLowerCase() === categoriaBuscada);
            dibujarProductos(filtrados);
        } else {
            if (tituloSeccion) tituloSeccion.innerText = "Nuestro Catálogo Completo";
            dibujarProductos(PRODUCTOS);
        }
    }

    const modalCarrito = document.getElementById('cartModal');
    if (modalCarrito) {
        modalCarrito.addEventListener('show.bs.modal', renderizarListaCarrito);
    }

    // Detectar si vienen desde un link compartido de un producto específico (Quick View / Detalle Directo)
    const urlParamsShared = new URLSearchParams(window.location.search);
    const productoId = urlParamsShared.get('id');
    if (productoId) {
        setTimeout(() => {
            if (typeof mostrarDetalleProducto === 'function') {
                mostrarDetalleProducto(productoId);
            }
        }, 500);
    }
});

// --- CÁLCULO DE TOTALES (EVALÚA MINORISTA VS MAYORISTA Y CALCULA AHORRO) ---
function calcularTotalCarrito() {
    let totalGeneral = 0;
    let totalBaseMinorista = 0; // Para saber cuánto habría gastado sin descuento
    let unidadesTotales = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    let cumpleCriterioCantidad = unidadesTotales >= 3;
    let detallesPromo = [];
    let aplicoAlgunaPromocion = false;

    carrito.forEach(item => {
        const p = PRODUCTOS.find(prod => prod.id === item.id);
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
        esMayorista: aplicoAlgunaPromocion
    };
}

function dibujarProductos(lista) {
    const contenedor = document.getElementById("contenedor-productos");
    if (!contenedor) return;
    contenedor.innerHTML = "";

    if (lista.length === 0) {
        contenedor.innerHTML = `<div class="col-12 text-center py-5 text-muted">No se encontraron productos en esta categoría.</div>`;
        return;
    }

    const fragmento = document.createDocumentFragment();

    lista.forEach(p => {
        const tieneStock = p.stock !== false;
        const tallesProducto = p.talles ? p.talles : [];
        const divCol = document.createElement("div");
        
        // Espaciado exterior de la grilla en móviles
        divCol.className = "col-6 col-md-4 col-lg-3 mb-3 d-flex align-items-stretch product-item-card px-1 px-sm-2"; 
        divCol.setAttribute('data-talles', tallesProducto.join(','));

        if (talleFiltroActivo !== 'TODOS' && !tallesProducto.includes(talleFiltroActivo)) {
            divCol.classList.add('d-none');
        }

        const htmlPrecios = p.precioMayorista ? `
            <div class="price-container mb-2 p-1.5 w-100" style="background-color: var(--brand-nude, #fdf4f2); border-radius: 6px;">
                <div class="row g-0 align-items-center text-center">
                    <div class="col-6 border-end" style="border-color: rgba(0,0,0,0.1) !important;">
                        <small class="text-muted text-uppercase d-block" style="font-size: 0.5rem; letter-spacing: 0.3px;">Min.</small>
                        <span class="fw-bold text-dark" style="font-size: 0.75rem;">$${p.precioMinorista.toLocaleString('es-AR')}</span>
                    </div>
                    <div class="col-6">
                        <small class="text-uppercase d-block fw-bold" style="font-size: 0.5rem; color: var(--brand-accent, #d4af37); letter-spacing: 0.3px;">May. (3+)</small>
                        <span class="fw-bold" style="color: var(--brand-primary, #b33939); font-size: 0.75rem;">$${p.precioMayorista.toLocaleString('es-AR')}</span>
                    </div>
                </div>
            </div>` : `
            <div class="price-container mb-2 p-1.5 text-center w-100">
                <small class="text-muted text-uppercase d-block" style="font-size: 0.5rem; letter-spacing: 0.5px;">Precio Único</small>
                <span class="fw-bold text-dark" style="font-size: 0.95rem;">$${p.precioMinorista.toLocaleString('es-AR')}</span>
            </div>`;

        const htmlTallesBadge = tallesProducto.length > 0 ? `
            <div class="position-absolute start-0 top-0 m-1.5" style="z-index: 4;">
                <div class="d-flex flex-wrap gap-1">
                    ${tallesProducto.map(t => `<span class="badge bg-white text-dark border font-monospace px-1 py-0.5" style="font-size: 0.5rem; opacity: 0.9; border-color: rgba(0,0,0,0.08) !important; border-radius: 3px; font-weight: 500;">T.${t}</span>`).join('')}
                </div>
            </div>` : '';

        let htmlUrgenciaBadge = '';
        if (p.etiqueta) {
            const esStock = p.etiqueta.toUpperCase().includes('STOCK') || p.etiqueta.toUpperCase().includes('ÚLTIM') || p.etiqueta.toUpperCase().includes('VUELA');
            const colorFondo = esStock ? '#000000' : '#c5a059'; 
            
            htmlUrgenciaBadge = `
                <div class="position-absolute end-0 top-0 m-1.5" style="z-index: 4;">
                    <span class="badge text-white px-1.5 py-0.5" style="background-color: ${colorFondo}; font-size: 0.5rem; font-weight: 600; letter-spacing: 0.5px; border-radius: 3px; text-transform: uppercase; font-family: 'Montserrat', sans-serif;">
                        ${p.etiqueta}
                    </span>
                </div>`;
        }

        divCol.innerHTML = `
            <div class="product-card shadow-sm w-100 d-flex flex-column position-relative" 
                 style="background: #fff; border-radius: 8px !important; overflow: hidden !important; border: 1px solid rgba(0,0,0,0.04); padding: 0 !important;">
                
                ${htmlTallesBadge}
                ${htmlUrgenciaBadge} 
                
                <!-- FOTO DE BORDE A BORDE ESTRICTO: Sin márgenes ni paddings -->
                <div class="card-img-container position-relative w-100" 
                     style="height: calc(180px + (170 * (100vw - 320px) / 880)); min-height: 190px; max-height: 380px; overflow: hidden; background: #fafafa; margin: 0 !important; padding: 0 !important;">
                    <div class="product-carousel-track d-flex h-100" style="width: 100%; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; -webkit-overflow-scrolling: touch; margin: 0; padding: 0;">
                        ${p.imagenes.map((img, i) => `
                            <div class="carousel-slide h-100" style="flex: 0 0 100%; width: 100%; scroll-snap-align: start; margin: 0; padding: 0;">
                                <img src="${img}" class="w-100 h-100 object-fit-cover btn-zoom" 
                                     data-index="${i}" style="cursor: zoom-in; display: block; width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important;" alt="${p.nombre}">
                            </div>
                        `).join('')}
                    </div>
                    <div class="indicators position-absolute bottom-0 start-50 translate-middle-x mb-1.5 d-flex gap-1" style="z-index: 5;">
                        ${p.imagenes.map((_, i) => `<div class="dot-ui" style="width: 4px; height: 4px; border-radius: 50%; background: #fff; opacity: ${i === 0 ? '1' : '0.4'}; transition: 0.3s;"></div>`).join('')}
                    </div>
                </div>

                <!-- CONTENEDOR DE TEXTOS: El padding solo se aplica acá abajo -->
                <div class="d-flex flex-column p-2 text-center flex-grow-1 justify-content-between" style="background: #ffffff; width: 100%;">
                    <div>
                        <h5 class="text-uppercase mb-1" style="font-family: 'Playfair Display', serif; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.3px; color: var(--color-pasión, #1a1a1a); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.nombre}</h5>
                        <p class="text-muted small mb-2" style="font-size: 0.65rem; line-height: 1.2; height: 32px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${p.descripcion || ''}</p>
                    </div>
                    
                    <div>
                        ${htmlPrecios}

                        <div class="actions w-100">
                            <button class="btn btn-whatsapp w-100 mb-1 border-0 py-1" style="font-size: 0.55rem; background: #f8f9fa; color: #555; border-radius: 4px; letter-spacing: 0.3px;">
                                <i class="fab fa-whatsapp me-1 text-success"></i> COMPARTIR
                            </button>
                            <button class="btn w-100 py-1 fw-bold text-uppercase" 
                                    style="background: ${tieneStock ? 'var(--color-pasión, #1a1a1a)' : '#ccc'}; color: #fff; border: none; border-radius: 4px; font-size: 0.6rem; letter-spacing: 0.3px;" 
                                    ${!tieneStock ? 'disabled' : ''}
                                    onclick="agregarAlCarrito(event, '${p.id}')">
                                <i class="fas ${tieneStock ? 'fa-shopping-bag' : 'fa-times'} me-1" style="font-size: 0.55rem;"></i> 
                                ${tieneStock ? 'Añadir' : 'Sin Stock'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;

        const track = divCol.querySelector('.product-carousel-track');
        const dots = divCol.querySelectorAll('.dot-ui');
        
        if (track && dots.length > 0) {
            track.addEventListener('scroll', () => {
                const index = Math.round(track.scrollLeft / track.offsetWidth);
                dots.forEach((dot, i) => dot.style.opacity = (i === index) ? '1' : '0.4');
            });
        }

        divCol.querySelector('.btn-whatsapp').onclick = (e) => {
            e.stopPropagation();
            const msg = `¡Mira este modelo en My Bella Afrodita!\n*${p.nombre}*\nPrecio: $${p.precioMinorista.toLocaleString('es-AR')}\nLink: ${window.location.href}?id=${p.id}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
        };

        divCol.querySelectorAll('.btn-zoom').forEach(img => {
            img.onclick = (e) => {
                e.stopPropagation();
                abrirZoomLenceria(p.imagenes, parseInt(img.dataset.index));
            };
        });

        fragmento.appendChild(divCol);
    });

    contenedor.appendChild(fragmento);
}

// --- FILTRO DE TALLES DINÁMICO DESDE LA UI ---
window.filtrarPorTalle = function(talleSeleccionado) {
    talleFiltroActivo = talleSeleccionado;
    
    // Alternar clases activas de los botones de la interfaz
    const botones = document.querySelectorAll('#filtro-talles-container .btn');
    botones.forEach(btn => {
        if (btn.innerText === talleSeleccionado) {
            btn.classList.remove('btn-outline-dark');
            btn.classList.add('btn-dark');
        } else {
            btn.classList.remove('btn-dark');
            btn.classList.add('btn-outline-dark');
        }
    });

    // Cambiar la visualización de las tarjetas directamente en el DOM
    const tarjetas = document.querySelectorAll('.product-item-card');
    let visibles = 0;

    tarjetas.forEach(tarjeta => {
        const tallesString = tarjeta.getAttribute('data-talles') || "";
        const listaTalles = tallesString ? tallesString.split(',') : [];

        if (talleSeleccionado === 'TODOS' || listaTalles.includes(talleSeleccionado)) {
            tarjeta.classList.remove('d-none');
            visibles++;
        } else {
            tarjeta.classList.add('d-none');
        }
    });

    // Control de aviso de talle sin stock
    const contenedor = document.getElementById("contenedor-productos");
    const avisoExistente = document.getElementById("aviso-sin-stock-talle");
    if (avisoExistente) avisoExistente.remove();

    if (visibles === 0 && contenedor) {
        const aviso = document.createElement("div");
        aviso.id = "aviso-sin-stock-talle";
        aviso.className = "col-12 text-center py-5 text-muted small";
        aviso.innerHTML = `<i class="fas fa-info-circle me-1"></i> Por el momento no contamos con modelos disponibles en Talle ${talleSeleccionado}.`;
        contenedor.appendChild(aviso);
    }
};

// --- ZOOM DEL PRODUCTO ---
function abrirZoomLenceria(imagenes, indexInicial) {
    const modal = document.createElement('div');
    modal.id = "lenceria-zoom-modal";
    Object.assign(modal.style, {
        position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.95)', zIndex: '9999', display: 'flex', flexDirection: 'column',
        touchAction: 'none'
    });

    modal.innerHTML = `
        <div style="position: absolute; top: 20px; right: 20px; z-index: 10001;">
            <button id="close-zoom" style="background: rgba(255,255,255,0.2); border: none; color: white; font-size: 1.5rem; width: 45px; height: 45px; border-radius: 50%; cursor: pointer;">&times;</button>
        </div>

        ${imagenes.length > 1 ? `
            <button id="prev-zoom" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); z-index: 10001; background: rgba(255,255,255,0.1); border: none; color: white; padding: 15px; cursor: pointer; border-radius: 8px;">
                <i class="fas fa-chevron-left"></i>
            </button>
            <button id="next-zoom" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); z-index: 10001; background: rgba(255,255,255,0.1); border: none; color: white; padding: 15px; cursor: pointer; border-radius: 8px;">
                <i class="fas fa-chevron-right"></i>
            </button>
        ` : ''}

        <div id="zoom-track" style="display: flex; height: 100%; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; scroll-behavior: smooth;">
            ${imagenes.map(src => `
                <div style="flex: 0 0 100vw; height: 100vh; scroll-snap-align: start; display: flex; align-items: center; justify-content: center; overflow: auto;">
                    <img src="${src}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
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

// --- LÓGICA DE NOTIFICACIÓN FLOTANTE (AGREGADO AL CARRITO) ---
function mostrarNotificacion(nombreProducto) {
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: '¡Añadido a la bolsa!',
        text: nombreProducto,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        background: '#fff',
        color: '#1a1a1a',
        iconColor: '#b33939', 
        width: '320px', 
        customClass: {
            popup: 'notification-boutique-toast'
        },
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
            toast.style.fontSize = '0.85rem'; 
        }
    });
}

// --- RENDERIZAR LISTA DENTRO DEL CARRITO (CON PROGRESOS Y AHORROS VISUALES) ---
window.renderizarListaCarrito = function () {
    const container = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    if (!container) return;

    if (carrito.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="mb-3" style="font-size: 2rem; opacity: 0.15; color: var(--color-pasión, #1a1a1a);">
                    <i class="fas fa-shopping-bag"></i>
                </div>
                <h6 class="text-uppercase fw-normal text-muted" style="font-size: 0.75rem; letter-spacing: 1.5px;">Tu bolsa de compras está vacía</h6>
                <button class="btn btn-dark btn-sm mt-3 px-4 text-uppercase" 
                        data-bs-dismiss="modal" style="letter-spacing: 1.2px; font-size: 0.65rem; background: var(--color-pasión, #1a1a1a); border: none; border-radius: 0px;">
                    Explorar Colección
                </button>
            </div>`;
        if (totalElement) totalElement.innerHTML = '$0';
        
        actualizarBarrasProgresoUX(0, 0);
        return;
    }

    const res = calcularTotalCarrito();
    const unidadesTotales = carrito.reduce((acc, i) => acc + i.cantidad, 0);

    actualizarBarrasProgresoUX(unidadesTotales, res.ahorro);

    let cartHtml = `
        <div class="d-flex justify-content-between align-items-center mb-4 pb-2" style="border-bottom: 1px solid rgba(0,0,0,0.06);">
            <span class="text-uppercase text-muted" style="font-size: 0.65rem; letter-spacing: 1.2px; font-weight: 500;">
                ${unidadesTotales} ${unidadesTotales === 1 ? 'Artículo' : 'Artículos'} en tu bolsa
            </span>
            <button class="btn btn-link text-muted text-decoration-none p-0 hover-opacity" 
                    onclick="confirmarVaciarCarrito()" style="font-size: 0.65rem; letter-spacing: 1.2px; font-weight: 500; text-transform: uppercase;">
                <i class="fas fa-trash-alt me-1" style="font-size: 0.6rem;"></i> Vaciar Bolsa
            </button>
        </div>
    `;

    carrito.forEach((item, index) => {
        const p = PRODUCTOS.find(prod => prod.id === item.id);
        let precioAplicado = (unidadesTotales >= 3 && p?.precioMayorista) ? p.precioMayorista : (p?.precioMinorista || item.precio);

        cartHtml += `
            <div class="row align-items-center mb-3 g-2 py-2" style="border-bottom: 1px solid rgba(0,0,0,0.03);">
                <!-- Imagen del Producto -->
                <div class="col-3 col-sm-2">
                    <div style="position: relative; padding-top: 120%; width: 100%; overflow: hidden; background: #fafafa; border: 1px solid rgba(0,0,0,0.04);">
                        <img src="${item.imagen}" class="position-absolute top-0 start-0 w-100 h-100 object-fit-cover">
                    </div>
                </div>
                
                <!-- Detalles del Producto -->
                <div class="col-5 col-sm-6 ps-2">
                    <p class="mb-0 text-dark fw-semibold text-uppercase" style="font-size: 0.75rem; line-height: 1.3; letter-spacing: 0.3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.nombre}</p>
                    <span class="text-muted d-block mt-0.5" style="font-size: 0.7rem; letter-spacing: 0.3px;">$${precioAplicado.toLocaleString('es-AR')} c/u</span>
                    <button class="btn btn-link text-muted p-0 border-0 bg-transparent mt-1" 
                            style="font-size: 0.65rem; text-decoration: none; letter-spacing: 0.5px; opacity: 0.7;" 
                            onclick="eliminarDelCarrito(${index})">
                        Quitar
                    </button>
                </div>
                
                <!-- Controles de Cantidad y Subtotal -->
                <div class="col-4 text-end">
                    <div class="d-flex align-items-center justify-content-end mb-1">
                        <div class="d-flex align-items-center border px-1" style="border-color: rgba(0,0,0,0.12) !important; background: #fff; height: 26px;">
                            <button class="btn btn-sm p-0 border-0 text-muted" style="width:22px; font-size: 0.8rem; line-height: 1;" onclick="cambiarCantidad(${index}, -1)">−</button>
                            <span class="px-2 font-monospace text-dark" style="font-size: 0.7rem; min-width: 20px; text-align: center; font-weight: 500;">${item.cantidad}</span>
                            <button class="btn btn-sm p-0 border-0 text-muted" style="width:22px; font-size: 0.8rem; line-height: 1 darkened;" onclick="cambiarCantidad(${index}, 1)">+</button>
                        </div>
                    </div>
                    <div class="fw-semibold text-dark mt-1" style="font-size: 0.8rem; letter-spacing: 0.3px;">
                        $${(precioAplicado * item.cantidad).toLocaleString('es-AR')}
                    </div>
                </div>
            </div>`;
    });

    container.innerHTML = cartHtml;

    if (totalElement) {
        totalElement.innerHTML = `
            <div class="text-end w-100 mt-2">
                ${res.promos.map(p => `
                    <div class="text-success fw-medium mb-2" style="font-size: 0.7rem; letter-spacing: 0.5px;">
                        <i class="fas fa-check-circle me-1"></i> ${p}
                    </div>`).join('')}
                
                ${res.esMayorista && res.ahorro > 0 ? `
                    <div id="ux-savings-container" class="p-2.5 mb-3 text-center text-success" style="background-color: rgba(40, 167, 69, 0.05); border: 1px solid rgba(40, 167, 69, 0.15); font-size: 0.7rem; letter-spacing: 0.3px; font-weight: 500;">
                        ¡Excelente! Estás ahorrando $${res.ahorro.toLocaleString('es-AR')} con la tarifa Mayorista.
                    </div>` : ''}

                ${!res.esMayorista ? `
                    <div class="p-2.5 mb-3 text-center" style="background-color: rgba(26, 26, 26, 0.02); border: 1px dashed rgba(0,0,0,0.15); font-size: 0.7rem; color: #444; letter-spacing: 0.3px;">
                        Agregá <strong style="color: var(--color-pasión, #1a1a1a); font-size: 0.75rem;">${3 - unidadesTotales}</strong> ${3 - unidadesTotales === 1 ? 'prenda' : 'prendas'} más para acceder al <span class="fw-bold text-dark">Precio Mayorista</span>
                    </div>` : ''}
                
                <div class="d-flex justify-content-between align-items-center mt-3 pt-2" style="border-top: 1px solid rgba(0,0,0,0.06);">
                    <span class="text-muted text-uppercase" style="font-size: 0.65rem; letter-spacing: 1.2px; font-weight: 500;">Subtotal estimado</span>
                    <span class="fw-bold" style="font-size: 1.25rem; color: #000; letter-spacing: 0.5px;">$${res.total.toLocaleString('es-AR')}</span>
                </div>
                
                <p class="text-muted text-start mt-3 mb-0 p-2.5" style="font-size: 0.62rem; line-height: 1.4; background: #fafafa; border: 1px solid rgba(0,0,0,0.04); color: #777 !important;">
                    <i class="fas fa-info-circle text-dark me-1" style="opacity: 0.6;"></i> El pedido se procesará mediante nuestra plataforma de asistencia en WhatsApp. Coordinaremos los métodos de entrega y opciones de transferencia de forma personalizada.
                </p>
            </div>`;
    }
}
// --- ACTUALIZADOR DINÁMICO DE BARRAS DE PROGRESO DE BOOTSTRAP (UX ACCIÓN DE VENTA) ---
function actualizarBarrasProgresoUX(unidades, ahorro) {
    const progressBarFill = document.getElementById('ux-progress-bar-fill');
    const progressText = document.getElementById('ux-progress-text');
    const progressPercent = document.getElementById('ux-progress-percent');
    
    if (!progressBarFill) return; // Si no está renderizado en el DOM, previene errores

    if (unidades === 0) {
        progressBarFill.style.width = '0%';
        if (progressText) progressText.innerHTML = 'Agregá prendas para activar el descuento mayorista.';
        if (progressPercent) progressPercent.innerText = '0/3';
        return;
    }

    if (unidades >= 3) {
        progressBarFill.style.width = '100%';
        progressBarFill.classList.remove('bg-dark');
        progressBarFill.classList.add('bg-success'); // Verde premium de logro activado
        
        if (progressText) progressText.innerHTML = '¡Felicidades! Activaste el precio Mayorista 🎁';
        if (progressPercent) progressPercent.innerText = `${unidades} prendas`;
    } else {
        const faltantes = 3 - unidades;
        const porcentaje = (unidades / 3) * 100;
        
        progressBarFill.style.width = `${porcentaje}%`;
        progressBarFill.classList.remove('bg-success');
        progressBarFill.classList.add('bg-dark'); // Negro boutique elegante por defecto
        
        if (progressText) progressText.innerHTML = `¡Estás a solo <b>${faltantes} ${faltantes === 1 ? 'prenda' : 'prendas'}</b> del descuento Mayorista! 🔥`;
        if (progressPercent) progressPercent.innerText = `${unidades}/3`;
    }
}

// --- CONTROLES DE ARRAY ---
window.agregarAlCarrito = function (event, id) {
    if (event) event.stopPropagation();
    const p = PRODUCTOS.find(prod => prod.id === id);
    if (!p) return;
    const existe = carrito.find(item => item.id === id);
    if (existe) {
        existe.cantidad++;
    } else {
        carrito.push({ id: p.id, nombre: p.nombre, precio: p.precioMinorista, imagen: p.imagenes[0], cantidad: 1 });
    }
    actualizarYGuardar();
    
    // 1. Mostrar cartel bonito de agregado en cualquier sección del sitio
    mostrarNotificacion(p.nombre);
    
    // 2. Verificar si saltó al hito mayorista
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

// --- ALERTA GLOBAL DE PRECIO MAYORISTA (DISEÑO TÁCTIL) ---
function verificarHitoMayorista() {
    const { esMayorista } = calcularTotalCarrito();
    
    if (esMayorista && !avisoMayoristaMostrado) {
        Swal.fire({
            toast: true, 
            position: 'top-end', 
            icon: 'success',
            title: '¡BENEFICIO MAYORISTA ACTIVADO! 🎁',
            text: 'Toda tu orden pasó a Precio Mayorista.',
            showConfirmButton: false, 
            timer: 3500, 
            timerProgressBar: true,
            background: '#fff',
            color: '#1a1a1a',
            iconColor: '#28a745', 
            width: '320px', 
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
                toast.style.fontSize = '0.85rem';
            }
        });
        avisoMayoristaMostrado = true;
        localStorage.setItem('avisoMayoristaMostrado', true);
    } else if (!esMayorista) {
        avisoMayoristaMostrado = false;
        localStorage.setItem('avisoMayoristaMostrado', false);
    }
}

window.confirmarVaciarCarrito = function () {
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
            avisoMayoristaMostrado = false;
            localStorage.setItem('avisoMayoristaMostrado', false);
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
    
    if (ocultarFalta) return;

    const { esMayorista } = calcularTotalCarrito();
    
    // Cambiar color del contador a verde celebrativo si se activa el descuento mayorista
    if (esMayorista) {
        contador.style.backgroundColor = "#28a745";
        // Pequeño impulso visual de celebración
        contador.style.transform = "scale(1.2)";
        contador.style.transition = "transform 0.3s ease";
    } else {
        contador.style.backgroundColor = "#1a1a1a";
        contador.style.transform = "scale(1)";
    }
}

function enviarPedidoWhatsApp() {
    if (carrito.length === 0) {
        Swal.fire({
            title: "Bolsa vacía", 
            text: "Por favor selecciona al menos una prenda antes de finalizar.", 
            icon: "warning",
            confirmButtonColor: '#1a1a1a'
        });
        return;
    }

    // 🔥 DESTRABAR FOCO: Cerramos el modal del carrito para liberar el teclado del navegador
    const modalElement = document.getElementById('cartModal');
    if (modalElement) {
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
            modalInstance.hide();
        }
    }

    // Ahora SweetAlert se abre en una pantalla limpia y recupera el control absoluto
    Swal.fire({
        title: '¿A nombre de quién dejamos el pedido?',
        input: 'text',
        inputPlaceholder: 'Escribí tu nombre y apellido...',
        showCancelButton: true,
        confirmButtonText: 'Enviar por WhatsApp',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#777',
        borderRadius: '0',
        didOpen: () => {
            // Ponemos el cursor listo automáticamente
            const input = Swal.getInput();
            if (input) input.focus();
        },
        inputValidator: (value) => {
            if (!value) {
                return '¡Necesitamos tu nombre para procesar la orden!'
            }
        }
    }).then((result) => {
        // Si el usuario cancela la ventana del nombre, volvemos a abrir el carrito para que no se pierda
        if (result.isDismissed || result.isDenied) {
            if (modalElement) {
                const modalInstance = new bootstrap.Modal(modalElement);
                modalInstance.show();
            }
            return;
        }

        if (result.isConfirmed) {
            const nombreCliente = result.value;
            const { total, esMayorista, ahorro } = calcularTotalCarrito();
            const unidadesTotales = carrito.reduce((acc, item) => acc + item.cantidad, 0);
            const cumpleCriterioGral = unidadesTotales >= 3;

            let mensaje = "*PEDIDO: MY BELLA AFRODITA*\n";
            mensaje += "------------------------------------------\n\n";
            
            mensaje += `👤 *Cliente:* ${nombreCliente}\n\n`;

            carrito.forEach((item) => {
                const p = PRODUCTOS.find(prod => prod.id === item.id);
                let precioAplicado = (cumpleCriterioGral && p?.precioMayorista) ? p.precioMayorista : (p?.precioMinorista || item.precio);
                let etiqueta = (cumpleCriterioGral && p?.precioMayorista) ? " (Mayorista)" : "";

                mensaje += `*${item.nombre.toUpperCase()}*\n`;
                mensaje += `   Cant: ${item.cantidad} x $${precioAplicado.toLocaleString('es-AR')}${etiqueta}\n`;
                mensaje += `   Subtotal: $${(precioAplicado * item.cantidad).toLocaleString('es-AR')}\n\n`;
            });

            mensaje += `------------------------------------------\n`;
            mensaje += ` *TOTAL ESTIMADO: $${total.toLocaleString('es-AR')}*\n`;
            
            if (esMayorista) {
                mensaje += ` _Beneficio mayorista aplicado por llevar 3 o más prendas._\n`;
                if (ahorro > 0) {
                    mensaje += ` _¡Ahorro total de esta compra: $${ahorro.toLocaleString('es-AR')}!_\n`;
                }
            }
            
            mensaje += `\n📍 _San Juan, Argentina_`;

            window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`, "_blank");
        }
    });
}