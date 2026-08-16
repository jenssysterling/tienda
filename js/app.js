// ========================================
// APP PRINCIPAL - NARDIA
// Controlador central de la aplicación
// ========================================

// ========================================
// CONFIGURACIÓN
// ========================================

// Número de WhatsApp de la tienda (fácilmente modificable)
const WHATSAPP_NUMBER = "51999999999"; // Cambia por el número real

// Claves para localStorage
const STORAGE_KEYS = {
    CARRITO: 'carrito',
    PRODUCTOS: 'productos'
};

// ========================================
// ESTADO GLOBAL
// ========================================

let carrito = [];
let productos = [];

// ========================================
// FUNCIONES DEL CARRITO
// ========================================

// Cargar carrito desde localStorage
function cargarCarrito() {
    try {
        const guardado = localStorage.getItem(STORAGE_KEYS.CARRITO);
        if (guardado) {
            carrito = JSON.parse(guardado);
            if (!Array.isArray(carrito)) {
                carrito = [];
            }
        } else {
            carrito = [];
        }
    } catch (e) {
        console.warn('Error al cargar el carrito:', e);
        carrito = [];
    }
    return carrito;
}

// Guardar carrito en localStorage
function guardarCarrito() {
    try {
        localStorage.setItem(STORAGE_KEYS.CARRITO, JSON.stringify(carrito));
        actualizarContadorGlobal();
    } catch (e) {
        console.warn('Error al guardar el carrito:', e);
    }
}

// Vaciar carrito completamente
function vaciarCarrito() {
    if (carrito.length === 0) return;
    
    if (confirm('¿Estás seguro de que quieres vaciar todo tu pedido?')) {
        carrito = [];
        guardarCarrito();
        actualizarContadorGlobal();
        
        // Si estamos en la página de pedido, recargar la vista
        if (window.location.pathname.includes('pedido.html')) {
            if (typeof renderPedido === 'function') {
                renderPedido();
            }
        }
        
        // Si estamos en la página de productos, actualizar los controles
        if (window.location.pathname.includes('productos.html')) {
            if (typeof actualizarControlesProductos === 'function') {
                actualizarControlesProductos();
            }
            if (typeof filtrarProductos === 'function') {
                filtrarProductos();
            }
        }
    }
}

// Agregar producto al carrito
function agregarAlCarrito(productoId, cantidad = 1) {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) {
        console.error('Producto no encontrado:', productoId);
        return false;
    }
    
    const itemExistente = carrito.find(item => item.id === productoId);
    
    if (itemExistente) {
        itemExistente.cantidad += cantidad;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            presentacion: producto.presentacion,
            precio: producto.precio,
            cantidad: cantidad,
            imagen: producto.imagen || '',
            categoria: producto.categoria
        });
    }
    
    guardarCarrito();
    actualizarContadorGlobal();
    
    // Notificar al usuario (si está en productos.html)
    mostrarNotificacion(`${producto.nombre} agregado al carrito ✅`);
    
    return true;
}

// Eliminar producto del carrito
function eliminarDelCarrito(productoId) {
    const producto = carrito.find(item => item.id === productoId);
    if (!producto) return;
    
    if (confirm(`¿Eliminar "${producto.nombre}" del pedido?`)) {
        carrito = carrito.filter(item => item.id !== productoId);
        guardarCarrito();
        actualizarContadorGlobal();
        
        // Si estamos en productos.html, actualizar controles
        if (window.location.pathname.includes('productos.html')) {
            if (typeof actualizarControlesProductos === 'function') {
                actualizarControlesProductos();
            }
            if (typeof filtrarProductos === 'function') {
                filtrarProductos();
            }
        }
        
        // Si estamos en pedido.html, recargar vista
        if (window.location.pathname.includes('pedido.html')) {
            if (typeof renderPedido === 'function') {
                renderPedido();
            }
        }
    }
}

// Actualizar cantidad de un producto en el carrito
function actualizarCantidadCarrito(productoId, nuevaCantidad) {
    if (nuevaCantidad < 0) return;
    
    const item = carrito.find(p => p.id === productoId);
    if (!item) return;
    
    if (nuevaCantidad === 0) {
        eliminarDelCarrito(productoId);
        return;
    }
    
    item.cantidad = nuevaCantidad;
    guardarCarrito();
    actualizarContadorGlobal();
    
    // Actualizar vistas
    if (window.location.pathname.includes('productos.html')) {
        if (typeof actualizarControlesProductos === 'function') {
            actualizarControlesProductos();
        }
        if (typeof filtrarProductos === 'function') {
            filtrarProductos();
        }
    }
    
    if (window.location.pathname.includes('pedido.html')) {
        if (typeof renderPedido === 'function') {
            renderPedido();
        }
    }
}

// Obtener cantidad de un producto en el carrito
function obtenerCantidadCarrito(productoId) {
    const item = carrito.find(p => p.id === productoId);
    return item ? item.cantidad : 0;
}

// Calcular total del carrito
function calcularTotalCarrito() {
    return carrito.reduce((total, item) => {
        return total + (item.precio * item.cantidad);
    }, 0);
}

// Calcular cantidad total de items
function calcularTotalItems() {
    return carrito.reduce((total, item) => total + item.cantidad, 0);
}

// ========================================
// FUNCIONES DE NOTIFICACIÓN
// ========================================

// Mostrar notificación temporal
function mostrarNotificacion(mensaje, tipo = 'success', duracion = 3000) {
    // Crear contenedor si no existe
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
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
    }
    
    // Crear notificación
    const notification = document.createElement('div');
    const colores = {
        success: '#2d7d46',
        error: '#dc3545',
        warning: '#e8a838',
        info: '#17a2b8'
    };
    const color = colores[tipo] || colores.success;
    
    notification.style.cssText = `
        background: white;
        color: #1a1a1a;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        margin-bottom: 10px;
        border-left: 4px solid ${color};
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 16px;
        font-weight: 500;
        animation: slideUp 0.3s ease;
        pointer-events: auto;
        width: 100%;
    `;
    
    // Icono según tipo
    const iconos = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    const icono = iconos[tipo] || 'ℹ️';
    
    notification.innerHTML = `
        <span style="font-size: 20px;">${icono}</span>
        <span style="flex: 1;">${mensaje}</span>
        <button onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #999;
            padding: 0 4px;
        ">✕</button>
    `;
    
    container.appendChild(notification);
    
    // Auto-eliminar después de duración
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-10px)';
            notification.style.transition = 'all 0.3s ease';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, duracion);
}

// ========================================
// FUNCIONES DE WHATSAPP
// ========================================

// Generar mensaje de WhatsApp con el pedido
function generarMensajeWhatsApp(nombre, celular) {
    if (carrito.length === 0) {
        mostrarNotificacion('Tu pedido está vacío. Agrega productos primero.', 'warning');
        return null;
    }
    
    // Validar datos del cliente
    if (!nombre || !celular) {
        mostrarNotificacion('Por favor, completa todos tus datos (nombre y celular).', 'error');
        return null;
    }
    
    // Validar que el celular tenga al menos 9 dígitos
    const celularLimpio = celular.replace(/\s/g, '');
    if (celularLimpio.length < 9) {
        mostrarNotificacion('El número de celular debe tener al menos 9 dígitos.', 'error');
        return null;
    }
    
    // Construir mensaje
    let mensaje = 'Hola, quiero realizar el siguiente pedido:\n\n';
    mensaje += '🛒 MI PEDIDO\n';
    mensaje += '─'.repeat(20) + '\n\n';
    
    // Lista de productos
    carrito.forEach((item, index) => {
        const subtotal = (item.precio * item.cantidad).toFixed(2);
        mensaje += `${index + 1}. ${item.nombre} ${item.presentacion}\n`;
        mensaje += `   ${item.cantidad} × S/ ${item.precio.toFixed(2)} = S/ ${subtotal}\n\n`;
    });
    
    mensaje += '─'.repeat(20) + '\n';
    const total = calcularTotalCarrito();
    mensaje += `💰 TOTAL: S/ ${total.toFixed(2)}\n\n`;
    
    mensaje += '🏪 Recogeré mi pedido en tienda.\n';
    mensaje += '⏱️ Tiempo de recojo: 30 - 60 minutos\n\n';
    
    mensaje += '👤 DATOS DEL CLIENTE\n';
    mensaje += `Nombre: ${nombre}\n`;
    mensaje += `Celular: ${celular}\n\n`;
    
    mensaje += '🙏 ¡Gracias!';
    
    return mensaje;
}

// Abrir WhatsApp con el mensaje preparado
function enviarPedidoWhatsApp() {
    // Obtener datos del formulario si estamos en pedido.html
    const nombreInput = document.getElementById('customerName');
    const celularInput = document.getElementById('customerPhone');
    
    let nombre = '';
    let celular = '';
    
    if (nombreInput && celularInput) {
        nombre = nombreInput.value.trim();
        celular = celularInput.value.trim();
        
        // Validar campos
        if (!nombre) {
            nombreInput.classList.add('is-invalid');
            nombreInput.focus();
            mostrarNotificacion('Por favor, ingresa tu nombre.', 'error');
            return;
        } else {
            nombreInput.classList.remove('is-invalid');
        }
        
        if (!celular) {
            celularInput.classList.add('is-invalid');
            celularInput.focus();
            mostrarNotificacion('Por favor, ingresa tu número de celular.', 'error');
            return;
        } else {
            celularInput.classList.remove('is-invalid');
        }
        
        // Validar celular
        const celularLimpio = celular.replace(/\s/g, '');
        if (celularLimpio.length < 9) {
            celularInput.classList.add('is-invalid');
            celularInput.focus();
            mostrarNotificacion('El número de celular debe tener al menos 9 dígitos.', 'error');
            return;
        }
    }
    
    // Generar mensaje
    const mensaje = generarMensajeWhatsApp(nombre, celular);
    if (!mensaje) return;
    
    // Abrir WhatsApp
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
    
    // Mostrar confirmación
    mostrarNotificacion('✅ WhatsApp abierto con tu pedido listo para enviar.', 'success', 5000);
}

// ========================================
// FUNCIONES DE CONTADOR
// ========================================

// Actualizar el contador del carrito en todas las páginas
function actualizarContadorGlobal() {
    const total = calcularTotalItems();
    
    const contadores = document.querySelectorAll('#cartCounter');
    contadores.forEach(contador => {
        contador.textContent = total;
        if (total === 0) {
            contador.style.display = 'none';
        } else {
            contador.style.display = 'flex';
        }
    });
}

// ========================================
// FUNCIONES DE CONFIGURACIÓN
// ========================================

// Configurar enlaces de WhatsApp
function configurarWhatsApp() {
    const links = document.querySelectorAll('#whatsappNavLink, #whatsappHeroBtn, #whatsappFooterLink');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const mensaje = 'Hola, me gustaría hacer un pedido en Nardia. ¿Podrían ayudarme?';
            const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
            window.open(url, '_blank');
        });
    });
}

// ========================================
// FUNCIONES DE PRODUCTOS (globales)
// ========================================

// Cargar productos desde localStorage o JSON
async function cargarProductosGlobal() {
    try {
        // Intentar cargar desde localStorage primero
        const guardado = localStorage.getItem(STORAGE_KEYS.PRODUCTOS);
        if (guardado) {
            productos = JSON.parse(guardado);
            if (Array.isArray(productos) && productos.length > 0) {
                console.log('✅ Productos cargados desde localStorage');
                return productos;
            }
        }
        
        // Si no hay en localStorage, cargar desde JSON
        const response = await fetch('data/productos.json');
        if (response.ok) {
            productos = await response.json();
            localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(productos));
            console.log('✅ Productos cargados desde JSON');
            return productos;
        } else {
            throw new Error('No se pudo cargar el JSON');
        }
    } catch (error) {
        console.warn('⚠️ Error al cargar productos:', error.message);
        // Usar productos de respaldo
        productos = obtenerProductosRespaldo();
        localStorage.setItem(STORAGE_KEYS.PRODUCTOS, JSON.stringify(productos));
        return productos;
    }
}

// Productos de respaldo en caso de que no haya conexión
function obtenerProductosRespaldo() {
    return [
        {
            id: 1,
            nombre: "Arroz Costeño",
            categoria: "abarrotes",
            presentacion: "1 kg",
            precio: 4.50,
            imagen: "",
            disponible: true
        },
        {
            id: 2,
            nombre: "Fideos Don Vittorio",
            categoria: "abarrotes",
            presentacion: "500 g",
            precio: 3.80,
            imagen: "",
            disponible: true
        },
        {
            id: 3,
            nombre: "Aceite Vegetal",
            categoria: "abarrotes",
            presentacion: "1 L",
            precio: 8.90,
            imagen: "",
            disponible: true
        },
        {
            id: 4,
            nombre: "Azúcar Blanca",
            categoria: "abarrotes",
            presentacion: "1 kg",
            precio: 3.20,
            imagen: "",
            disponible: true
        },
        {
            id: 5,
            nombre: "Sal de Mar",
            categoria: "abarrotes",
            presentacion: "500 g",
            precio: 1.50,
            imagen: "",
            disponible: true
        },
        {
            id: 6,
            nombre: "Gaseosa Inca Kola",
            categoria: "bebidas",
            presentacion: "3 L",
            precio: 8.50,
            imagen: "",
            disponible: true
        },
        {
            id: 7,
            nombre: "Jugo de Naranja",
            categoria: "bebidas",
            presentacion: "1 L",
            precio: 5.20,
            imagen: "",
            disponible: true
        },
        {
            id: 8,
            nombre: "Agua Mineral",
            categoria: "bebidas",
            presentacion: "1.5 L",
            precio: 3.00,
            imagen: "",
            disponible: true
        },
        {
            id: 9,
            nombre: "Leche Gloria",
            categoria: "lacteos",
            presentacion: "1 L",
            precio: 4.20,
            imagen: "",
            disponible: true
        },
        {
            id: 10,
            nombre: "Yogurt Natural",
            categoria: "lacteos",
            presentacion: "1 L",
            precio: 5.80,
            imagen: "",
            disponible: true
        },
        {
            id: 11,
            nombre: "Galletas Oreo",
            categoria: "snacks",
            presentacion: "180 g",
            precio: 4.90,
            imagen: "",
            disponible: true
        },
        {
            id: 12,
            nombre: "Papas Fritas",
            categoria: "snacks",
            presentacion: "120 g",
            precio: 3.50,
            imagen: "",
            disponible: true
        },
        {
            id: 13,
            nombre: "Detergente Sapolio",
            categoria: "limpieza",
            presentacion: "500 g",
            precio: 5.60,
            imagen: "",
            disponible: true
        },
        {
            id: 14,
            nombre: "Jabón de Tocador",
            categoria: "higiene",
            presentacion: "90 g",
            precio: 3.20,
            imagen: "",
            disponible: true
        },
        {
            id: 15,
            nombre: "Shampoo Sedal",
            categoria: "higiene",
            presentacion: "400 ml",
            precio: 7.50,
            imagen: "",
            disponible: true
        }
    ];
}

// ========================================
// INICIALIZACIÓN
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🏪 Nardia - Tienda de barrio');
    console.log('📱 Versión MVP - Iniciando...');
    
    // Cargar carrito
    cargarCarrito();
    
    // Actualizar contador
    actualizarContadorGlobal();
    
    // Configurar WhatsApp
    configurarWhatsApp();
    
    // Cargar productos (si es necesario)
    if (window.location.pathname.includes('productos.html') || 
        window.location.pathname.includes('pedido.html')) {
        cargarProductosGlobal().then(() => {
            console.log(`📦 ${productos.length} productos cargados`);
        });
    }
    
    // Configurar evento para vaciar carrito (si existe el botón)
    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', vaciarCarrito);
    }
    
    // Configurar evento para enviar pedido (si existe el botón)
    const sendWhatsAppBtn = document.getElementById('sendWhatsAppBtn');
    if (sendWhatsAppBtn) {
        sendWhatsAppBtn.addEventListener('click', enviarPedidoWhatsApp);
    }
    
    console.log('✅ Aplicación lista');
});

// ========================================
// EXPORTAR FUNCIONES GLOBALES
// ========================================

// Hacer funciones disponibles globalmente
window.carrito = carrito;
window.productos = productos;
window.WHATSAPP_NUMBER = WHATSAPP_NUMBER;

window.cargarCarrito = cargarCarrito;
window.guardarCarrito = guardarCarrito;
window.vaciarCarrito = vaciarCarrito;
window.agregarAlCarrito = agregarAlCarrito;
window.eliminarDelCarrito = eliminarDelCarrito;
window.actualizarCantidadCarrito = actualizarCantidadCarrito;
window.obtenerCantidadCarrito = obtenerCantidadCarrito;
window.calcularTotalCarrito = calcularTotalCarrito;
window.calcularTotalItems = calcularTotalItems;

window.mostrarNotificacion = mostrarNotificacion;
window.generarMensajeWhatsApp = generarMensajeWhatsApp;
window.enviarPedidoWhatsApp = enviarPedidoWhatsApp;
window.actualizarContadorGlobal = actualizarContadorGlobal;
window.cargarProductosGlobal = cargarProductosGlobal;
window.obtenerProductosRespaldo = obtenerProductosRespaldo;

console.log('✅ Funciones globales disponibles');