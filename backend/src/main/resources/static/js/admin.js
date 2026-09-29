/* ==========================================================================
   ADMIN.JS - BACKOFFICE & GESTIÓN DE CATÁLOGO (MY BELLA AFRODITA)
   ========================================================================== */

const API_BASE = '/api/productos';
const API_ORDENES = '/api/ordenes';
const AUTH_STATUS_URL = '/api/auth/status';
const AUTH_LOGOUT_URL = '/api/auth/logout';
const UPLOAD_API = '/api/upload';

let listaProductos = [];
let listaOrdenes = [];
let pestanaActiva = 'productos';
let modalInstancia = null;
let modalDetallePedidoInstancia = null;
let imagenesProductoActual = [];

async function verificarSesionAdmin() {
    try {
        const res = await fetch(AUTH_STATUS_URL, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok || !data.authenticated || data.rol !== 'ROLE_ADMIN') {
            throw new Error('No autorizado');
        }
        sessionStorage.setItem('myBellaAdminUser', JSON.stringify(data));
        return data;
    } catch (e) {
        sessionStorage.removeItem('myBellaAdminUser');
        window.location.href = '/login.html';
        return null;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const adminUser = await verificarSesionAdmin();
    if (!adminUser) return;

    modalInstancia = new bootstrap.Modal(document.getElementById('modalProducto'));
    const modalPedidoElem = document.getElementById('modalDetallePedido');
    if (modalPedidoElem) {
        modalDetallePedidoInstancia = new bootstrap.Modal(modalPedidoElem);
    }

    // Configurar chips de talles interactivos
    document.querySelectorAll('#talles-chips-container .talle-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            chip.classList.toggle('active');
            actualizarGridInputsVariantes();
        });
    });

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

    // Cargar productos y órdenes
    cargarProductos();
    cargarOrdenes();
});

// --- PESTAÑAS: PRODUCTOS VS PEDIDOS ---
window.cambiarPestana = function (pestana) {
    pestanaActiva = pestana;
    const btnProd = document.getElementById('tab-btn-productos');
    const btnPed = document.getElementById('tab-btn-pedidos');
    const secProd = document.getElementById('seccion-productos');
    const secPed = document.getElementById('seccion-pedidos');
    const topAction = document.getElementById('btn-top-action-container');

    if (pestana === 'productos') {
        btnProd.classList.add('active');
        btnPed.classList.remove('active');
        secProd.classList.remove('d-none');
        secPed.classList.add('d-none');
        topAction.innerHTML = `
            <button class="btn btn-boutique-add shadow-sm" onclick="abrirModalCrear()">
                <i class="fas fa-plus me-1.5"></i> Nuevo Producto
            </button>`;
    } else {
        btnPed.classList.add('active');
        btnProd.classList.remove('active');
        secPed.classList.remove('d-none');
        secProd.classList.add('d-none');
        topAction.innerHTML = `
            <button class="btn btn-outline-dark btn-sm shadow-sm py-2 px-3 fw-bold" onclick="cargarOrdenes()">
                <i class="fas fa-sync-alt me-1.5"></i> Actualizar Pedidos
            </button>`;
        cargarOrdenes();
    }
};

window.cerrarSesionAdmin = async function () {
    try {
        await fetch(AUTH_LOGOUT_URL, { method: 'POST', credentials: 'include' });
    } catch (e) {
        console.error("Error al cerrar sesión:", e);
    }
    sessionStorage.removeItem('myBellaAdminUser');
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
    } catch (error) {
        console.error("Error al cargar productos:", error);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5 text-danger">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    <p class="fw-bold mb-1">No se pudo conectar con el servidor backend.</p>
                    <small class="text-muted">Asegúrate de que Spring Boot esté corriendo en el puerto 8080.</small>
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
                <td colspan="8" class="text-center py-5 text-muted">
                    No se encontraron productos con los filtros aplicados.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = productos.map(p => {
        const fotoPrincipal = (p.imagenes && p.imagenes.length > 0) 
            ? p.imagenes[0] 
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
            ? variantes.map(v => `
                <span class="badge-talle ${v.stock < 2 ? 'badge-talle-critico' : ''} me-1 mb-1" 
                      title="Stock disponible: ${v.stock} unidades">
                    ${v.talle}: ${v.stock}u
                </span>`).join('')
            : ((p.talles && p.talles.length > 0) 
                ? p.talles.map(t => `<span class="badge-talle me-1">${t}</span>`).join('') 
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
                    <img src="${fotoPrincipal}" alt="${p.nombre}" class="thumb-img" onerror="this.src='https://via.placeholder.com/80x100?text=Foto'">
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
                <td class="text-end">
                    <button class="btn btn-outline-dark btn-sm py-1 px-2 rounded-1 me-1" onclick="abrirModalEditar('${p.id}')" title="Editar">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm py-1 px-2 rounded-1" onclick="eliminarProducto('${p.id}', '${p.nombre.replace(/'/g, "\\'")}')" title="Eliminar">
                        <i class="fas fa-trash-alt"></i>
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
        grid.innerHTML = '<div class="col-12 text-muted small py-1" style="font-size: 0.72rem;">Ningún talle seleccionado todavía. Haz clic arriba para activar.</div>';
        return;
    }

    chipsActivos.forEach(chip => {
        const talle = chip.getAttribute('data-talle');
        const valorStock = valoresActuales[talle] !== undefined ? valoresActuales[talle] : 5;

        const col = document.createElement('div');
        col.className = 'col-6 col-sm-4 col-md-3';
        col.innerHTML = `
            <div class="card p-2 border shadow-none bg-white">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="badge bg-dark" style="font-size: 0.65rem;">Talle ${talle}</span>
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

// --- MODAL: CREAR PRODUCTO ---
function abrirModalCrear() {
    document.getElementById('form-producto').reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('modalProductoLabel').innerHTML = '<i class="fas fa-plus-circle me-2"></i> Nuevo Producto';
    document.getElementById('btn-submit-producto').innerHTML = '<i class="fas fa-save me-1"></i> Guardar Producto';
    
    // Desmarcar todos los chips de talles
    document.querySelectorAll('#talles-chips-container .talle-chip').forEach(c => c.classList.remove('active'));
    actualizarGridInputsVariantes({});
    document.getElementById('prod-stock').checked = true;

    // Resetear galería de imágenes
    imagenesProductoActual = [];
    renderizarGaleriaPreview();
    
    const progress = document.getElementById('upload-progress-container');
    if (progress) progress.classList.add('d-none');

    modalInstancia.show();
}

// --- MODAL: EDITAR PRODUCTO ---
function abrirModalEditar(id) {
    const p = listaProductos.find(prod => String(prod.id) === String(id));
    if (!p) return;

    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-nombre').value = p.nombre || '';
    document.getElementById('prod-categoria').value = (p.categoria || 'conjuntos').toLowerCase();
    document.getElementById('prod-descripcion').value = p.descripcion || '';
    document.getElementById('prod-precioMinorista').value = p.precioMinorista || '';
    document.getElementById('prod-precioMayorista').value = p.precioMayorista || '';
    document.getElementById('prod-etiqueta').value = p.etiqueta || '';
    document.getElementById('prod-stock').checked = p.stock !== false;

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

    document.querySelectorAll('#talles-chips-container .talle-chip').forEach(chip => {
        const talle = chip.getAttribute('data-talle');
        if (tallesActivos.includes(talle)) {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
    });

    actualizarGridInputsVariantes(mapaStock);

    // Imágenes
    imagenesProductoActual = Array.isArray(p.imagenes) ? [...p.imagenes] : [];
    renderizarGaleriaPreview();

    document.getElementById('modalProductoLabel').innerHTML = `<i class="fas fa-edit me-2"></i> Editar Producto #${p.id}`;
    document.getElementById('btn-submit-producto').innerHTML = '<i class="fas fa-sync-alt me-1"></i> Actualizar Cambios';

    modalInstancia.show();
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
            const urlFinal = data.url || data.relativePath;
            if (urlFinal) {
                imagenesProductoActual.push(urlFinal);
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

// --- RENDERIZAR GALERÍA DE PREVIEWS ---
function renderizarGaleriaPreview() {
    const container = document.getElementById('galeria-preview-container');
    const textarea = document.getElementById('prod-imagenes');
    
    if (textarea) {
        textarea.value = imagenesProductoActual.join('\n');
    }
    if (!container) return;

    if (imagenesProductoActual.length === 0) {
        container.innerHTML = '<span class="text-muted small" style="font-size: 0.72rem;">No hay fotos seleccionadas aún.</span>';
        return;
    }

    container.innerHTML = imagenesProductoActual.map((url, index) => `
        <div class="gallery-preview-item" title="${url}">
            <img src="${url}" alt="Foto ${index + 1}" onerror="this.src='https://via.placeholder.com/80x100?text=Prenda'">
            <button type="button" class="btn-remove-thumb" onclick="eliminarImagenDeGaleria(${index})" title="Quitar imagen">&times;</button>
        </div>
    `).join('');
}

window.eliminarImagenDeGaleria = function (index) {
    imagenesProductoActual.splice(index, 1);
    renderizarGaleriaPreview();
};

window.sincronizarDesdeTextarea = function () {
    const raw = document.getElementById('prod-imagenes')?.value || '';
    imagenesProductoActual = raw.split(/[\n,]/).map(u => u.trim()).filter(u => u.length > 3);
    renderizarGaleriaPreview();
};

// --- GUARDAR PRODUCTO (POST O PUT) ---
async function guardarProducto(event) {
    event.preventDefault();

    const id = document.getElementById('prod-id').value;
    const nombre = document.getElementById('prod-nombre').value.trim();
    const categoria = document.getElementById('prod-categoria').value;
    const descripcion = document.getElementById('prod-descripcion').value.trim();
    const precioMinorista = parseFloat(document.getElementById('prod-precioMinorista').value);
    const precioMayoristaVal = document.getElementById('prod-precioMayorista').value;
    const precioMayorista = precioMayoristaVal ? parseFloat(precioMayoristaVal) : null;
    const etiqueta = document.getElementById('prod-etiqueta').value.trim() || null;
    const stock = document.getElementById('prod-stock').checked;

    // Obtener talles activos
    const talles = [];
    document.querySelectorAll('#talles-chips-container .talle-chip.active').forEach(chip => {
        talles.push(chip.getAttribute('data-talle'));
    });

    // Obtener variantes con stock numérico configurado
    const variantes = [];
    document.querySelectorAll('#variantes-stock-grid .input-stock-talle').forEach(input => {
        const talle = input.getAttribute('data-talle');
        const stockQty = parseInt(input.value, 10);
        if (talle) {
            variantes.push({
                talle: talle,
                stock: isNaN(stockQty) || stockQty < 0 ? 0 : stockQty
            });
        }
    });

    // Si hay talles activos pero por alguna razón no se generó input, asegurar variante con 0
    talles.forEach(t => {
        if (!variantes.some(v => v.talle === t)) {
            variantes.push({ talle: t, stock: 0 });
        }
    });

    // Imágenes del arreglo interactivo
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

        modalInstancia.hide();

        Swal.fire({
            icon: 'success',
            title: esEdicion ? '¡Producto Actualizado!' : '¡Producto Creado!',
            text: `"${nombre}" se guardó correctamente en la base de datos.`,
            confirmButtonColor: '#1a1a1a',
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
    Swal.fire({
        icon: 'warning',
        title: 'Acceso Restringido',
        text: mensaje,
        confirmButtonText: 'Iniciar Sesión',
        confirmButtonColor: '#1a1a1a'
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
        const res = await fetch(API_ORDENES, { credentials: 'include' });
        if (res.status === 401 || res.status === 403) {
            manejarNoAutorizado('Sesión vencida para consultar órdenes.');
            return;
        }
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

        listaOrdenes = await res.json();
        actualizarMetricasPedidos(listaOrdenes);
        filtrarYRenderizarPedidos();
    } catch (error) {
        console.error("Error al cargar pedidos:", error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5 text-danger">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    <p class="fw-bold mb-1">No se pudieron cargar las órdenes desde el servidor.</p>
                </td>
            </tr>`;
    }
}

function actualizarMetricasPedidos(ordenes) {
    const total = ordenes.length;
    const pendientes = ordenes.filter(o => o.estado === 'PENDIENTE').length;
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
        const coincideTexto = !texto ||
            (o.codigoSeguimiento && o.codigoSeguimiento.toLowerCase().includes(texto)) ||
            (o.clienteNombre && o.clienteNombre.toLowerCase().includes(texto)) ||
            (o.clienteTelefono && o.clienteTelefono.toLowerCase().includes(texto));
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
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5 text-muted">
                    No se encontraron órdenes registradas con los filtros aplicados.
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

        const telSanitizado = (o.clienteTelefono || '').replace(/[^0-9]/g, '');

        return `
            <tr>
                <td>
                    <span class="badge bg-dark font-monospace" style="letter-spacing: 0.5px;">#${o.codigoSeguimiento}</span>
                </td>
                <td class="small text-muted" style="white-space: nowrap;">
                    ${fechaStr}
                </td>
                <td>
                    <div class="fw-bold text-dark text-capitalize" style="font-size: 0.85rem;">
                        ${o.clienteNombre}
                    </div>
                    <div class="small">
                        <a href="https://wa.me/${telSanitizado}" target="_blank" class="text-success text-decoration-none">
                            <i class="fab fa-whatsapp me-1"></i>${o.clienteTelefono}
                        </a>
                    </div>
                </td>
                <td>
                    <span class="fw-semibold">${totalPrendas} prenda${totalPrendas === 1 ? '' : 's'}</span>
                    ${mayoristaBadge}
                </td>
                <td class="fw-bold text-dark">
                    $${Number(o.total).toLocaleString('es-AR')}
                </td>
                <td>
                    <select class="form-select form-select-sm" 
                            style="font-size: 0.75rem; font-weight: 600; width: 145px;"
                            onchange="cambiarEstadoPedido(${o.id}, this.value)">
                        <option value="PENDIENTE" ${o.estado === 'PENDIENTE' ? 'selected' : ''}>PENDIENTE</option>
                        <option value="PAGADO" ${o.estado === 'PAGADO' ? 'selected' : ''}>PAGADO</option>
                        <option value="EN_PREPARACION" ${o.estado === 'EN_PREPARACION' ? 'selected' : ''}>EN PREPARACIÓN</option>
                        <option value="ENVIADO" ${o.estado === 'ENVIADO' ? 'selected' : ''}>ENVIADO</option>
                        <option value="ENTREGADO" ${o.estado === 'ENTREGADO' ? 'selected' : ''}>ENTREGADO</option>
                        <option value="CANCELADO" ${o.estado === 'CANCELADO' ? 'selected' : ''}>CANCELADO</option>
                    </select>
                </td>
                <td class="text-end">
                    <button class="btn btn-outline-dark btn-sm py-1 px-2 rounded-1" onclick="verDetallePedido(${o.id})" title="Ver Detalle">
                        <i class="fas fa-eye me-1"></i> Detalle
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

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
            <td class="fw-bold">${item.productoNombre}</td>
            <td class="text-center"><span class="badge bg-light text-dark border">${item.talle || '-'}</span></td>
            <td class="text-center">${item.cantidad}</td>
            <td class="text-end">$${Number(item.precioUnitario).toLocaleString('es-AR')}</td>
            <td class="text-end fw-bold">$${Number(item.subtotal).toLocaleString('es-AR')}</td>
        </tr>
    `).join('');

    const telSanitizado = (orden.clienteTelefono || '').replace(/[^0-9]/g, '');
    const mensajeWsp = `Hola ${orden.clienteNombre}, te contactamos desde My Bella Afrodita sobre tu pedido #${orden.codigoSeguimiento}.`;
    if (btnWhatsapp) {
        btnWhatsapp.href = `https://wa.me/${telSanitizado}?text=${encodeURIComponent(mensajeWsp)}`;
    }

    modalBody.innerHTML = `
        <div class="row g-3 mb-3">
            <div class="col-md-6">
                <div class="p-3 bg-light rounded">
                    <div class="text-muted small text-uppercase fw-bold" style="font-size: 0.65rem;">Información del Cliente</div>
                    <div class="fw-bold text-dark h6 mb-1">${orden.clienteNombre}</div>
                    <div class="small text-muted"><i class="fas fa-phone-alt me-1"></i> ${orden.clienteTelefono}</div>
                    <div class="small text-muted"><i class="fas fa-map-marker-alt me-1"></i> ${orden.clienteDireccion || 'Entrega a convenir'}</div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="p-3 bg-light rounded">
                    <div class="text-muted small text-uppercase fw-bold" style="font-size: 0.65rem;">Datos del Pedido</div>
                    <div class="fw-bold font-monospace text-dark mb-1">#${orden.codigoSeguimiento}</div>
                    <div class="small text-muted"><i class="fas fa-calendar-alt me-1"></i> ${fechaStr}</div>
                    <div class="small text-muted"><i class="fas fa-credit-card me-1"></i> Método: <b>${orden.metodoPago || 'WHATSAPP_EFECTIVO'}</b></div>
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

        <div class="p-3 bg-light rounded d-flex justify-content-between align-items-center">
            <div>
                ${orden.esMayorista 
                    ? `<span class="badge bg-success me-1">Precio Mayorista Aplicado</span>`
                    : ''}
                ${orden.descuentoMayorista && Number(orden.descuentoMayorista) > 0 
                    ? `<small class="text-success fw-bold d-block mt-1">Ahorro mayorista: -$${Number(orden.descuentoMayorista).toLocaleString('es-AR')}</small>`
                    : ''}
            </div>
            <div class="text-end">
                <div class="text-muted small">Total Final:</div>
                <div class="h4 fw-bold text-dark mb-0">$${Number(orden.total).toLocaleString('es-AR')}</div>
            </div>
        </div>
    `;

    if (modalDetallePedidoInstancia) {
        modalDetallePedidoInstancia.show();
    }
};
