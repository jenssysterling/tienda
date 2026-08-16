// ========================================
// PEDIDO.JS - Lógica del carrito y checkout
// Maneja: renderizado del carrito, cálculos, validación y WhatsApp
// ========================================

// ========================================
// VARIABLES GLOBALES
// ========================================

let carritoActual = [];
let totalCarrito = 0;
let totalItems = 0;

// ========================================
// FUNCIONES DE RENDERIZADO DEL CARRITO
// ========================================

// Renderizar todos los items del carrito
function renderizarPedido() {
    const container = document.getElementById('cartItemsContainer');
    if (!container) return;
    
    // Cargar carrito desde localStorage
    try {
        const guardado = localStorage.getItem('carrito');
        if (guardado) {
            carritoActual = JSON.parse(guardado);
        } else {
            carritoActual = [];
        }
    } catch (e) {
        console.error('Error al cargar el carrito:', e);
        carritoActual = [];
    }
    
    // Si el carrito está vacío
    if (!carritoActual || carritoActual.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-message text-center py-5">
                <i class="fas fa-shopping-basket fa-4x text-muted mb-3"></i>
                <h4>Tu pedido está vacío</h4>
                <p class="text-muted">Aún no has agregado productos a tu pedido.</p>
                <a href="productos.html" class="btn btn-primary btn-lg mt-3">
                    <i class="fas fa-store"></i> Ver productos
                </a>
            </div>
        `;
        
        // Actualizar resumen
        actualizarResumen(0, 0);
        
        // Deshabilitar botón de enviar
        const sendBtn = document.getElementById('sendWhatsAppBtn');
        if (sendBtn) sendBtn.disabled = true;
        
        return;
    }
    
    // Habilitar botón de enviar
    const sendBtn = document.getElementById('sendWhatsAppBtn');
    if (sendBtn) sendBtn.disabled = false;
    
    // Generar HTML de los items
    let html = '';
    carritoActual.forEach((item, index) => {
        const subtotal = (item.precio * item.cantidad).toFixed(2);
        
        html += `
            <div class="cart-item" data-item-id="${item.id}">
                <!-- Imagen -->
                <div class="item-image-placeholder">
                    ${obtenerIconoPorCategoria(item.categoria)}
                </div>
                
                <!-- Información -->
                <div class="item-info">
                    <p class="item-name">${item.nombre}</p>
                    <p class="item-presentation">${item.presentacion}</p>
                    <p class="item-price">S/ ${item.precio.toFixed(2)}</p>
                </div>
                
                <!-- Controles -->
                <div class="item-controls">
                    <button class="btn-qty-sm" onclick="disminuirItem(${item.id})" 
                            aria-label="Disminuir cantidad de ${item.nombre}">
                        −
                    </button>
                    <span class="qty-display-sm" id="pedido-qty-${item.id}">${item.cantidad}</span>
                    <button class="btn-qty-sm" onclick="aumentarItem(${item.id})"
                            aria-label="Aumentar cantidad de ${item.nombre}">
                        +
                    </button>
                    <button class="btn-qty-sm btn-danger-sm" onclick="eliminarItem(${item.id})"
                            aria-label="Eliminar ${item.nombre} del pedido">
                        🗑️
                    </button>
                </div>
                
                <!-- Subtotal -->
                <div class="item-subtotal">${subtotal}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Calcular y actualizar resumen
    const total = calcularTotal(carritoActual);
    const items = calcularTotalItems(carritoActual);
    actualizarResumen(items, total);
}

// Obtener icono según categoría
function obtenerIconoPorCategoria(categoria) {
    const iconos = {
        'abarrotes': '🍚',
        'bebidas': '🥤',
        'lacteos': '🧀',
        'snacks': '🍪',
        'limpieza': '🧹',
        'higiene': '🧴',
        'otros': '📦'
    };
    return iconos[categoria] || '📦';
}

// ========================================
// FUNCIONES DE CÁLCULO
// ========================================

// Calcular total del carrito
function calcularTotal(carrito) {
    if (!carrito || carrito.length === 0) return 0;
    return carrito.reduce((total, item) => {
        return total + (item.precio * item.cantidad);
    }, 0);
}

// Calcular cantidad total de items
function calcularTotalItems(carrito) {
    if (!carrito || carrito.length === 0) return 0;
    return carrito.reduce((total, item) => total + item.cantidad, 0);
}

// Actualizar resumen del pedido
function actualizarResumen(items, total) {
    const totalItemsEl = document.getElementById('totalItems');
    const totalPriceEl = document.getElementById('totalPrice');
    
    if (totalItemsEl) {
        totalItemsEl.textContent = items === 1 ? '1 producto' : `${items} productos`;
    }
    
    if (totalPriceEl) {
        totalPriceEl.innerHTML = `<strong>S/ ${total.toFixed(2)}</strong>`;
    }
    
    // Actualizar variables globales
    totalCarrito = total;
    totalItems = items;
}

// ========================================
// FUNCIONES DE CONTROL DEL CARRITO
// ========================================

// Aumentar cantidad de un item
function aumentarItem(productoId) {
    let carrito = obtenerCarrito();
    const item = carrito.find(p => p.id === productoId);
    
    if (item) {
        item.cantidad += 1;
        guardarCarrito(carrito);
        renderizarPedido();
        actualizarContadorGlobal();
        
        // Mostrar notificación
        mostrarNotificacion(`📦 ${item.nombre}: +1`, 'success', 1500);
    }
}

// Disminuir cantidad de un item
function disminuirItem(productoId) {
    let carrito = obtenerCarrito();
    const item = carrito.find(p => p.id === productoId);
    
    if (!item) return;
    
    if (item.cantidad > 1) {
        item.cantidad -= 1;
        guardarCarrito(carrito);
        renderizarPedido();
        actualizarContadorGlobal();
        
        // Mostrar notificación
        mostrarNotificacion(`📦 ${item.nombre}: -1`, 'info', 1500);
    } else {
        // Si la cantidad es 1, preguntar si quiere eliminar
        if (confirm(`¿Eliminar "${item.nombre}" del pedido?`)) {
            eliminarItem(productoId);
        }
    }
}

// Eliminar un item del carrito
function eliminarItem(productoId) {
    let carrito = obtenerCarrito();
    const item = carrito.find(p => p.id === productoId);
    
    if (!item) return;
    
    // Confirmar eliminación
    if (!confirm(`¿Eliminar "${item.nombre}" del pedido?`)) {
        return;
    }
    
    carrito = carrito.filter(p => p.id !== productoId);
    guardarCarrito(carrito);
    renderizarPedido();
    actualizarContadorGlobal();
    
    // Mostrar notificación
    mostrarNotificacion(`🗑️ "${item.nombre}" eliminado`, 'warning', 2000);
}

// Vaciar todo el carrito
function vaciarPedido() {
    const carrito = obtenerCarrito();
    if (!carrito || carrito.length === 0) {
        mostrarNotificacion('El pedido ya está vacío', 'info', 2000);
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres vaciar todo tu pedido?')) {
        guardarCarrito([]);
        renderizarPedido();
        actualizarContadorGlobal();
        mostrarNotificacion('🗑️ Pedido vaciado completamente', 'warning', 3000);
    }
}

// ========================================
// FUNCIONES DE PERSISTENCIA
// ========================================

// Obtener carrito desde localStorage
function obtenerCarrito() {
    try {
        const guardado = localStorage.getItem('carrito');
        if (guardado) {
            return JSON.parse(guardado);
        }
    } catch (e) {
        console.error('Error al obtener carrito:', e);
    }
    return [];
}

// Guardar carrito en localStorage
function guardarCarrito(carrito) {
    try {
        localStorage.setItem('carrito', JSON.stringify(carrito));
    } catch (e) {
        console.error('Error al guardar carrito:', e);
    }
}

// ========================================
// FUNCIONES DE VALIDACIÓN
// ========================================

// Validar formulario de datos del cliente
function validarFormulario() {
    const nombre = document.getElementById('customerName');
    const celular = document.getElementById('customerPhone');
    let valido = true;
    
    // Validar nombre
    if (!nombre.value.trim()) {
        nombre.classList.add('is-invalid');
        valido = false;
    } else {
        nombre.classList.remove('is-invalid');
    }
    
    // Validar celular
    const celularLimpio = celular.value.trim().replace(/\s/g, '');
    if (!celularLimpio || celularLimpio.length < 9) {
        celular.classList.add('is-invalid');
        valido = false;
    } else {
        celular.classList.remove('is-invalid');
    }
    
    return valido;
}

// ========================================
// FUNCIONES DE WHATSAPP
// ========================================

// Generar mensaje de WhatsApp
function generarMensajePedido(nombre, celular) {
    const carrito = obtenerCarrito();
    
    if (!carrito || carrito.length === 0) {
        mostrarNotificacion('Tu pedido está vacío. Agrega productos primero.', 'warning');
        return null;
    }
    
    // Validar datos
    if (!nombre || !celular) {
        mostrarNotificacion('Por favor, completa todos tus datos.', 'error');
        return null;
    }
    
    // Limpiar celular
    const celularLimpio = celular.replace(/\s/g, '');
    if (celularLimpio.length < 9) {
        mostrarNotificacion('El número de celular debe tener al menos 9 dígitos.', 'error');
        return null;
    }
    
    // Construir mensaje
    let mensaje = 'Hola, quiero realizar el siguiente pedido:\n\n';
    mensaje += '🛒 *MI PEDIDO*\n';
    mensaje += '─'.repeat(25) + '\n\n';
    
    // Lista de productos
    carrito.forEach((item, index) => {
        const subtotal = (item.precio * item.cantidad).toFixed(2);
        const nombreCompleto = `${item.nombre} ${item.presentacion}`;
        mensaje += `${index + 1}. ${nombreCompleto}\n`;
        mensaje += `   ${item.cantidad} × S/ ${item.precio.toFixed(2)} = S/ ${subtotal}\n\n`;
    });
    
    mensaje += '─'.repeat(25) + '\n';
    const total = calcularTotal(carrito);
    mensaje += `💰 *TOTAL: S/ ${total.toFixed(2)}*\n\n`;
    
    mensaje += '🏪 Recogeré mi pedido en tienda.\n';
    mensaje += '⏱️ Tiempo de recojo: 30 - 60 minutos\n\n';
    
    mensaje += '👤 *DATOS DEL CLIENTE*\n';
    mensaje += `Nombre: ${nombre}\n`;
    mensaje += `Celular: ${celularLimpio}\n\n`;
    
    mensaje += '🙏 ¡Gracias!';
    
    return mensaje;
}

// Enviar pedido por WhatsApp
function enviarPedidoWhatsApp() {
    // Validar formulario
    if (!validarFormulario()) {
        mostrarNotificacion('Por favor, completa todos los campos correctamente.', 'error');
        return;
    }
    
    // Obtener datos
    const nombre = document.getElementById('customerName').value.trim();
    const celular = document.getElementById('customerPhone').value.trim();
    
    // Generar mensaje
    const mensaje = generarMensajePedido(nombre, celular);
    if (!mensaje) return;
    
    // Verificar que hay productos
    const carrito = obtenerCarrito();
    if (!carrito || carrito.length === 0) {
        mostrarNotificacion('Tu pedido está vacío. Agrega productos primero.', 'warning');
        return;
    }
    
    // Obtener número de WhatsApp
    const numeroWhatsApp = window.WHATSAPP_NUMBER || '51953870664';
    
    // Crear URL de WhatsApp
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
    
    // Abrir WhatsApp en nueva ventana
    window.open(url, '_blank');
    
    // Mostrar notificación de éxito
    mostrarNotificacion('✅ WhatsApp abierto con tu pedido listo para enviar.', 'success', 5000);
    
    // Opcional: limpiar carrito después de enviar (comentado para que el usuario decida)
    // setTimeout(() => {
    //     if (confirm('¿Quieres vaciar tu carrito después de enviar el pedido?')) {
    //         vaciarPedido();
    //     }
    // }, 2000);
}

// ========================================
// FUNCIONES DE NOTIFICACIÓN
// ========================================

// Mostrar notificación temporal (usa la función global o una local)
function mostrarNotificacion(mensaje, tipo = 'success', duracion = 3000) {
    // Intentar usar la función global primero
    if (typeof window.mostrarNotificacion === 'function') {
        window.mostrarNotificacion(mensaje, tipo, duracion);
        return;
    }
    
    // Fallback: notificación simple
    console.log(`[${tipo}] ${mensaje}`);
    
    // Crear notificación básica
    const container = document.getElementById('notification-container') || crearContainerNotificacion();
    const notification = document.createElement('div');
    
    const colores = {
        success: '#2d7d46',
        error: '#dc3545',
        warning: '#e8a838',
        info: '#17a2b8'
    };
    
    notification.style.cssText = `
        background: white;
        color: #1a1a1a;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        margin-bottom: 8px;
        border-left: 4px solid ${colores[tipo] || colores.success};
        font-size: 14px;
        animation: slideUp 0.3s ease;
        width: 100%;
    `;
    
    notification.textContent = mensaje;
    container.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, duracion);
}

// Crear contenedor de notificaciones
function crearContainerNotificacion() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        max-width: 90%;
        width: 400px;
        pointer-events: none;
    `;
    document.body.appendChild(container);
    return container;
}

// ========================================
// FUNCIONES DE UTILIDAD
// ========================================

// Actualizar contador global (usa la función de app.js)
function actualizarContadorGlobal() {
    if (typeof window.actualizarContadorGlobal === 'function') {
        window.actualizarContadorGlobal();
    } else {
        // Fallback: actualizar manualmente
        const carrito = obtenerCarrito();
        const total = calcularTotalItems(carrito);
        const contadores = document.querySelectorAll('#cartCounter');
        contadores.forEach(contador => {
            contador.textContent = total;
            contador.style.display = total > 0 ? 'flex' : 'none';
        });
    }
}

// Formatear precio en soles
function formatearPrecio(precio) {
    return `S/ ${precio.toFixed(2)}`;
}

// ========================================
// EVENTOS Y CONFIGURACIÓN
// ========================================

// Configurar eventos de la página
function configurarEventos() {
    // Botón de vaciar carrito
    const clearBtn = document.getElementById('clearCartBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', vaciarPedido);
    }
    
    // Botón de enviar por WhatsApp
    const sendBtn = document.getElementById('sendWhatsAppBtn');
    if (sendBtn) {
        sendBtn.addEventListener('click', enviarPedidoWhatsApp);
    }
    
    // Validación en tiempo real del formulario
    const nombreInput = document.getElementById('customerName');
    const celularInput = document.getElementById('customerPhone');
    
    if (nombreInput) {
        nombreInput.addEventListener('input', function() {
            if (this.value.trim()) {
                this.classList.remove('is-invalid');
            }
        });
    }
    
    if (celularInput) {
        celularInput.addEventListener('input', function() {
            // Solo números
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length >= 9) {
                this.classList.remove('is-invalid');
            }
        });
    }
    
    // Escuchar cambios en localStorage (de otras pestañas)
    window.addEventListener('storage', function(e) {
        if (e.key === 'carrito') {
            renderizarPedido();
            actualizarContadorGlobal();
        }
    });
}

// ========================================
// INICIALIZACIÓN
// ========================================

// Inicializar la página de pedido
function inicializarPedido() {
    console.log('🛒 Inicializando página de pedido...');
    
    // Renderizar carrito
    renderizarPedido();
    
    // Configurar eventos
    configurarEventos();
    
    // Actualizar contador global
    actualizarContadorGlobal();
    
    // Verificar si hay productos en el carrito
    const carrito = obtenerCarrito();
    if (carrito && carrito.length > 0) {
        console.log(`📦 ${carrito.length} productos en el carrito`);
    } else {
        console.log('📦 Carrito vacío');
    }
    
    console.log('✅ Página de pedido inicializada');
}

// ========================================
// EXPORTAR FUNCIONES GLOBALES
// ========================================

window.renderizarPedido = renderizarPedido;
window.actualizarResumen = actualizarResumen;
window.aumentarItem = aumentarItem;
window.disminuirItem = disminuirItem;
window.eliminarItem = eliminarItem;
window.vaciarPedido = vaciarPedido;
window.obtenerCarrito = obtenerCarrito;
window.guardarCarrito = guardarCarrito;
window.validarFormulario = validarFormulario;
window.generarMensajePedido = generarMensajePedido;
window.enviarPedidoWhatsApp = enviarPedidoWhatsApp;
window.mostrarNotificacion = mostrarNotificacion;
window.actualizarContadorGlobal = actualizarContadorGlobal;
window.calcularTotal = calcularTotal;
window.calcularTotalItems = calcularTotalItems;
window.inicializarPedido = inicializarPedido;
window.formatearPrecio = formatearPrecio;

console.log('✅ Módulo pedido.js cargado');

// ========================================
// AUTO-INICIALIZACIÓN
// ========================================

// Inicializar automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Verificar que estamos en la página de pedido
    if (window.location.pathname.includes('pedido.html')) {
        inicializarPedido();
    }
});

// También inicializar si el DOM ya está cargado
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (window.location.pathname.includes('pedido.html')) {
        // Esperar un poco para que app.js se cargue primero
        setTimeout(inicializarPedido, 100);
    }
}
