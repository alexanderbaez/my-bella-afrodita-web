/**
 * ==========================================================================
 * LOGIN.JS - ACCESO PRIVADO / ATELIER (MY BELLA AFRODITA)
 * Control de autenticación, alternancia de contraseña, persistencia y feedback.
 * ==========================================================================
 */

const AUTH_STATUS_URL = '/api/auth/status';
const AUTH_LOGIN_URL = '/api/auth/login';

document.addEventListener('DOMContentLoaded', () => {
    inicializarVistaLogin();
    verificarSesionExistente();
});

/**
 * Inicializa event listeners, campos recordados y alternador de contraseña
 */
function inicializarVistaLogin() {
    const formLogin = document.getElementById('form-login');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('btn-toggle-password');
    const rememberMeCheckbox = document.getElementById('remember-me');

    // Recuperar credenciales recordadas si existen
    const recordado = localStorage.getItem('myBellaRememberMe') === 'true';
    if (recordado && rememberMeCheckbox && emailInput) {
        rememberMeCheckbox.checked = true;
        const emailGuardado = localStorage.getItem('myBellaRememberEmail');
        if (emailGuardado) {
            emailInput.value = emailGuardado;
            if (passwordInput) passwordInput.focus();
        }
    } else if (emailInput) {
        emailInput.value = 'lopezandre26@gmail.com';
    }

    // Toggle ver/ocultar contraseña
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const eyeIcon = document.getElementById('eye-icon');
            const isPassword = passwordInput.getAttribute('type') === 'password';
            
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            if (eyeIcon) {
                if (isPassword) {
                    eyeIcon.classList.remove('fa-eye');
                    eyeIcon.classList.add('fa-eye-slash');
                    togglePasswordBtn.setAttribute('title', 'Ocultar contraseña');
                } else {
                    eyeIcon.classList.remove('fa-eye-slash');
                    eyeIcon.classList.add('fa-eye');
                    togglePasswordBtn.setAttribute('title', 'Mostrar contraseña');
                }
            }
        });
    }

    // Manejo del formulario
    if (formLogin) {
        formLogin.addEventListener('submit', ejecutarLogin);
    }

    // Limpiar feedback de error al escribir
    if (emailInput) {
        emailInput.addEventListener('input', ocultarErrorFeedback);
    }
    if (passwordInput) {
        passwordInput.addEventListener('input', ocultarErrorFeedback);
    }
}

/**
 * Verifica si ya existe una sesión activa de administrador en el backend
 * y redirige inmediatamente al Backoffice si es válida.
 */
async function verificarSesionExistente() {
    try {
        const res = await fetch(AUTH_STATUS_URL, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
        });

        if (res.ok) {
            const data = await res.json();
            if (data.authenticated && data.rol === 'ROLE_ADMIN') {
                sessionStorage.setItem('myBellaAdminUser', JSON.stringify(data));
                window.location.replace('/admin.html');
            }
        }
    } catch (e) {
        // En caso de desconexión o primer ingreso, continuar en login
        console.debug('Sesión no activa:', e);
    }
}

/**
 * Ejecuta la autenticación de alta costura contra /api/auth/login
 */
async function ejecutarLogin(event) {
    event.preventDefault();

    const btn = document.getElementById('btn-login');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('remember-me');

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!email || !password) {
        mostrarErrorFeedback('Por favor, complete su email corporativo y clave de acceso.');
        return;
    }

    ocultarErrorFeedback();

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Validando credenciales...';
    }

    try {
        const res = await fetch(AUTH_LOGIN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok && data.authenticated && data.rol === 'ROLE_ADMIN') {
            // Manejo de persistencia de sesión
            const recordar = rememberMeCheckbox && rememberMeCheckbox.checked;
            sessionStorage.setItem('myBellaAdminUser', JSON.stringify(data));

            if (recordar) {
                localStorage.setItem('myBellaRememberMe', 'true');
                localStorage.setItem('myBellaRememberEmail', email);
                localStorage.setItem('myBellaAdminUser', JSON.stringify(data));
            } else {
                localStorage.removeItem('myBellaRememberMe');
                localStorage.removeItem('myBellaRememberEmail');
                localStorage.removeItem('myBellaAdminUser');
            }

            // Transición suave e inmediata a /admin.html
            if (btn) {
                btn.classList.remove('btn-luxury-login');
                btn.classList.add('btn-luxury-success');
                btn.innerHTML = '<i class="fas fa-check me-2"></i> Acceso Concedido · Entrando...';
            }

            setTimeout(() => {
                window.location.href = '/admin.html';
            }, 350);

        } else {
            const mensajeError = data.error || 'Credenciales incorrectas. Verifique su email y contraseña.';
            mostrarErrorFeedback(mensajeError);
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i> Ingresar al Atelier';
            }
        }
    } catch (error) {
        console.error('Error durante autenticación:', error);
        mostrarErrorFeedback('No se pudo conectar con el servidor del Atelier. Intente nuevamente.');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i> Ingresar al Atelier';
        }
    }
}

/**
 * Muestra el cuadro de error en rojo terciopelo sin romper el layout
 */
function mostrarErrorFeedback(mensaje) {
    const feedbackBox = document.getElementById('login-feedback');
    const feedbackText = document.getElementById('login-feedback-text');
    const loginCard = document.querySelector('.login-card');

    if (feedbackBox && feedbackText) {
        feedbackText.textContent = mensaje;
        feedbackBox.classList.remove('d-none');
        feedbackBox.classList.add('show');
    }

    if (loginCard) {
        loginCard.classList.remove('shake-subtle');
        // Forzar reflow para reiniciar la animación
        void loginCard.offsetWidth;
        loginCard.classList.add('shake-subtle');
    }
}

/**
 * Oculta el cuadro de error
 */
function ocultarErrorFeedback() {
    const feedbackBox = document.getElementById('login-feedback');
    if (feedbackBox && !feedbackBox.classList.contains('d-none')) {
        feedbackBox.classList.remove('show');
        feedbackBox.classList.add('d-none');
    }
}
