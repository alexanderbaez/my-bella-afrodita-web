/* ==========================================================================
   ADMIN.JS - BACKOFFICE & GESTIÓN DE CATÁLOGO (MY BELLA AFRODITA)
   ========================================================================== */

const API_BASE = 'http://localhost:8080/api/productos';
const AUTH_VERIFY = 'http://localhost:8080/api/auth/verify';

// Verificación de Sesión Administrativa
let authHeader = sessionStorage.getItem('myBellaAdminAuth');
if (!authHeader) {
    window.location.href = './login.html';
}

let listaProductos = [];
let modalInstancia = null;

document.addEventListener('DOMContentLoaded', () => {
    modalInstancia = new bootstrap.Modal(document.getElementById('modalProducto'));

    // Configurar chips de talles interactivos
    document.querySelectorAll('#talles-chips-container .talle-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            chip.classList.toggle('active');
        });
    });

    // Preview de imágenes en vivo al escribir en el textarea
    const inputImagenes = document.getElementById('prod-imagenes');
    if (inputImagenes) {
        inputImagenes.addEventListener('input', actualizarPreviewImagenes);
    }

    // Buscador y filtro de categorías en tiempo real
    const inputBusqueda = document.getElementById('filtro-busqueda');
    const selectCategoria = document.getElementById('filtro-categoria');
    if (inputBusqueda) inputBusqueda.addEventListener('input', filtrarYRenderizar);
    if (selectCategoria) selectCategoria.addEventListener('change', filtrarYRenderizar);

    // Cargar productos
    cargarProductos();
});

window.cerrarSesionAdmin = function () {
    sessionStorage.removeItem('myBellaAdminAuth');
    sessionStorage.removeItem('myBellaAdminUser');
    window.location.href = './login.html';
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

        const tallesHtml = (p.talles && p.talles.length > 0)
            ? p.talles.map(t => `<span class="badge-talle me-1">${t}</span>`).join('')
            : '<span class="text-muted small">-</span>';

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
                    <div class="d-flex flex-wrap gap-1">
                        ${tallesHtml}
                    </div>
                </td>
                <td class="text-center">
                    <div class="form-check form-switch d-inline-block">
                        <input class="form-check-input" type="checkbox" role="switch" 
                               ${p.stock !== false ? 'checked' : ''} 
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
            headers: {
                'Authorization': authHeader
            }
        });

        if (res.status === 401) {
            switchElem.checked = !switchElem.checked;
            solicitarLogin('Credenciales inválidas o no autorizadas.');
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

// --- MODAL: CREAR PRODUCTO ---
function abrirModalCrear() {
    document.getElementById('form-producto').reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('modalProductoLabel').innerHTML = '<i class="fas fa-plus-circle me-2"></i> Nuevo Producto';
    document.getElementById('btn-submit-producto').innerHTML = '<i class="fas fa-save me-1"></i> Guardar Producto';
    
    // Desmarcar todos los chips de talles
    document.querySelectorAll('#talles-chips-container .talle-chip').forEach(c => c.classList.remove('active'));
    document.getElementById('preview-imagenes').innerHTML = '';
    document.getElementById('prod-stock').checked = true;

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

    // Talles
    const tallesProducto = p.talles || [];
    document.querySelectorAll('#talles-chips-container .talle-chip').forEach(chip => {
        const talle = chip.getAttribute('data-talle');
        if (tallesProducto.includes(talle)) {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
    });

    // Imágenes
    const imagenesTexto = (p.imagenes || []).join('\n');
    document.getElementById('prod-imagenes').value = imagenesTexto;
    actualizarPreviewImagenes();

    document.getElementById('modalProductoLabel').innerHTML = `<i class="fas fa-edit me-2"></i> Editar Producto #${p.id}`;
    document.getElementById('btn-submit-producto').innerHTML = '<i class="fas fa-sync-alt me-1"></i> Actualizar Cambios';

    modalInstancia.show();
}

// --- PREVIEW DINÁMICO DE IMÁGENES ---
function actualizarPreviewImagenes() {
    const raw = document.getElementById('prod-imagenes')?.value || '';
    const container = document.getElementById('preview-imagenes');
    if (!container) return;

    const urls = raw.split(/[\n,]/).map(u => u.trim()).filter(u => u.length > 5);
    if (urls.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = urls.map(url => `
        <img src="${url}" class="rounded border" style="width: 50px; height: 60px; object-fit: cover;" onerror="this.style.display='none'">
    `).join('');
}

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

    // Obtener imágenes
    const rawImagenes = document.getElementById('prod-imagenes').value;
    const imagenes = rawImagenes.split(/[\n,]/).map(u => u.trim()).filter(u => u.length > 5);

    const payload = {
        nombre,
        categoria,
        descripcion,
        precioMinorista,
        precioMayorista,
        etiqueta,
        stock,
        talles,
        imagenes
    };

    const esEdicion = Boolean(id);
    const url = esEdicion ? `${API_BASE}/${id}` : API_BASE;
    const metodo = esEdicion ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify(payload)
        });

        if (res.status === 401) {
            solicitarLogin('Por favor autentícate como administrador para guardar cambios.');
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
            headers: {
                'Authorization': authHeader
            }
        });

        if (res.status === 401) {
            solicitarLogin('Debes estar autenticado para eliminar productos.');
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

// --- AUTENTICACIÓN / CREDENCIALES ---
function configurarCredenciales() {
    Swal.fire({
        title: 'Credenciales de Administrador',
        html: `
            <div class="text-start">
                <label class="form-label small fw-bold">Usuario</label>
                <input type="text" id="swal-user" class="form-control mb-2" value="admin">
                <label class="form-label small fw-bold">Contraseña</label>
                <input type="password" id="swal-pass" class="form-control" value="admin123">
                <small class="text-muted mt-2 d-block">Por defecto: admin / admin123</small>
            </div>
        `,
        confirmButtonText: 'Guardar Credenciales',
        confirmButtonColor: '#1a1a1a',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const u = document.getElementById('swal-user').value;
            const p = document.getElementById('swal-pass').value;
            if (!u || !p) {
                Swal.showValidationMessage('Ingresa usuario y contraseña');
                return false;
            }
            return { u, p };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            const token = 'Basic ' + btoa(`${result.value.u}:${result.value.p}`);
            
            // Verificar contra endpoint de autenticación
            try {
                const res = await fetch(AUTH_VERIFY, {
                    headers: { 'Authorization': token }
                });
                if (res.ok) {
                    authHeader = token;
                    sessionStorage.setItem('myBellaAdminAuth', token);
                    Swal.fire({
                        icon: 'success',
                        title: '¡Autenticado!',
                        text: `Sesión iniciada como "${result.value.u}".`,
                        timer: 1500,
                        showConfirmButton: false
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error de Autenticación',
                        text: 'Usuario o contraseña incorrectos en el backend.'
                    });
                }
            } catch (err) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Servidor no disponible',
                    text: 'No se pudo contactar con el backend para verificar.'
                });
            }
        }
    });
}

function solicitarLogin(mensaje) {
    Swal.fire({
        icon: 'warning',
        title: 'Acceso Restringido',
        text: mensaje || 'Por favor autentícate con tus credenciales de administrador.',
        confirmButtonText: 'Ingresar Credenciales',
        confirmButtonColor: '#1a1a1a'
    }).then(() => {
        configurarCredenciales();
    });
}
