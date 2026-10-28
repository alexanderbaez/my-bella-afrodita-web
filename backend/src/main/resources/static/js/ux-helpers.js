/* ==========================================================================
   UX HELPERS - MI BELLA AFRODITA
   Se carga ANTES de script.js / producto.js en las vistas públicas.
   Sin dependencias; no toca lógica de negocio ni endpoints.
   ========================================================================== */

// --- Placeholder local (reemplaza a via.placeholder.com; un data-URI no puede fallar) ---
const IMG_FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400">' +
    '<rect width="300" height="400" fill="#FAF6F3"/>' +
    '<text x="150" y="205" text-anchor="middle" font-family="Georgia,serif" ' +
    'font-size="16" fill="#C5A059" letter-spacing="2">MI BELLA AFRODITA</text>' +
    '</svg>');
window.IMG_FALLBACK = IMG_FALLBACK;

window.imgError = function (img) {
    img.onerror = null; // evita bucles si el fallback fallara
    img.src = IMG_FALLBACK;
    img.classList.add('is-loaded');
    img.parentElement && img.parentElement.classList.remove('is-loading');
};

window.imgLoaded = function (img) {
    img.classList.add('is-loaded');
    img.parentElement && img.parentElement.classList.remove('is-loading');
};

// --- Skeleton shimmer para grillas (se reemplaza solo al renderizar el contenido real) ---
window.renderSkeletonGrid = function (container, n, colClass) {
    if (!container) return;
    const cols = colClass || 'col-6 col-md-4 col-lg-3';
    container.innerHTML = Array.from({ length: n || 8 }, function () {
        return '<div class="' + cols + ' skeleton-col" aria-hidden="true">' +
            '<div class="skeleton skeleton-card"></div>' +
            '<div class="skeleton skeleton-line short"></div>' +
            '<div class="skeleton skeleton-line"></div>' +
            '</div>';
    }).join('') + '<span class="visually-hidden" role="status">Cargando colección…</span>';
};

// --- Teléfono argentino flexible: acepta 264 555-1234, 0264 15 555 1234, +54 9 264 5551234, etc. ---
window.esTelefonoArgentinoValido = function (valor) {
    const d = String(valor || '').replace(/\D/g, '');
    return d.length >= 8 && d.length <= 13;
};

// --- Validación inline: marca campo, mensaje accesible ---
window.marcarCampoInvalido = function (el, mensaje) {
    if (!el) return;
    el.classList.add('is-invalid');
    el.setAttribute('aria-invalid', 'true');
    const parent = el.closest('.swal-field') || el.parentElement;
    let fb = parent.querySelector('.field-error[data-for="' + el.id + '"]');
    if (!fb) {
        fb = document.createElement('div');
        fb.className = 'field-error';
        fb.id = el.id + '-error';
        fb.dataset.for = el.id;
        fb.setAttribute('role', 'alert');
        el.insertAdjacentElement('afterend', fb);
    }
    fb.textContent = mensaje;
    el.setAttribute('aria-describedby', fb.id);
};

window.limpiarCampoInvalido = function (el) {
    if (!el) return;
    el.classList.remove('is-invalid');
    el.removeAttribute('aria-invalid');
    el.removeAttribute('aria-describedby');
    const parent = el.closest('.swal-field') || el.parentElement;
    const fb = parent && parent.querySelector('.field-error[data-for="' + el.id + '"]');
    if (fb) fb.remove();
};
