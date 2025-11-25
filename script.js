// =================================================================
// script.js - CÓDIGO COMPLETO Y FUNCIONAL DE MY BELLA AFRODITA
// =================================================================

document.addEventListener('DOMContentLoaded', () => {

    // 💰 Configuración global (Tu número de contacto fijo)
    const WHATSAPP_NUMBER = '5492645468570';

    // ----------------------------------------------------
    // 1. Manejo de la compra por WhatsApp
    // ----------------------------------------------------
    const whatsappButtons = document.querySelectorAll('.btn-whatsapp-product');

    whatsappButtons.forEach(button => {
        button.addEventListener('click', () => {

            const card = button.closest('.card, .promo-card');
            const productName = button.getAttribute('data-product');
            const productType = button.getAttribute('data-type') || 'Artículo';
            const promoType = button.getAttribute('data-promo-type');

            let selectedTalle = 'N/A';
            let priceText = 'Precio no especificado';

            // --- A. Obtención y Validación del Talle ---
            const talleGroupContainer = card.querySelector('.talle-select-group');
            
            if (talleGroupContainer) {
                // Si existe el grupo de talles, busca la selección
                const checkedRadio = talleGroupContainer.querySelector('input[type="radio"]:checked');
                selectedTalle = checkedRadio ? checkedRadio.value : null;

                // Si no se seleccionó un talle, notifica al usuario y detiene
                if (!selectedTalle) {
                    alert(`¡Por favor, selecciona un talle para el/la ${productName} antes de consultar!`);
                    return; 
                }
            } else {
                // Para productos de Talle Único o sin selección
                selectedTalle = button.getAttribute('data-size') || 'Único'; 
            }

            // --- B. Obtención del Precio ---
            // Busca el precio en las clases: .price-final (promociones) o .price-text (catálogo)
            const priceElement = card.querySelector('.price-final, .price-text');
            
            if (priceElement) {
                priceText = priceElement.textContent.trim();
            }

            // --- C. Construcción del Mensaje Interactivo ---
            let message = `¡Hola! 👋 Estoy interesada/o en un artículo de My Bella Afrodita.`;
            message += `\n\n🛍️ *Detalles de la Consulta*`;
            message += `\n---------------------------------`;
            message += `\n✨ Producto: *${productName}*`;
            message += `\n🏷️ Tipo: ${productType}`;

            if (selectedTalle && selectedTalle !== 'N/A') {
                message += `\n📏 Talle Solicitado: *${selectedTalle}*`;
            }

            message += `\n💰 Precio Estimado: ${priceText}`;

            if (promoType) {
                message += `\n\n🚨 ¡Quiero aprovechar la OFERTA! Tipo: *${promoType}*.`;
                message += `\nPor favor, confírmame el precio final y el stock disponible.`;
            } else {
                message += `\n\n❓ Quisiera confirmar stock y obtener más detalles de este producto.`;
            }
            message += `\n---------------------------------`;
            message += `\n¡Gracias!`;

            // --- D. Apertura del Enlace ---
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

            // Abre WhatsApp en una nueva pestaña (la acción que soluciona el problema de los <a>)
            window.open(whatsappUrl, '_blank');
        });
    });

    // ----------------------------------------------------
    // 2. Lógica para el cambio de color de la barra de navegación (Scroll)
    // ----------------------------------------------------
    const nav = document.getElementById('mainNav');
    if (nav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                // Agrega la clase 'scrolled' cuando el usuario se desplaza
                nav.classList.add('scrolled'); 
            } else {
                // Remueve la clase 'scrolled' al volver arriba
                nav.classList.remove('scrolled');
            }
        });
    }
});