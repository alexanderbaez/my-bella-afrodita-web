/* ==========================================================================
   ADMIN.JS - BACKOFFICE & GESTIÓN DE CATÁLOGO (MY BELLA AFRODITA)
   ========================================================================== */

const API_BASE = '/api/productos';
const API_ORDENES = '/api/ordenes';
const AUTH_STATUS_URL = '/api/auth/status';
const AUTH_ME_URL = '/api/auth/me';
const AUTH_LOGOUT_URL = '/api/auth/logout';
const UPLOAD_API = '/api/upload';
const API_RESENAS = '/api/resenas/admin';

function normalizarUrlImagen(url) {
    if (!url) return 'https://via.placeholder.com/80x100?text=Sin+Foto';
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

let listaProductos = [];
let listaOrdenes = [];
let pestanaActiva = 'productos';
let modalInstancia = null;
let modalDetallePedidoInstancia = null;
let imagenesProductoActual = [];

/**
 * Sanitiza texto contra ataques XSS convirtiendo caracteres especiales en entidades HTML seguras.
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Sanitiza URLs externas para enlaces de mapas permitiendo solo dominios de Google Maps legítimos.
 */
function sanitizarUrlMapas(url) {
    if (!url) return '#';
    const trimmed = String(url).trim();
    if (trimmed.startsWith('https://www.google.com/maps') || trimmed.startsWith('https://maps.google.com')) {
        return encodeURI(trimmed);
    }
    return '#';
}

async function verificarSesionAdmin() {
    try {
        const res = await fetch(AUTH_ME_URL, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
        });

        if (res.status === 401 || res.status === 403) {
            manejarNoAutorizado('Sesión vencida o no autorizada.');
            return null;
        }

        const data = await res.json();
        if (!res.ok || !data.authenticated || data.rol !== 'ROLE_ADMIN') {
            manejarNoAutorizado('Acceso restringido: requiere rol de Administrador.');
            return null;
        }

        sessionStorage.setItem('myBellaAdminUser', JSON.stringify(data));
        return data;
    } catch (e) {
        // En caso de error de red o fallback
        try {
            const resFallback = await fetch(AUTH_STATUS_URL, { credentials: 'include' });
            const dataFallback = await resFallback.json();
            if (resFallback.ok && dataFallback.authenticated && dataFallback.rol === 'ROLE_ADMIN') {
                sessionStorage.setItem('myBellaAdminUser', JSON.stringify(dataFallback));
                return dataFallback;
            }
        } catch (_) {}

        manejarNoAutorizado('No se pudo verificar la sesión con el atelier.');
        return null;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const adminUser = await verificarSesionAdmin();
    if (!adminUser) return;

    const emailElem = document.getElementById('admin-user-email');
    if (emailElem && adminUser.email) {
        emailElem.innerText = adminUser.email;
    }

    modalInstancia = new bootstrap.Modal(document.getElementById('modalProducto'));
    const modalPedidoElem = document.getElementById('modalDetallePedido');
    if (modalPedidoElem) {
        modalDetallePedidoInstancia = new bootstrap.Modal(modalPedidoElem);
    }

    // Configurar Drag & Drop en la Dropzone de Fotos
    const dropzone = document.getElementById('dropzone-fotos');
    if (dropzone) {
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.remove('dragover');
            }, false);
        });

        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files && files.length > 0) {
                subirArchivos(files);
            }
        }, false);
    }

    // Buscador y filtro de categorías de productos en tiempo real
    const inputBusqueda = document.getElementById('filtro-busqueda');
    const selectCategoria = document.getElementById('filtro-categoria');
    if (inputBusqueda) inputBusqueda.addEventListener('input', filtrarYRenderizar);
    if (selectCategoria) selectCategoria.addEventListener('change', filtrarYRenderizar);

    // Buscador y filtro de estados de órdenes en tiempo real
    const inputBusquedaPedidos = document.getElementById('filtro-pedidos-busqueda');
    const selectEstadoPedidos = document.getElementById('filtro-pedidos-estado');
    if (inputBusquedaPedidos) inputBusquedaPedidos.addEventListener('input', filtrarYRenderizarPedidos);
    if (selectEstadoPedidos) selectEstadoPedidos.addEventListener('change', filtrarYRenderizarPedidos);

    // Buscador y filtro de reseñas en tiempo real
    const inputBusquedaResenas = document.getElementById('filtro-resenas-busqueda');
    const selectEstadoResenas = document.getElementById('filtro-resenas-estado');
    if (inputBusquedaResenas) inputBusquedaResenas.addEventListener('input', filtrarYRenderizarResenas);
    if (selectEstadoResenas) selectEstadoResenas.addEventListener('change', filtrarYRenderizarResenas);

    // Cargar productos, órdenes y reseñas
    cargarProductos();
    cargarOrdenes();
    cargarResenasAdmin();
});

// --- PESTAÑAS: PRODUCTOS VS PEDIDOS VS RESEÑAS ---
window.cambiarPestana = function (pestana) {
    pestanaActiva = pestana;
    const btnProd = document.getElementById('tab-btn-productos');
    const btnPed = document.getElementById('tab-btn-pedidos');
    const btnRes = document.getElementById('tab-btn-resenas');
    const secProd = document.getElementById('seccion-productos');
    const secPed = document.getElementById('seccion-pedidos');
    const secRes = document.getElementById('seccion-resenas');
    const topAction = document.getElementById('btn-top-action-container');

    if (btnProd) btnProd.classList.remove('active');
    if (btnPed) btnPed.classList.remove('active');
    if (btnRes) btnRes.classList.remove('active');

    if (secProd) secProd.classList.add('d-none');
    if (secPed) secPed.classList.add('d-none');
    if (secRes) secRes.classList.add('d-none');

    if (pestana === 'productos') {
        if (btnProd) btnProd.classList.add('active');
        if (secProd) secProd.classList.remove('d-none');
        if (topAction) topAction.innerHTML = `
            <button id="btnNuevoProducto" class="btn-atelier-cta shadow-sm" onclick="abrirModalCrearProducto()">
                + Cargar Nueva Prenda ✨
            </button>`;
    } else if (pestana === 'pedidos') {
        if (btnPed) btnPed.classList.add('active');
        if (secPed) secPed.classList.remove('d-none');
        if (topAction) topAction.innerHTML = `
            <button class="btn btn-outline-dark btn-sm shadow-sm py-2 px-3 fw-bold" onclick="cargarOrdenes()">
                <i class="fas fa-sync-alt me-1.5"></i> Actualizar Pedidos
            </button>`;
        cargarOrdenes();
    } else if (pestana === 'resenas') {
        if (btnRes) btnRes.classList.add('active');
        if (secRes) secRes.classList.remove('d-none');
        if (topAction) topAction.innerHTML = `
            <button class="btn btn-outline-dark btn-sm shadow-sm py-2 px-3 fw-bold" onclick="cargarResenasAdmin()">
                <i class="fas fa-sync-alt me-1.5"></i> Actualizar Reseñas
            </button>`;
        cargarResenasAdmin();
    }
};

window.cerrarSesionAdmin = async function () {
    try {
        await fetch(AUTH_LOGOUT_URL, { method: 'POST', credentials: 'include' });
    } catch (e) {
        console.error("Error al cerrar sesión:", e);
    }
    sessionStorage.removeItem('myBellaAdminUser');
    localStorage.removeItem('myBellaAdminUser');
    window.location.href = '/login.html';
};

// --- OBTENER PRODUCTOS DESDE LA API ---
async function cargarProductos() {
    const tbody = document.getElementById('tabla-productos-body');
    if (!tbody) return;

    try {
        const res = await fetch(API_BASE);
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        
        listaProductos = await res.json();
        actualizarMetricas(listaProductos);
        filtrarYRenderizar();

        // Si se abrió desde la tienda con ?editProduct=<id>, abrir modal automáticamente
        const editId = new URLSearchParams(window.location.search).get('editProduct');
        if (editId) {
            setTimeout(() => {
                abrirModalEditar(editId);
            }, 300);
        }
    } catch (error) {
        console.error("Error al cargar productos:", error);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5 text-danger">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    <p class="fw-bold mb-1">No se pudo conectar con el servidor backend.</p>
                    <small class="text-muted">Asegúrate de que el servidor Spring Boot esté en ejecución.</small>
                </td>
            </tr>`;
    }
}

// --- ACTUALIZAR MÉTRICAS DEL PANEL ---
function actualizarMetricas(productos) {
    const total = productos.length;
    const enStock = productos.filter(p => p.stock !== false).length;
    const sinStock = total - enStock;
    const categorias = new Set(productos.map(p => p.categoria?.toLowerCase())).size;

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-en-stock').innerText = enStock;
    document.getElementById('stat-sin-stock').innerText = sinStock;
    document.getElementById('stat-categorias').innerText = categorias;
}

// --- FILTRADO Y RENDERIZADO DE TABLA ---
function filtrarYRenderizar() {
    const texto = (document.getElementById('filtro-busqueda')?.value || '').toLowerCase().trim();
    const categoria = document.getElementById('filtro-categoria')?.value || '';

    const filtrados = listaProductos.filter(p => {
        const coincideTexto = !texto || 
            (p.nombre && p.nombre.toLowerCase().includes(texto)) || 
            (p.descripcion && p.descripcion.toLowerCase().includes(texto));
        const coincideCategoria = !categoria || 
            (p.categoria && p.categoria.toLowerCase() === categoria.toLowerCase());
        return coincideTexto && coincideCategoria;
    });

    renderizarTabla(filtrados);

    const contador = document.getElementById('contador-productos-mostrados');
    if (contador) {
        contador.innerText = `Mostrando ${filtrados.length} de ${listaProductos.length} productos`;
    }
}

function renderizarTabla(productos) {
    const tbody = document.getElementById('tabla-productos-body');
    if (!tbody) return;

    if (productos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-5 text-muted">
                    No se encontraron productos con los filtros aplicados.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = productos.map(p => {
        const fotoPrincipal = (p.imagenes && p.imagenes.length > 0) 
            ? normalizarUrlImagen(p.imagenes[0]) 
            : 'https://via.placeholder.com/80x100?text=Sin+Foto';

        const variantes = Array.isArray(p.variantes) ? p.variantes : [];
        const stockTotal = variantes.length > 0
            ? variantes.reduce((acc, v) => acc + (v.stock || 0), 0)
            : (p.stock !== false ? 1 : 0);

        const hayCritico = variantes.length > 0 && variantes.some(v => (v.stock || 0) < 2);
        const criticoBadge = hayCritico 
            ? `<span class="badge-stock-critico d-block mt-1">STOCK CRÍTICO</span>` 
            : '';

        const tallesHtml = variantes.length > 0
            ? variantes.map(v => {
                let badgeClass = 'badge-talle-ok';
                if (v.stock === 0) {
                    badgeClass = 'badge-talle-cero';
                } else if (v.stock < 2) {
                    badgeClass = 'badge-talle-critico';
                }
                return `
                    <span class="badge-talle ${badgeClass} me-1 mb-1" 
                          title="Stock disponible: ${v.stock} unidades">
                        ${v.talle}: ${v.stock}u
                    </span>`;
            }).join('')
            : ((p.talles && p.talles.length > 0) 
                ? p.talles.map(t => `<span class="badge-talle badge-talle-ok me-1 mb-1">${t}</span>`).join('') 
                : '<span class="text-muted small">-</span>');

        const etiquetaHtml = p.etiqueta 
            ? `<span class="badge bg-dark ms-1" style="font-size: 0.6rem;">${p.etiqueta}</span>` 
            : '';

        const precioMay = p.precioMayorista 
            ? `$${Number(p.precioMayorista).toLocaleString('es-AR')}` 
            : '<span class="text-muted">-</span>';

        return `
            <tr data-id="${p.id}">
                <td>
                    <div class="thumb-img-wrapper" title="${p.nombre}">
                        <img src="${fotoPrincipal}" alt="${p.nombre}" class="thumb-img" onerror="this.src='https://via.placeholder.com/80x100?text=Foto'">
                    </div>
                </td>
                <td>
                    <div class="fw-bold text-dark text-uppercase" style="font-size: 0.85rem;">
                        ${p.nombre} ${etiquetaHtml}
                    </div>
                    <div class="text-muted small text-truncate" style="max-width: 280px; font-size: 0.75rem;">
                        ${p.descripcion || 'Sin descripción'}
                    </div>
                </td>
                <td>
                    <span class="badge bg-light text-dark border text-uppercase" style="font-size: 0.7rem; letter-spacing: 0.5px;">
                        ${p.categoria}
                    </span>
                </td>
                <td class="fw-bold text-dark">
                    $${Number(p.precioMinorista).toLocaleString('es-AR')}
                </td>
                <td class="fw-bold" style="color: #b33939;">
                    ${precioMay}
                </td>
                <td>
                    <div class="d-flex flex-wrap gap-1" style="max-width: 220px;">
                        ${tallesHtml}
                    </div>
                </td>
                <td class="text-center">
                    <button type="button" 
                            class="btn btn-sm ${p.destacadoInicio ? 'btn-warning text-dark fw-bold' : 'btn-outline-secondary text-muted'}" 
                            style="border-radius: 20px; font-size: 0.72rem; padding: 2px 10px;"
                            onclick="alternarDestacadoProducto('${p.id}')"
                            title="${p.destacadoInicio ? 'Destacado en Inicio (clic para quitar)' : 'No destacado (clic para destacar en inicio)'}">
                        <i class="fas fa-star ${p.destacadoInicio ? '' : 'text-secondary'}"></i> ${p.destacadoInicio ? 'Sí' : 'No'}
                    </button>
                </td>
                <td class="text-center">
                    <div class="fw-bold ${stockTotal === 0 ? 'text-danger' : (hayCritico ? 'text-warning' : 'text-success')}" style="font-size: 0.85rem;">
                        ${stockTotal} u.
                    </div>
                    ${criticoBadge}
                    <div class="form-check form-switch d-inline-block mt-1">
                        <input class="form-check-input" type="checkbox" role="switch" 
                               ${p.stock !== false && stockTotal > 0 ? 'checked' : ''} 
                               onchange="toggleStock('${p.id}', this)"
                               title="Click para alternar disponibilidad">
                    </div>
                </td>
                <td class="text-end text-nowrap">
                    <button class="btn-action-pill btn-action-edit me-1" onclick="editarProducto('${p.id}')" title="Editar prenda">
                        <i class="fas fa-pencil-alt"></i> Editar
                    </button>
                    <button class="btn-action-pill btn-action-del-pill" onclick="eliminarProducto('${p.id}', '${p.nombre.replace(/'/g, "\\'")}')" title="Eliminar prenda">
                        <i class="fas fa-trash-alt"></i> Borrar
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// --- TOGGLE STOCK EN TIEMPO REAL (PATCH) ---
async function toggleStock(id, switchElem) {
    try {
        const res = await fetch(`${API_BASE}/${id}/toggle-stock`, {
            method: 'PATCH',
            credentials: 'include'
        });

        if (res.status === 401 || res.status === 403) {
            switchElem.checked = !switchElem.checked;
            manejarNoAutorizado('Sesión vencida o no autorizada para modificar stock.');
            return;
        }

        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

        const productoActualizado = await res.json();
        
        // Actualizar en el arreglo local
        const index = listaProductos.findIndex(p => String(p.id) === String(id));
        if (index !== -1) {
            listaProductos[index].stock = productoActualizado.stock;
            actualizarMetricas(listaProductos);
        }

        const estadoTxt = productoActualizado.stock ? 'EN STOCK' : 'SIN STOCK';
        const colorToast = productoActualizado.stock ? '#28a745' : '#6c757d';

        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: `${productoActualizado.nombre}`,
            text: `Estado actualizado a: ${estadoTxt}`,
            showConfirmButton: false,
            timer: 2000,
            iconColor: colorToast,
            width: '320px'
        });
    } catch (error) {
        console.error("Error al alternar stock:", error);
        switchElem.checked = !switchElem.checked;
        Swal.fire({
            icon: 'error',
            title: 'Error de Conexión',
            text: 'No se pudo actualizar el stock del producto en el servidor.'
        });
    }
}

// --- ALTERNAR DESTACADO EN INICIO ---
window.alternarDestacadoProducto = async function (id) {
    try {
        const res = await fetch(`${API_BASE}/${id}/toggle-destacado`, {
            method: 'PATCH',
            credentials: 'include'
        });

        if (res.status === 401 || res.status === 403) {
            manejarNoAutorizado('Sesión vencida. Ingresa como administrador para modificar destacados.');
            return;
        }

        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

        const productoActualizado = await res.json();
        
        // Actualizar en el arreglo local
        const index = listaProductos.findIndex(p => String(p.id) === String(id));
        if (index !== -1) {
            listaProductos[index].destacadoInicio = productoActualizado.destacadoInicio;
        }

        filtrarYRenderizar();

        const estadoTxt = productoActualizado.destacadoInicio ? '⭐ Visible en Inicio' : 'No destacado';
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `${productoActualizado.nombre}`,
            text: `Destacado en Inicio: ${estadoTxt}`,
            showConfirmButton: false,
            timer: 2000,
            iconColor: '#b38b4d',
            width: '320px'
        });
    } catch (error) {
        console.error("Error al alternar destacado:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error de Servidor',
            text: 'No se pudo actualizar el estado de destacado en el servidor.'
        });
    }
};

// --- PRESETS DE TALLES POR CATEGORÍA ---
const TALLES_PRESETS = {
    conjuntos: ['85', '90', '95', '100', '105'],
    bombachas: ['1', '2', '3', '4'],
    hombres: ['S', 'M', 'L', 'XL', 'XXL'],
    medias: ['ÚNICO']
};

// --- RENDERIZADO DINÁMICO DE CHIPS DE TALLES ---
function renderizarChipsTalles(categoria, tallesActivos = [], mapaStock = {}) {
    const container = document.getElementById('talles-chips-container');
    if (!container) return;

    const catKey = (categoria || 'conjuntos').toLowerCase();
    const presets = TALLES_PRESETS[catKey] || ['S', 'M', 'L', 'XL'];

    // Unir presets con talles activos previos o personalizados sin duplicados
    const todosTalles = [...presets];
    tallesActivos.forEach(t => {
        if (!todosTalles.includes(t)) {
            todosTalles.push(t);
        }
    });

    container.innerHTML = todosTalles.map(talle => {
        const activo = tallesActivos.includes(talle);
        const esCustom = !presets.includes(talle);
        return `
            <span class="talle-chip ${activo ? 'active' : ''}" 
                  data-talle="${talle}" 
                  data-custom="${esCustom ? 'true' : 'false'}"
                  onclick="toggleTalleChip(this)"
                  title="${activo ? 'Clic para desactivar talle' : 'Clic para activar talle'}">
                ${talle}
            </span>
        `;
    }).join('');

    actualizarGridInputsVariantes(mapaStock);
}

// --- TOGGLE DE TALLES SUGERIDOS (ACTIVAR / DESACTIVAR CON 1 CLIC) ---
window.toggleTalleChip = function (chip) {
    const estaActivo = chip.classList.contains('active');
    const talle = chip.getAttribute('data-talle');

    // Capturar stock actual de los inputs visibles
    const mapaActual = {};
    document.querySelectorAll('#variantes-stock-grid .input-stock-talle').forEach(input => {
        const t = input.getAttribute('data-talle');
        mapaActual[t] = input.value;
    });

    if (estaActivo) {
        // Al hacer clic en un talle que está ACTIVO:
        // Cambia su estado a INACTIVO y elimina automáticamente de la matriz su cajita de stock
        chip.classList.remove('active');
        delete mapaActual[talle];
    } else {
        // Al hacer clic en un talle que está INACTIVO:
        // Cambia a ACTIVO y crea de inmediato su cajita de stock numérico con valor inicial (1)
        chip.classList.add('active');
        if (mapaActual[talle] === undefined) {
            mapaActual[talle] = 1;
        }
    }

    actualizarGridInputsVariantes(mapaActual);
};

// --- QUITAR TALLE RÁPIDO DESDE EL BOTÓN '×' DE LA TARJETA DE STOCK ---
window.quitarTalle = function (talle) {
    const categoria = (document.getElementById('prod-categoria')?.value || 'conjuntos').toLowerCase();
    const presets = TALLES_PRESETS[categoria] || [];
    const esPreset = presets.includes(talle);

    const chip = document.querySelector(`#talles-chips-container .talle-chip[data-talle="${talle}"]`);
    if (chip) {
        if (esPreset) {
            // Si pertenecía a los sugeridos, apaga su chip poniéndolo en gris
            chip.classList.remove('active');
        } else {
            // Si era un talle personalizado (ej: XL, 110), lo elimina completamente de la lista
            chip.remove();
        }
    }

    // Capturar stock de los demás talles excluyendo el eliminado
    const mapaActual = {};
    document.querySelectorAll('#variantes-stock-grid .input-stock-talle').forEach(input => {
        const t = input.getAttribute('data-talle');
        if (t !== talle) {
            mapaActual[t] = input.value;
        }
    });

    actualizarGridInputsVariantes(mapaActual);
};

window.cambiarCategoriaEnModal = function (nuevaCategoria) {
    // Capturar stock actual para conservar valores coincidentes
    const mapaActual = {};
    document.querySelectorAll('#variantes-stock-grid .input-stock-talle').forEach(input => {
        mapaActual[input.getAttribute('data-talle')] = input.value;
    });

    const catKey = (nuevaCategoria || 'conjuntos').toLowerCase();
    const presets = TALLES_PRESETS[catKey] || ['85', '90', '95', '100', '105'];
    renderizarChipsTalles(nuevaCategoria, presets, mapaActual);
};

window.agregarTalleCustom = function () {
    const input = document.getElementById('nuevo-talle-custom');
    if (!input) return;
    const valor = input.value.trim().toUpperCase();
    if (!valor) return;

    const container = document.getElementById('talles-chips-container');
    let chipExistente = container.querySelector(`.talle-chip[data-talle="${valor}"]`);
    if (chipExistente) {
        chipExistente.classList.add('active');
    } else {
        const nuevoSpan = document.createElement('span');
        nuevoSpan.className = 'talle-chip active';
        nuevoSpan.setAttribute('data-talle', valor);
        nuevoSpan.setAttribute('data-custom', 'true');
        nuevoSpan.innerText = valor;
        nuevoSpan.title = 'Clic para desactivar talle';
        nuevoSpan.onclick = function () { toggleTalleChip(this); };
        container.appendChild(nuevoSpan);
    }
    input.value = '';

    // Asignar valor inicial 1 si no tenía
    const mapaActual = {};
    document.querySelectorAll('#variantes-stock-grid .input-stock-talle').forEach(inp => {
        mapaActual[inp.getAttribute('data-talle')] = inp.value;
    });
    if (mapaActual[valor] === undefined) {
        mapaActual[valor] = 1;
    }

    actualizarGridInputsVariantes(mapaActual);
};

// --- GRID DINÁMICO DE INVENTARIO POR TALLE ---
function actualizarGridInputsVariantes(mapaValores = {}) {
    const grid = document.getElementById('variantes-stock-grid');
    if (!grid) return;

    // Guardar valores existentes
    const valoresActuales = { ...mapaValores };
    grid.querySelectorAll('.input-stock-talle').forEach(input => {
        const t = input.getAttribute('data-talle');
        if (valoresActuales[t] === undefined) {
            valoresActuales[t] = input.value;
        }
    });

    grid.innerHTML = '';
    const chipsActivos = document.querySelectorAll('#talles-chips-container .talle-chip.active');

    if (chipsActivos.length === 0) {
        grid.innerHTML = '<div class="col-12 text-muted small py-2 text-center" style="font-size: 0.75rem;"><i class="fas fa-info-circle me-1"></i> Ningún talle activo. Haz clic en los chips de arriba para activar talles con stock.</div>';
        return;
    }

    chipsActivos.forEach(chip => {
        const talle = chip.getAttribute('data-talle');
        const valorStock = valoresActuales[talle] !== undefined ? valoresActuales[talle] : 1;

        const col = document.createElement('div');
        col.className = 'col-6 col-sm-4 col-md-3';
        col.id = `col-stock-talle-${talle}`;
        col.innerHTML = `
            <div class="stock-talle-card p-2 bg-white rounded-3 shadow-none position-relative">
                <button type="button" class="btn-quitar-talle" onclick="quitarTalle('${talle}')" title="Eliminar talle ${talle}">×</button>
                <div class="d-flex align-items-center gap-1 mb-1 pe-3">
                    <span class="badge" style="background-color: #9E2A4B; font-size: 0.68rem;">Talle ${talle}</span>
                    <small class="text-muted" style="font-size: 0.65rem;">Stock</small>
                </div>
                <input type="number" min="0" value="${valorStock}" 
                       class="form-control form-control-sm input-stock-talle text-center fw-bold" 
                       data-talle="${talle}" placeholder="0" required>
            </div>
        `;
        grid.appendChild(col);
    });
}

// --- FUNCIONES LIVE PREVIEW DE IMAGEN ---
function actualizarLivePreview(url) {
    const img = document.getElementById('img-live-preview');
    const placeholder = document.getElementById('live-preview-placeholder');
    const box = document.getElementById('live-preview-wrapper');
    if (!img || !placeholder || !box) return;

    const normalized = normalizarUrlImagen(url);
    if (url && typeof url === 'string' && url.trim().length > 4) {
        img.src = normalized;
        img.classList.remove('d-none');
        placeholder.classList.add('d-none');
        box.classList.add('has-image');
    } else {
        img.src = '';
        img.classList.add('d-none');
        placeholder.classList.remove('d-none');
        box.classList.remove('has-image');
    }
}

window.mostrarPlaceholderLivePreview = function () {
    const img = document.getElementById('img-live-preview');
    const placeholder = document.getElementById('live-preview-placeholder');
    const box = document.getElementById('live-preview-wrapper');
    if (img) img.classList.add('d-none');
    if (placeholder) placeholder.classList.remove('d-none');
    if (box) box.classList.remove('has-image');
};

window.actualizarPreviewDesdeUrl = function (url) {
    actualizarLivePreview(url);
};

window.agregarUrlDesdeInput = function () {
    const input = document.getElementById('prod-imagen-url-input');
    const val = input ? normalizarUrlImagen(input.value.trim()) : '';
    if (val && !imagenesProductoActual.includes(val)) {
        imagenesProductoActual.push(val);
        renderizarGaleriaPreview();
    }
};

// --- MODAL: CREAR PRODUCTO ---
function abrirModalCrear() {
    if (!modalInstancia) {
        const el = document.getElementById('modalProducto');
        if (el && window.bootstrap) modalInstancia = new bootstrap.Modal(el);
    }
    document.getElementById('form-producto').reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('modalProductoLabel').innerHTML = '<i class="fas fa-sparkles me-2" style="color: #C5A059;"></i> Cargar Nueva Prenda ✨';
    document.getElementById('btn-submit-producto').innerHTML = '<i class="fas fa-save me-1.5"></i> Guardar Prenda en Catálogo 💕';
    
    const inputUrl = document.getElementById('prod-imagen-url-input');
    if (inputUrl) inputUrl.value = '';
    actualizarLivePreview('');

    // Categoría inicial por defecto y sus chips de talles
    const catInicial = document.getElementById('prod-categoria').value || 'conjuntos';
    const presetsIniciales = TALLES_PRESETS[catInicial] || ['85', '90', '95', '100', '105'];
    renderizarChipsTalles(catInicial, presetsIniciales, {});

    document.getElementById('prod-stock').checked = true;
    const destCheck = document.getElementById('prod-destacadoInicio');
    if (destCheck) destCheck.checked = false;

    // Resetear galería de imágenes
    imagenesProductoActual = [];
    renderizarGaleriaPreview();
    
    const progress = document.getElementById('upload-progress-container');
    if (progress) progress.classList.add('d-none');

    if (modalInstancia) modalInstancia.show();
}

// --- MODAL: EDITAR PRODUCTO ---
function abrirModalEditar(id) {
    if (!modalInstancia) {
        const el = document.getElementById('modalProducto');
        if (el && window.bootstrap) modalInstancia = new bootstrap.Modal(el);
    }
    const p = listaProductos.find(prod => String(prod.id) === String(id));
    if (!p) return;

    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-nombre').value = p.nombre || '';
    const cat = (p.categoria || 'conjuntos').toLowerCase();
    document.getElementById('prod-categoria').value = cat;
    document.getElementById('prod-descripcion').value = p.descripcion || '';
    document.getElementById('prod-precioMinorista').value = p.precioMinorista || '';
    document.getElementById('prod-precioMayorista').value = p.precioMayorista || '';
    document.getElementById('prod-etiqueta').value = p.etiqueta || '';
    document.getElementById('prod-stock').checked = p.stock !== false;
    const destCheck = document.getElementById('prod-destacadoInicio');
    if (destCheck) destCheck.checked = Boolean(p.destacadoInicio);

    // Talles y variantes
    const mapaStock = {};
    const tallesActivos = [];

    if (Array.isArray(p.variantes) && p.variantes.length > 0) {
        p.variantes.forEach(v => {
            tallesActivos.push(v.talle);
            mapaStock[v.talle] = v.stock;
        });
    } else if (Array.isArray(p.talles)) {
        p.talles.forEach(t => {
            tallesActivos.push(t);
            mapaStock[t] = 5;
        });
    }

    renderizarChipsTalles(cat, tallesActivos, mapaStock);

    // Imágenes
    imagenesProductoActual = Array.isArray(p.imagenes) ? [...p.imagenes] : [];
    const inputUrl = document.getElementById('prod-imagen-url-input');
    if (inputUrl) inputUrl.value = imagenesProductoActual[0] || '';
    actualizarLivePreview(imagenesProductoActual[0] || '');
    renderizarGaleriaPreview();

    document.getElementById('modalProductoLabel').innerHTML = `<i class="fas fa-edit me-2" style="color: #C5A059;"></i> Editar Prenda #${p.id}`;
    document.getElementById('btn-submit-producto').innerHTML = '<i class="fas fa-sync-alt me-1.5"></i> Guardar Prenda en Catálogo 💕';

    if (modalInstancia) modalInstancia.show();
}

// --- SUBIDA ASÍNCRONA DE IMÁGENES AL BACKEND ---
window.manejarSeleccionArchivos = function (event) {
    const files = event.target.files;
    if (files && files.length > 0) {
        subirArchivos(files);
    }
    event.target.value = '';
};

async function subirArchivos(files) {
    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-progress-bar');
    const statusText = document.getElementById('upload-status-text');
    const statusPct = document.getElementById('upload-status-pct');

    if (progressContainer) progressContainer.classList.remove('d-none');

    const total = files.length;
    let subidos = 0;
    let errores = 0;

    for (let i = 0; i < total; i++) {
        const file = files[i];
        if (statusText) statusText.innerText = `Subiendo ${file.name} (${i + 1}/${total})...`;
        
        const pct = Math.round(((i) / total) * 100);
        if (progressBar) progressBar.style.width = `${pct}%`;
        if (statusPct) statusPct.innerText = `${pct}%`;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(UPLOAD_API, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            if (res.status === 401 || res.status === 403) {
                manejarNoAutorizado('Sesión vencida. Ingresa como administrador para subir fotos.');
                return;
            }

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `HTTP ${res.status}`);
            }

            const data = await res.json();
            const urlFinal = data.relativePath || data.url;
            if (urlFinal) {
                imagenesProductoActual.push(normalizarUrlImagen(urlFinal));
                subidos++;
            }
        } catch (error) {
            console.error("Error subiendo archivo:", file.name, error);
            errores++;
        }
    }

    if (progressBar) progressBar.style.width = '100%';
    if (statusPct) statusPct.innerText = '100%';
    if (statusText) statusText.innerText = `Subida finalizada (${subidos} exitosa${subidos === 1 ? '' : 's'}${errores > 0 ? `, ${errores} error${errores === 1 ? '' : 'es'}` : ''}).`;

    setTimeout(() => {
        if (progressContainer) progressContainer.classList.add('d-none');
    }, 2000);

    renderizarGaleriaPreview();

    if (subidos > 0) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `${subidos} foto${subidos === 1 ? '' : 's'} subida${subidos === 1 ? '' : 's'} al servidor`,
            showConfirmButton: false,
            timer: 2000
        });
    }
}

// --- RENDERIZAR GALERÍA DE PREVIEWS (ASPECT RATIO 3:4 + BADGE PORTADA) ---
function renderizarGaleriaPreview() {
    const container = document.getElementById('galeria-preview-container');
    const textarea = document.getElementById('prod-imagenes');
    
    if (textarea) {
        textarea.value = imagenesProductoActual.join('\n');
    }

    if (imagenesProductoActual.length > 0) {
        actualizarLivePreview(imagenesProductoActual[0]);
        const input = document.getElementById('prod-imagen-url-input');
        if (input && !input.value) {
            input.value = imagenesProductoActual[0];
        }
    } else {
        const input = document.getElementById('prod-imagen-url-input');
        actualizarLivePreview(input ? input.value : '');
    }

    if (!container) return;

    if (imagenesProductoActual.length === 0) {
        container.innerHTML = '<span class="text-muted small" style="font-size: 0.72rem;">No hay fotos en galería aún.</span>';
        return;
    }

    container.innerHTML = imagenesProductoActual.map((url, index) => {
        const esPortada = index === 0;
        const urlNorm = normalizarUrlImagen(url);
        return `
            <div class="gallery-preview-item ${esPortada ? 'is-portada' : ''}" title="${urlNorm}" onclick="actualizarLivePreview('${urlNorm}')" style="cursor: pointer;">
                ${esPortada ? '<span class="badge-portada">PORTADA</span>' : ''}
                <img src="${urlNorm}" alt="Foto ${index + 1}" onerror="this.src='https://via.placeholder.com/85x113?text=Foto'">
                <button type="button" class="btn-remove-thumb" onclick="event.stopPropagation(); eliminarImagenDeGaleria(${index})" title="Quitar foto">&times;</button>
            </div>
        `;
    }).join('');
}

window.eliminarImagenDeGaleria = function (index) {
    imagenesProductoActual.splice(index, 1);
    renderizarGaleriaPreview();
};

window.sincronizarDesdeTextarea = function () {
    const raw = document.getElementById('prod-imagenes')?.value || '';
    imagenesProductoActual = raw.split(/[\n,]/).map(u => normalizarUrlImagen(u.trim())).filter(u => u.length > 3);
    renderizarGaleriaPreview();
};

// --- GUARDAR PRODUCTO (POST O PUT) ---
async function guardarProducto(event) {
    event.preventDefault();

    const btnSubmit = document.getElementById('btn-submit-producto');
    const btnOriginalHtml = btnSubmit ? btnSubmit.innerHTML : '<i class="fas fa-save me-1.5"></i> Guardar Prenda en Catálogo 💕';
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Guardando Prenda...';
    }

    const id = document.getElementById('prod-id').value;
    const nombre = document.getElementById('prod-nombre').value.trim();
    const categoria = document.getElementById('prod-categoria').value;
    const descripcion = document.getElementById('prod-descripcion').value.trim();
    const precioMinorista = parseFloat(document.getElementById('prod-precioMinorista').value);
    const precioMayoristaVal = document.getElementById('prod-precioMayorista').value;
    const precioMayorista = precioMayoristaVal ? parseFloat(precioMayoristaVal) : null;
    const etiqueta = document.getElementById('prod-etiqueta').value.trim() || null;
    const stock = document.getElementById('prod-stock').checked;
    const destacadoInicio = document.getElementById('prod-destacadoInicio')?.checked || false;

    // Obtener SOLO talles y variantes con input de stock activo en el DOM
    const talles = [];
    const variantes = [];
    document.querySelectorAll('#variantes-stock-grid .input-stock-talle').forEach(input => {
        const talle = input.getAttribute('data-talle');
        const stockQty = parseInt(input.value, 10);
        if (talle && !talles.includes(talle)) {
            talles.push(talle);
            variantes.push({
                talle: talle,
                stock: isNaN(stockQty) || stockQty < 0 ? 0 : stockQty
            });
        }
    });

    // Imágenes: Si el arreglo está vacío pero se colocó URL en el input, incluirlo
    const inputUrlVal = document.getElementById('prod-imagen-url-input')?.value?.trim();
    if (imagenesProductoActual.length === 0 && inputUrlVal && inputUrlVal.length > 4) {
        imagenesProductoActual.push(inputUrlVal);
    }

    const imagenes = imagenesProductoActual.length > 0
        ? imagenesProductoActual
        : document.getElementById('prod-imagenes').value.split(/[\n,]/).map(u => u.trim()).filter(u => u.length > 3);

    const payload = {
        nombre,
        categoria,
        descripcion,
        precioMinorista,
        precioMayorista,
        etiqueta,
        stock,
        destacadoInicio,
        talles,
        variantes,
        imagenes
    };

    const esEdicion = Boolean(id);
    const url = esEdicion ? `${API_BASE}/${id}` : API_BASE;
    const metodo = esEdicion ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        if (res.status === 401 || res.status === 403) {
            manejarNoAutorizado('Por favor autentícate como administrador para guardar cambios.');
            return;
        }

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || `HTTP ${res.status}`);
        }

        if (modalInstancia) modalInstancia.hide();

        Swal.fire({
            icon: 'success',
            title: esEdicion ? '¡Prenda Actualizada!' : '¡Prenda Guardada!',
            text: `"${nombre}" se guardó correctamente en el catálogo.`,
            confirmButtonColor: '#9E2A4B',
            timer: 2000
        });

        await cargarProductos();
    } catch (error) {
        console.error("Error al guardar producto:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error al Guardar',
            text: error.message || 'No se pudo completar la operación en el servidor.'
        });
    } finally {
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = btnOriginalHtml;
        }
    }
}

// --- ELIMINAR PRODUCTO (DELETE) ---
async function eliminarProducto(id, nombre) {
    const confirmacion = await Swal.fire({
        title: '¿Eliminar producto?',
        html: `¿Estás seguro de que deseas eliminar permanentemente <b>"${nombre}"</b>?<br><small class="text-danger">Esta acción no se puede deshacer.</small>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#b33939',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
        const res = await fetch(`${API_BASE}/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (res.status === 401 || res.status === 403) {
            manejarNoAutorizado('Debes tener permisos de administrador para eliminar productos.');
            return;
        }

        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

        Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'El producto fue eliminado de la base de datos.',
            timer: 1500,
            showConfirmButton: false
        });

        await cargarProductos();
    } catch (error) {
        console.error("Error al eliminar producto:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error al Eliminar',
            text: 'Ocurrió un problema al intentar eliminar el producto.'
        });
    }
}

// --- MANEJO DE SESIÓN / NO AUTORIZADO ---
function manejarNoAutorizado(mensaje = 'Tu sesión ha expirado o no tienes permisos de administrador.') {
    sessionStorage.removeItem('myBellaAdminUser');
    localStorage.removeItem('myBellaAdminUser');
    localStorage.removeItem('myBellaRememberMe');

    if (window.location.pathname.endsWith('login.html')) return;

    Swal.fire({
        icon: 'warning',
        title: 'Acceso Restringido',
        text: mensaje,
        confirmButtonText: 'Iniciar Sesión',
        confirmButtonColor: '#1a1a1a',
        timer: 3000,
        timerProgressBar: true
    }).then(() => {
        window.location.href = '/login.html';
    });
}

// ==========================================================================
// GESTIÓN DE PEDIDOS Y VENTAS (MY BELLA AFRODITA)
// ==========================================================================

async function cargarOrdenes() {
    const tbody = document.getElementById('tabla-pedidos-body');
    if (!tbody) return;

    try {
        const res = await fetch(API_ORDENES, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (res.status === 401 || res.status === 403) {
            console.error('[ADMIN] Error HTTP al cargar órdenes:', res.status, await res.text());
            manejarNoAutorizado('Sesión vencida para consultar órdenes.');
            return;
        }

        if (!res.ok) {
            console.error('[ADMIN] Error HTTP al cargar órdenes:', res.status, await res.text());
            throw new Error(`HTTP Error: ${res.status}`);
        }

        listaOrdenes = await res.json();
        actualizarMetricasPedidos(listaOrdenes);

        if (!Array.isArray(listaOrdenes) || listaOrdenes.length === 0) {
            listaOrdenes = [];
            actualizarMetricasPedidos([]);
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-5 text-muted">
                        <i class="fas fa-inbox fa-3x mb-3 text-secondary opacity-50 d-block"></i>
                        <h6 class="fw-bold mb-1 text-dark">Aún no se han recibido órdenes de compra</h6>
                        <p class="small text-muted mb-0">Cuando un cliente confirme un pedido desde el catálogo o checkout, aparecerá reflejado aquí en tiempo real.</p>
                    </td>
                </tr>`;
            const contador = document.getElementById('contador-pedidos-mostrados');
            if (contador) contador.innerText = 'Mostrando 0 de 0 pedidos';
            return;
        }

        filtrarYRenderizarPedidos();
    } catch (error) {
        console.error("Error al cargar pedidos:", error);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5 text-danger">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    <p class="fw-bold mb-1">No se pudieron cargar las órdenes desde el servidor.</p>
                    <p class="small text-muted mb-3">${error.message || 'Verifique la consola del navegador y el estado del backend.'}</p>
                    <button class="btn btn-sm btn-outline-dark px-3 fw-bold" onclick="cargarOrdenes()">
                        <i class="fas fa-sync-alt me-1"></i> Reintentar
                    </button>
                </td>
            </tr>`;
    }
}

// Funciones auxiliares para San Juan y logística
function parsearDireccionCompleta(dirTexto) {
    if (!dirTexto) return { departamento: 'San Juan', direccion: 'A convenir', referencias: 'Sin referencias' };
    
    // Formato: "[Depto] - Dirección: [Calle, Nro], Entrecalles: [Referencias]"
    const match = dirTexto.match(/^([^-]+)\s*-\s*Dirección:\s*(.+?)(?:,\s*Entrecalles:\s*(.+))?$/i);
    if (match) {
        return {
            departamento: match[1].trim(),
            direccion: match[2].trim(),
            referencias: (match[3] || 'A convenir').trim()
        };
    }
    // Formato: "[Calle, Nro] (Depto: [Depto]) - Ref: [Referencias]"
    const match2 = dirTexto.match(/^(.+?)\s*\(Depto:\s*(.+?)\)\s*-\s*Ref:\s*(.+)$/i);
    if (match2) {
        return {
            departamento: match2[2].trim(),
            direccion: match2[1].trim(),
            referencias: match2[3].trim()
        };
    }
    return {
        departamento: 'San Juan',
        direccion: dirTexto,
        referencias: 'A convenir'
    };
}

function sanitizarTelefonoWhatsApp(tel) {
    if (!tel) return '';
    let digits = tel.replace(/[^0-9]/g, '');
    if (digits.startsWith('549')) return digits;
    if (digits.startsWith('54')) return '549' + digits.substring(2);
    if (digits.length === 10) return '549' + digits; // ej: 2645551234
    if (digits.length === 11 && digits.startsWith('0')) return '549' + digits.substring(1); // ej: 02645551234
    return '549' + digits;
}

function actualizarMetricasPedidos(ordenes) {
    const total = ordenes.length;
    const pendientes = ordenes.filter(o => o.estado === 'PENDIENTE' || o.estado === 'PENDIENTE_COTIZACION').length;
    const enProceso = ordenes.filter(o => o.estado === 'EN_PREPARACION' || o.estado === 'ENVIADO').length;
    const facturado = ordenes
        .filter(o => o.estado !== 'CANCELADO')
        .reduce((acc, o) => acc + (Number(o.total) || 0), 0);

    const statTotal = document.getElementById('stat-pedidos-total');
    const statPendientes = document.getElementById('stat-pedidos-pendientes');
    const statProceso = document.getElementById('stat-pedidos-proceso');
    const statFacturado = document.getElementById('stat-pedidos-facturado');
    const badgeCount = document.getElementById('badge-pedidos-count');

    if (statTotal) statTotal.innerText = total;
    if (statPendientes) statPendientes.innerText = pendientes;
    if (statProceso) statProceso.innerText = enProceso;
    if (statFacturado) statFacturado.innerText = `$${Math.round(facturado).toLocaleString('es-AR')}`;
    if (badgeCount) badgeCount.innerText = pendientes;
}

function filtrarYRenderizarPedidos() {
    const texto = (document.getElementById('filtro-pedidos-busqueda')?.value || '').toLowerCase().trim();
    const estado = document.getElementById('filtro-pedidos-estado')?.value || '';

    const filtrados = listaOrdenes.filter(o => {
        const dirParsed = parsearDireccionCompleta(o.clienteDireccion);
        const coincideTexto = !texto ||
            (o.codigoSeguimiento && o.codigoSeguimiento.toLowerCase().includes(texto)) ||
            (o.clienteNombre && o.clienteNombre.toLowerCase().includes(texto)) ||
            (o.clienteTelefono && o.clienteTelefono.toLowerCase().includes(texto)) ||
            (dirParsed.departamento && dirParsed.departamento.toLowerCase().includes(texto)) ||
            (dirParsed.direccion && dirParsed.direccion.toLowerCase().includes(texto));
        const coincideEstado = !estado || (o.estado === estado);
        return coincideTexto && coincideEstado;
    });

    renderizarTablaPedidos(filtrados);

    const contador = document.getElementById('contador-pedidos-mostrados');
    if (contador) {
        contador.innerText = `Mostrando ${filtrados.length} de ${listaOrdenes.length} pedidos`;
    }
}

function renderizarTablaPedidos(ordenes) {
    const tbody = document.getElementById('tabla-pedidos-body');
    if (!tbody) return;

    if (ordenes.length === 0) {
        const mensajeVacio = (listaOrdenes.length === 0)
            ? 'Aún no se han recibido órdenes de compra.'
            : 'No se encontraron órdenes con los filtros seleccionados.';
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5 text-muted">
                    <i class="fas fa-inbox fa-3x mb-3 text-secondary opacity-50 d-block"></i>
                    <p class="mb-0 fw-semibold">${mensajeVacio}</p>
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = ordenes.map(o => {
        const fechaObj = new Date(o.fechaCreacion);
        const fechaStr = isNaN(fechaObj) ? o.fechaCreacion : fechaObj.toLocaleString('es-AR', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const totalPrendas = (o.items || []).reduce((acc, item) => acc + (item.cantidad || 0), 0);
        const mayoristaBadge = o.esMayorista 
            ? `<span class="badge bg-success ms-1" style="font-size: 0.65rem;">Mayorista</span>`
            : '';

        const telWa = sanitizarTelefonoWhatsApp(o.clienteTelefono);
        const { departamento, direccion, referencias } = parsearDireccionCompleta(o.clienteDireccion);

        // Sanitización contra XSS en datos ingresados por clientes
        const codSegEscapado = escapeHtml(o.codigoSeguimiento);
        const nombreEscapado = escapeHtml(o.clienteNombre);
        const telMostrarEscapado = escapeHtml(o.clienteTelefono);
        const deptoEscapado = escapeHtml(departamento);
        const dirEscapada = escapeHtml(direccion);
        const refEscapada = escapeHtml(referencias);

        // Generar enlace dinámico para Google Maps sanitizado
        const queryMaps = encodeURIComponent(`${direccion}, ${departamento}, San Juan, Argentina`);
        let mapsUrl = `https://www.google.com/maps/search/?api=1&query=${queryMaps}`;
        if (referencias && referencias.includes('maps.google.com')) {
            const matchLink = referencias.match(/https?:\/\/maps\.google\.com\/[^\s|"'<>]+/);
            if (matchLink) {
                mapsUrl = matchLink[0];
            }
        }
        const mapsUrlSanitizada = sanitizarUrlMapas(mapsUrl);

        // Subtotal Prendas (sin costo de envío)
        const subtotalPrendas = (o.subtotal != null && o.descuentoMayorista != null)
            ? (Number(o.subtotal) - Number(o.descuentoMayorista))
            : (Number(o.subtotal) || (Number(o.total) - Number(o.costoEnvio || 0)));

        const costoCadeteVal = Number(o.costoEnvio) || 0;

        return `
            <tr>
                <td>
                    <span class="badge bg-dark font-monospace" style="letter-spacing: 0.5px;">#${codSegEscapado}</span>
                    ${o.estado === 'PENDIENTE_COTIZACION' ? '<span class="badge badge-estado-pendiente_cotizacion d-block mt-1" style="font-size: 0.6rem;">POR COTIZAR</span>' : ''}
                </td>
                <td class="small text-muted" style="white-space: nowrap;">
                    ${fechaStr}
                </td>
                <td>
                    <div class="fw-bold text-dark text-capitalize" style="font-size: 0.85rem;">
                        ${nombreEscapado}
                    </div>
                    <div class="small">
                        <a href="https://wa.me/${encodeURIComponent(telWa)}" target="_blank" class="text-success text-decoration-none fw-semibold">
                            <i class="fab fa-whatsapp me-1"></i>${telMostrarEscapado}
                        </a>
                    </div>
                </td>
                <td>
                    <div class="d-flex align-items-center gap-1 mb-0.5">
                        <span class="badge bg-secondary text-white" style="font-size: 0.68rem; letter-spacing: 0.5px;">${deptoEscapado}</span>
                    </div>
                    <div class="small text-dark fw-semibold" style="line-height: 1.25; max-width: 220px;">
                        ${dirEscapada}
                    </div>
                    <div class="text-muted small" style="font-size: 0.69rem; line-height: 1.2; max-width: 220px;">
                        <i class="fas fa-map-marker-alt me-1 text-danger"></i>${refEscapada}
                    </div>
                    <div class="mt-1">
                        <a href="${mapsUrlSanitizada}" 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           class="btn btn-outline-danger btn-xs py-0.5 px-2 d-inline-flex align-items-center gap-1 text-decoration-none shadow-sm fw-semibold" 
                           style="font-size: 0.68rem; border-radius: 4px;"
                           title="Abrir ubicación en Google Maps">
                            <span>🗺️</span> Abrir en Google Maps
                        </a>
                    </div>
                </td>
                <td>
                    <span class="fw-semibold small">${totalPrendas} prenda${totalPrendas === 1 ? '' : 's'}</span>
                    ${mayoristaBadge}
                    <div class="fw-bold text-dark mt-0.5" style="font-size: 0.92rem;">
                        $${Math.round(subtotalPrendas).toLocaleString('es-AR')}
                    </div>
                </td>
                <td>
                    <div class="input-group input-group-sm" style="width: 140px;">
                        <span class="input-group-text bg-light fw-bold text-muted" style="font-size: 0.72rem;">$</span>
                        <input type="number" 
                               id="costo-cadete-${o.id}" 
                               class="form-control form-control-sm fw-bold text-dark text-end" 
                               value="${costoCadeteVal > 0 ? costoCadeteVal : ''}" 
                               placeholder="0" 
                               min="0" 
                               step="100"
                               style="font-size: 0.82rem;"
                               onchange="actualizarCostoEnvioBackend(${o.id}, this.value)"
                               title="Ingresa el costo del cadete en moto para esta zona">
                    </div>
                    <small class="text-muted d-block mt-0.5" style="font-size: 0.68rem;" id="total-preview-${o.id}">
                        Total: <b class="text-dark">$${Number(o.total).toLocaleString('es-AR')}</b>
                    </small>
                </td>
                <td>
                    <select class="form-select form-select-sm" 
                            style="font-size: 0.75rem; font-weight: 600; width: 155px;"
                            onchange="cambiarEstadoPedido(${o.id}, this.value)">
                        <option value="PENDIENTE_COTIZACION" ${o.estado === 'PENDIENTE_COTIZACION' ? 'selected' : ''}>PENDIENTE COTIZACIÓN</option>
                        <option value="PENDIENTE" ${o.estado === 'PENDIENTE' ? 'selected' : ''}>PENDIENTE</option>
                        <option value="PAGADO" ${o.estado === 'PAGADO' ? 'selected' : ''}>PAGADO</option>
                        <option value="EN_PREPARACION" ${o.estado === 'EN_PREPARACION' ? 'selected' : ''}>EN PREPARACIÓN</option>
                        <option value="ENVIADO" ${o.estado === 'ENVIADO' ? 'selected' : ''}>ENVIADO</option>
                        <option value="ENTREGADO" ${o.estado === 'ENTREGADO' ? 'selected' : ''}>ENTREGADO</option>
                        <option value="CANCELADO" ${o.estado === 'CANCELADO' ? 'selected' : ''}>CANCELADO</option>
                    </select>
                </td>
                <td class="text-end">
                    <div class="d-flex flex-column align-items-end gap-1">
                        <button type="button" 
                                class="btn btn-success btn-sm d-flex align-items-center gap-1.5 shadow-sm py-1.5 px-2.5 rounded-2 fw-bold text-nowrap"
                                onclick="enviarCotizacionWhatsApp(${o.id})" 
                                title="Enviar cotización con cadetería por WhatsApp a ${o.clienteNombre}"
                                style="background-color: #25D366; border-color: #25D366; font-size: 0.73rem;">
                            <i class="fab fa-whatsapp fa-lg"></i> Enviar Cotización al Cliente
                        </button>
                        <button class="btn btn-outline-dark btn-sm py-0.5 px-2 rounded-1 text-nowrap" 
                                onclick="verDetallePedido(${o.id})" 
                                title="Ver Detalle" 
                                style="font-size: 0.7rem;">
                            <i class="fas fa-eye me-1"></i> Detalle
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.enviarCotizacionWhatsApp = async function (ordenId) {
    const orden = listaOrdenes.find(o => o.id === ordenId);
    if (!orden) return;

    const inputCosto = document.getElementById(`costo-cadete-${ordenId}`);
    let costoEnvioVal = inputCosto && inputCosto.value !== '' ? parseFloat(inputCosto.value) : (Number(orden.costoEnvio) || 0);

    // Si aún no ingresó un valor o es 0, consultar con modal amigable
    if (isNaN(costoEnvioVal) || costoEnvioVal <= 0) {
        const { departamento, direccion } = parsearDireccionCompleta(orden.clienteDireccion);
        const { value: nuevoCosto, isDismissed } = await Swal.fire({
            title: 'Cotizar Cadete en Moto',
            html: `
                <p class="small text-muted mb-2">Ingresa el costo del envío para <b>${orden.clienteNombre}</b>:</p>
                <div class="text-start p-2.5 rounded bg-light border small mb-2" style="font-size: 0.78rem;">
                    <div><b>Departamento:</b> ${departamento}</div>
                    <div><b>Dirección:</b> ${direccion}</div>
                </div>
            `,
            input: 'number',
            inputLabel: 'Costo del cadete ($)',
            inputPlaceholder: 'Ej: 2500',
            inputValue: orden.costoEnvio > 0 ? orden.costoEnvio : '',
            showCancelButton: true,
            confirmButtonText: 'Guardar y Abrir WhatsApp',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#25D366',
            inputValidator: (val) => {
                if (!val || parseFloat(val) <= 0) return 'Por favor ingresa un costo mayor a 0.';
            }
        });

        if (isDismissed || nuevoCosto === undefined) return;
        costoEnvioVal = parseFloat(nuevoCosto) || 0;
        if (inputCosto) inputCosto.value = costoEnvioVal;
    }

    try {
        Swal.fire({
            title: 'Actualizando orden...',
            text: 'Guardando costo de envío y preparando mensaje',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const res = await fetch(`${API_ORDENES}/${ordenId}/cotizar-envio`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ costoEnvio: costoEnvioVal })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `HTTP ${res.status}`);
        }

        const ordenActualizada = await res.json();
        const idx = listaOrdenes.findIndex(o => o.id === ordenId);
        if (idx !== -1) listaOrdenes[idx] = ordenActualizada;
        actualizarMetricasPedidos(listaOrdenes);
        filtrarYRenderizarPedidos();

        const { departamento, direccion, referencias } = parsearDireccionCompleta(ordenActualizada.clienteDireccion);

        const subtotalPrendas = (ordenActualizada.subtotal != null && ordenActualizada.descuentoMayorista != null)
            ? (Number(ordenActualizada.subtotal) - Number(ordenActualizada.descuentoMayorista))
            : (Number(ordenActualizada.subtotal) || (Number(ordenActualizada.total) - Number(costoEnvioVal)));

        const subtotalFormat = Math.round(subtotalPrendas).toLocaleString('es-AR');
        const costoEnvioFormat = Math.round(costoEnvioVal).toLocaleString('es-AR');
        const totalConEnvioFormat = Math.round(Number(ordenActualizada.total)).toLocaleString('es-AR');

        const listaPrendas = (ordenActualizada.items || []).map(it => 
            `• ${it.productoNombre} (Talle: ${it.talle || '-'}) x${it.cantidad} - $${Number(it.subtotal || (it.precioUnitario * it.cantidad)).toLocaleString('es-AR')}`
        ).join('\n');

        let mensaje = `¡Hola ${ordenActualizada.clienteNombre}! Nos comunicamos de *Lencería Mi Bella Afrodita* 💕\n\n`;
        mensaje += `Recibimos tu pedido *#${ordenActualizada.codigoSeguimiento}*:\n`;
        mensaje += `${listaPrendas}\n`;
        mensaje += `💵 Subtotal Prendas: $${subtotalFormat}\n\n`;
        mensaje += `🛵 *Envío en Cadete en Moto:* $${costoEnvioFormat}\n`;
        mensaje += `📍 Destino: ${departamento}, ${direccion} (Ref: ${referencias})\n\n`;
        mensaje += `👉 *TOTAL FINAL:* $${totalConEnvioFormat}\n\n`;
        mensaje += `¿Nos confirmas si te parece bien para comenzar a prepararlo?\n`;
        mensaje += `📌 *Por favor, compartinos tu ubicación por este chat (clip 📎 -> Ubicación) o el enlace de Google Maps para que el cadete llegue directo a tu puerta.*`;

        const telSanitizado = sanitizarTelefonoWhatsApp(ordenActualizada.clienteTelefono);
        const waUrl = `https://wa.me/${telSanitizado}?text=${encodeURIComponent(mensaje)}`;

        Swal.close();
        window.open(waUrl, '_blank');

    } catch (err) {
        console.error("Error al cotizar envío:", err);
        Swal.fire({
            icon: 'error',
            title: 'Error al cotizar envío',
            text: err.message || 'No se pudo actualizar el costo de envío.',
            confirmButtonColor: '#1a1a1a'
        });
    }
};

window.actualizarCostoEnvioBackend = async function (ordenId, valor) {
    const costo = parseFloat(valor);
    if (isNaN(costo) || costo < 0) return;
    try {
        const res = await fetch(`${API_ORDENES}/${ordenId}/cotizar-envio`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ costoEnvio: costo })
        });
        if (res.ok) {
            const ordenActualizada = await res.json();
            const idx = listaOrdenes.findIndex(o => o.id === ordenId);
            if (idx !== -1) listaOrdenes[idx] = ordenActualizada;
            actualizarMetricasPedidos(listaOrdenes);
            const previewEl = document.getElementById(`total-preview-${ordenId}`);
            if (previewEl) {
                previewEl.innerHTML = `Total: <b class="text-dark">$${Number(ordenActualizada.total).toLocaleString('es-AR')}</b>`;
            }
        }
    } catch (e) {
        console.error("Error al actualizar costo de cadete:", e);
    }
};

window.cambiarEstadoPedido = async function (id, nuevoEstado) {
    try {
        const res = await fetch(`${API_ORDENES}/${id}/estado`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (res.status === 401 || res.status === 403) {
            manejarNoAutorizado('Sesión vencida para actualizar el estado del pedido.');
            return;
        }

        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

        const ordenActualizada = await res.json();
        const index = listaOrdenes.findIndex(o => o.id === id);
        if (index !== -1) {
            listaOrdenes[index].estado = ordenActualizada.estado;
            actualizarMetricasPedidos(listaOrdenes);
            filtrarYRenderizarPedidos();
        }

        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `Orden #${ordenActualizada.codigoSeguimiento}`,
            text: `Nuevo estado: ${ordenActualizada.estado}`,
            showConfirmButton: false,
            timer: 2000
        });
    } catch (error) {
        console.error("Error al actualizar estado:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error al cambiar estado',
            text: 'No se pudo actualizar el estado de la orden en el servidor.'
        });
        cargarOrdenes();
    }
};

window.verDetallePedido = function (id) {
    const orden = listaOrdenes.find(o => o.id === id);
    if (!orden) return;

    const modalBody = document.getElementById('modal-detalle-pedido-body');
    const btnWhatsapp = document.getElementById('btn-modal-whatsapp');
    if (!modalBody) return;

    const fechaObj = new Date(orden.fechaCreacion);
    const fechaStr = isNaN(fechaObj) ? orden.fechaCreacion : fechaObj.toLocaleString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const itemsHtml = (orden.items || []).map(item => `
        <tr>
            <td class="fw-bold">${escapeHtml(item.productoNombre)}</td>
            <td class="text-center"><span class="badge bg-light text-dark border">${escapeHtml(item.talle || '-')}</span></td>
            <td class="text-center">${Number(item.cantidad) || 1}</td>
            <td class="text-end">$${Number(item.precioUnitario).toLocaleString('es-AR')}</td>
            <td class="text-end fw-bold">$${Number(item.subtotal).toLocaleString('es-AR')}</td>
        </tr>
    `).join('');

    const telSanitizado = sanitizarTelefonoWhatsApp(orden.clienteTelefono);
    if (btnWhatsapp) {
        btnWhatsapp.onclick = (e) => {
            e.preventDefault();
            enviarCotizacionWhatsApp(orden.id);
        };
        btnWhatsapp.innerHTML = `<i class="fab fa-whatsapp me-1"></i> Enviar Cotización por WhatsApp`;
    }

    const { departamento, direccion, referencias } = parsearDireccionCompleta(orden.clienteDireccion);
    const queryMapsModal = encodeURIComponent(`${direccion}, ${departamento}, San Juan, Argentina`);
    let mapsUrlModal = `https://www.google.com/maps/search/?api=1&query=${queryMapsModal}`;
    if (referencias && referencias.includes('maps.google.com')) {
        const matchLinkModal = referencias.match(/https?:\/\/maps\.google\.com\/[^\s|"'<>]+/);
        if (matchLinkModal) mapsUrlModal = matchLinkModal[0];
    }
    const mapsUrlModalSanitizada = sanitizarUrlMapas(mapsUrlModal);

    const subtotalPrendas = (orden.subtotal != null && orden.descuentoMayorista != null)
        ? (Number(orden.subtotal) - Number(orden.descuentoMayorista))
        : (Number(orden.subtotal) || (Number(orden.total) - Number(orden.costoEnvio || 0)));

    modalBody.innerHTML = `
        <div class="row g-3 mb-3">
            <div class="col-md-6">
                <div class="p-3 bg-light rounded">
                    <div class="text-muted small text-uppercase fw-bold" style="font-size: 0.65rem;">Información del Cliente</div>
                    <div class="fw-bold text-dark h6 mb-1">${escapeHtml(orden.clienteNombre)}</div>
                    <div class="small text-muted"><i class="fab fa-whatsapp text-success me-1"></i> ${escapeHtml(orden.clienteTelefono)}</div>
                    <div class="small text-dark mt-1"><b>${escapeHtml(departamento)}</b>: ${escapeHtml(direccion)}</div>
                    <div class="small text-muted"><i class="fas fa-map-marker-alt text-danger me-1"></i> ${escapeHtml(referencias)}</div>
                    <div class="mt-2">
                        <a href="${mapsUrlModalSanitizada}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-danger btn-sm py-1 px-2.5 d-inline-flex align-items-center gap-1 shadow-sm fw-semibold" style="font-size: 0.72rem; border-radius: 4px;">
                            <span>🗺️</span> Abrir en Google Maps
                        </a>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="p-3 bg-light rounded">
                    <div class="text-muted small text-uppercase fw-bold" style="font-size: 0.65rem;">Datos del Pedido</div>
                    <div class="fw-bold font-monospace text-dark mb-1">#${escapeHtml(orden.codigoSeguimiento)}</div>
                    <div class="small text-muted"><i class="fas fa-calendar-alt me-1"></i> ${fechaStr}</div>
                    <div class="small text-muted"><i class="fas fa-info-circle me-1"></i> Estado: <b>${escapeHtml(orden.estado)}</b></div>
                </div>
            </div>
        </div>

        <div class="table-responsive mb-3 border rounded">
            <table class="table mb-0 align-middle">
                <thead class="table-light">
                    <tr>
                        <th>Prenda</th>
                        <th class="text-center">Talle</th>
                        <th class="text-center">Cant.</th>
                        <th class="text-end">Precio Unit.</th>
                        <th class="text-end">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
        </div>

        <div class="p-3 bg-light rounded">
            <div class="d-flex justify-content-between mb-1">
                <span class="text-muted small">Subtotal Prendas:</span>
                <span class="fw-semibold text-dark">$${Math.round(subtotalPrendas).toLocaleString('es-AR')}</span>
            </div>
            <div class="d-flex justify-content-between mb-1">
                <span class="text-muted small">Envío en Moto (Cadete):</span>
                <span class="fw-bold text-primary">$${Number(orden.costoEnvio || 0).toLocaleString('es-AR')}</span>
            </div>
            ${orden.descuentoMayorista && Number(orden.descuentoMayorista) > 0 
                ? `<div class="d-flex justify-content-between mb-1 text-success small">
                     <span>Ahorro Mayorista:</span>
                     <b>-$${Number(orden.descuentoMayorista).toLocaleString('es-AR')}</b>
                   </div>` 
                : ''}
            <div class="d-flex justify-content-between align-items-baseline pt-2 border-top">
                <div class="h6 fw-bold text-dark mb-0">TOTAL FINAL:</div>
                <div class="h4 fw-bold text-dark mb-0 font-monospace">$${Number(orden.total).toLocaleString('es-AR')}</div>
            </div>
        </div>
    `;

    if (modalDetallePedidoInstancia) {
        modalDetallePedidoInstancia.show();
    }
};

/* ==========================================================================
   MODERACIÓN DE RESEÑAS DE CLIENTAS (PANEL ADMIN)
   ========================================================================== */

let RESENAS = [];

window.cargarResenasAdmin = async function () {
    const tbody = document.getElementById('tabla-resenas-body');
    if (!tbody) return;

    try {
        const resp = await fetch(API_RESENAS, { credentials: 'include' });
        if (!resp.ok) {
            throw new Error(`Error HTTP: ${resp.status}`);
        }
        RESENAS = await resp.json();
        actualizarMetricasResenas(RESENAS);
        filtrarYRenderizarResenas();
    } catch (err) {
        console.error("Error al cargar reseñas admin:", err);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4 text-danger">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    <div>No se pudieron cargar las reseñas. Revisa la sesión de administrador.</div>
                </td>
            </tr>
        `;
    }
};

function actualizarMetricasResenas(lista) {
    const destacadas = lista.filter(r => r.destacadaHome && r.aprobada).length;
    const aprobadas = lista.filter(r => r.aprobada).length;
    const pendientes = lista.filter(r => !r.aprobada).length;
    const total = lista.length;

    const elDest = document.getElementById('stat-resenas-destacadas');
    const elAprob = document.getElementById('stat-resenas-aprobadas');
    const elPend = document.getElementById('stat-resenas-pendientes');
    const elTotal = document.getElementById('stat-resenas-total');
    const badgeTab = document.getElementById('badge-resenas-count');
    const contadorCabecera = document.getElementById('contador-resenas-mostradas');

    if (elDest) elDest.textContent = destacadas;
    if (elAprob) elAprob.textContent = aprobadas;
    if (elPend) elPend.textContent = pendientes;
    if (elTotal) elTotal.textContent = total;
    if (badgeTab) badgeTab.textContent = pendientes;
    if (contadorCabecera) {
        contadorCabecera.innerHTML = `Mostrando <span class="badge bg-warning text-dark px-2 py-1">${destacadas}</span> reseñas activas en la Portada`;
    }
}

window.filtrarYRenderizarResenas = function () {
    const texto = (document.getElementById('filtro-resenas-busqueda')?.value || '').toLowerCase().trim();
    const filtroEstado = document.getElementById('filtro-resenas-estado')?.value || '';

    let filtradas = RESENAS.filter(r => {
        const coincideTexto = !texto ||
            (r.nombreCliente && r.nombreCliente.toLowerCase().includes(texto)) ||
            (r.departamento && r.departamento.toLowerCase().includes(texto)) ||
            (r.comentario && r.comentario.toLowerCase().includes(texto));

        let coincideEstado = true;
        if (filtroEstado === 'PORTADA') {
            coincideEstado = r.destacadaHome && r.aprobada;
        } else if (filtroEstado === 'APROBADA') {
            coincideEstado = r.aprobada;
        } else if (filtroEstado === 'PENDIENTE') {
            coincideEstado = !r.aprobada;
        }

        return coincideTexto && coincideEstado;
    });

    renderizarTablaResenas(filtradas);
};

function renderizarTablaResenas(lista) {
    const tbody = document.getElementById('tabla-resenas-body');
    if (!tbody) return;

    if (lista.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5 text-muted">
                    <i class="far fa-comment-dots fa-3x mb-2 text-secondary opacity-50"></i>
                    <p class="mb-0 fw-semibold">No se encontraron reseñas con los filtros seleccionados.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = lista.map(r => {
        const fecha = r.fechaCreacion 
            ? new Date(r.fechaCreacion).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
            : '-';

        let estrellasHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= r.estrellas) {
                estrellasHtml += '<i class="fas fa-star" style="color: #f1c40f;"></i>';
            } else {
                estrellasHtml += '<i class="far fa-star text-muted opacity-50"></i>';
            }
        }

        return `
            <tr>
                <td class="text-muted small">${fecha}</td>
                <td>
                    <div class="fw-bold text-dark">${r.nombreCliente}</div>
                </td>
                <td>
                    <span class="badge bg-light text-dark border">
                        <i class="fas fa-map-marker-alt me-1 text-danger"></i>${r.departamento}
                    </span>
                </td>
                <td>
                    <div class="d-inline-flex gap-1" title="${r.estrellas} de 5 estrellas">
                        ${estrellasHtml}
                    </div>
                </td>
                <td style="max-width: 320px;">
                    <div class="text-muted small text-truncate-2" title="${r.comentario}" style="line-height: 1.4;">
                        "${r.comentario}"
                    </div>
                </td>
                <td class="text-center">
                    <div class="form-check form-switch d-inline-block">
                        <input class="form-check-input switch-custom switch-aprobada switch-input" type="checkbox" role="switch"
                            id="switch-aprobada-${r.id}"
                            ${r.aprobada ? 'checked' : ''}
                            onchange="toggleAprobada(${r.id}, this.checked)"
                            title="${r.aprobada ? 'Aprobada (clic para desaprobar)' : 'Pendiente (clic para aprobar)'}">
                    </div>
                </td>
                <td class="text-center">
                    <div class="form-check form-switch d-inline-block">
                        <input class="form-check-input switch-custom switch-destacada switch-input" type="checkbox" role="switch"
                            id="switch-destacada-${r.id}"
                            ${r.destacadaHome ? 'checked' : ''}
                            onchange="toggleDestacada(${r.id}, this.checked)"
                            title="${r.destacadaHome ? 'En portada (clic para quitar)' : 'Clic para mostrar en Portada'}">
                    </div>
                </td>
                <td class="text-end">
                    <button type="button" class="btn btn-action-del" onclick="eliminarResena(${r.id})" title="Eliminar reseña spam">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

window.toggleAprobada = async function (id, nuevoEstado) {
    try {
        const resp = await fetch(`${API_RESENAS}/${id}/toggle-aprobada`, {
            method: 'PATCH',
            credentials: 'include'
        });

        if (!resp.ok) {
            throw new Error(`Error HTTP: ${resp.status}`);
        }

        const data = await resp.json();

        // 1. Actualizar el objeto en el array local en memoria
        const index = RESENAS.findIndex(r => String(r.id) === String(id));
        if (index !== -1) {
            RESENAS[index] = data;
        }

        // 2. Llamar INMEDIATAMENTE al recálculo de métricas y re-renderizado
        actualizarMetricasResenas(RESENAS);
        filtrarYRenderizarResenas();

        const toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1400,
            timerProgressBar: true
        });
        toast.fire({
            icon: data.aprobada ? 'success' : 'info',
            title: data.aprobada ? 'Aprobada (Verde)' : 'Desaprobada (Gris)'
        });

    } catch (err) {
        console.error("Error en toggleAprobada:", err);
        Swal.fire({
            icon: 'error',
            title: 'Error de Sincronización',
            text: 'No se pudo actualizar el estado de aprobación.'
        });
        cargarResenasAdmin();
    }
};

window.toggleDestacada = async function (id, nuevoEstado) {
    try {
        const resp = await fetch(`${API_RESENAS}/${id}/toggle-destacada`, {
            method: 'PATCH',
            credentials: 'include'
        });

        if (!resp.ok) {
            throw new Error(`Error HTTP: ${resp.status}`);
        }

        const data = await resp.json();

        // 1. Actualizar el objeto en el array local en memoria
        const index = RESENAS.findIndex(r => String(r.id) === String(id));
        if (index !== -1) {
            RESENAS[index] = data;
        }

        // 2. Llamar INMEDIATAMENTE al recálculo de métricas y re-renderizado
        actualizarMetricasResenas(RESENAS);
        filtrarYRenderizarResenas();

        const toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1400,
            timerProgressBar: true
        });
        toast.fire({
            icon: data.destacadaHome ? 'success' : 'info',
            title: data.destacadaHome ? 'Destacada en Portada ⭐' : 'Removida de Portada'
        });

    } catch (err) {
        console.error("Error en toggleDestacada:", err);
        Swal.fire({
            icon: 'error',
            title: 'Error de Sincronización',
            text: 'No se pudo alternar la visibilidad en portada.'
        });
        cargarResenasAdmin();
    }
};

// Aliases para compatibilidad total de invocación
window.toggleAprobadaResena = window.toggleAprobada;
window.toggleDestacadaResena = window.toggleDestacada;
window.cargarResenas = window.cargarResenasAdmin;

window.eliminarResena = async function (id) {
    const confirm = await Swal.fire({
        title: '¿Eliminar reseña?',
        text: 'Esta acción no se puede deshacer. Se eliminará definitivamente.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        cancelButtonColor: '#706E6B',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    try {
        const resp = await fetch(`${API_RESENAS}/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (!resp.ok) throw new Error('Error al eliminar');

        RESENAS = RESENAS.filter(r => r.id !== id);
        actualizarMetricasResenas(RESENAS);
        filtrarYRenderizarResenas();

        Swal.fire({
            icon: 'success',
            title: 'Eliminada',
            text: 'La reseña fue eliminada con éxito.',
            timer: 1600,
            showConfirmButton: false
        });
    } catch (err) {
        console.error("Error al eliminar reseña:", err);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo eliminar la reseña.'
        });
        cargarResenasAdmin();
    }
};

// --- EXPORTAR ALIASES GLOBALES PARA COMPATIBILIDAD ATELIER ---
window.abrirModalCrearProducto = abrirModalCrear;
window.abrirModalCrear = abrirModalCrear;
window.editarProducto = abrirModalEditar;
window.abrirModalEditar = abrirModalEditar;
window.guardarProducto = guardarProducto;
window.quitarTalle = quitarTalle;
window.toggleTalleChip = toggleTalleChip;


