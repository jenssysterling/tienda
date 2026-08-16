// ========================================
// PRODUCTOS.JS - Lógica del catálogo
// Maneja: renderizado, filtros, búsqueda y controles
// ========================================

// ========================================
// VARIABLES GLOBALES
// ========================================

let productosActuales = [];
let categoriaActual = 'todos';
let terminoBusqueda = '';

// ========================================
// FUNCIONES DE RENDERIZADO
// ========================================

// Renderizar productos en el grid
function renderizarProductos(productos) {
    const grid = document.getElementById('productsGrid');
    const loading = document.getElementById('loadingProducts');
    const noProducts = document.getElementById('noProductsMessage');
    const count = document.getElementById('productCount');
    
    // Ocultar loading
    if (loading) loading.style.display = 'none';
    
    // Actualizar contador
    if (count) count.textContent = productos.length;
    
    // Si no hay productos, mostrar mensaje
    if (productos.length === 0) {
        if (noProducts) noProducts.style.display = 'block';
        if (grid) {
            grid.innerHTML = '';
        }
        return;
    }
    
    // Ocultar mensaje de no productos
    if (noProducts) noProducts.style.display = 'none';
    
    // Obtener carrito actual
    const carrito = window.carrito || [];
    
    // Generar HTML de productos
    let html = '';
    productos.forEach(producto => {
        // Verificar si el producto está en el carrito
        const enCarrito = carrito.find(item => item.id === producto.id);
        const cantidad = enCarrito ? enCarrito.cantidad : 0;
        
        html += `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="product-card" data-producto-id="${producto.id}">
                    <!-- Imagen del producto -->
                    <div class="product-image-placeholder">
                        ${obtenerIconoProducto(producto.categoria)}
                    </div>
                    <div class="product-body">
                        <h3 class="product-name">${producto.nombre}</h3>
                        <p class="product-presentation">${producto.presentacion}</p>
                        <p class="product-price">${producto.precio.toFixed(2)}</p>
                        <div class="product-controls">
                            <button class="btn-qty" onclick="disminuirCantidad(${producto.id})" 
                                    ${cantidad === 0 ? 'disabled' : ''}
                                    aria-label="Disminuir cantidad de ${producto.nombre}">
                                −
                            </button>
                            <span class="qty-display" id="qty-${producto.id}">${cantidad}</span>
                            <button class="btn-qty" onclick="aumentarCantidad(${producto.id})"
                                    aria-label="Aumentar cantidad de ${producto.nombre}">
                                +
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
}

// Obtener icono según categoría
function obtenerIconoProducto(categoria) {
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

// Obtener color según categoría
function obtenerColorCategoria(categoria) {
    const colores = {
        'abarrotes': '#8B7355',
        'bebidas': '#2196F3',
        'lacteos': '#4CAF50',
        'snacks': '#FF9800',
        'limpieza': '#9C27B0',
        'higiene': '#E91E63',
        'otros': '#607D8B'
    };
    return colores[categoria] || '#607D8B';
}

// ========================================
// FUNCIONES DE FILTRADO
// ========================================

// Filtrar productos por categoría y búsqueda
function filtrarProductos() {
    const searchInput = document.getElementById('searchInput');
    const termino = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    terminoBusqueda = termino;
    
    // Obtener productos del localStorage o usar los cargados
    let productos = [];
    try {
        const guardado = localStorage.getItem('productos');
        if (guardado) {
            productos = JSON.parse(guardado);
        } else {
            productos = productosActuales;
        }
    } catch (e) {
        productos = productosActuales;
    }
    
    // Si no hay productos cargados, usar los de respaldo
    if (!productos || productos.length === 0) {
        productos = obtenerProductosRespaldoLocal();
    }
    
    let filtrados = productos;
    
    // Filtrar por categoría
    if (categoriaActual !== 'todos') {
        filtrados = filtrados.filter(p => p.categoria === categoriaActual);
    }
    
    // Filtrar por búsqueda
    if (termino !== '') {
        filtrados = filtrados.filter(p => 
            p.nombre.toLowerCase().includes(termino) ||
            p.presentacion.toLowerCase().includes(termino)
        );
    }
    
    // Actualizar productos actuales
    productosActuales = filtrados;
    
    // Renderizar productos filtrados
    renderizarProductos(filtrados);
    
    // Actualizar contador de resultados
    actualizarContadorResultados(filtrados.length);
}

// Actualizar contador de resultados
function actualizarContadorResultados(cantidad) {
    const count = document.getElementById('productCount');
    if (count) {
        count.textContent = cantidad;
    }
}

// Cambiar categoría
function cambiarCategoria(categoria) {
    categoriaActual = categoria;
    
    // Actualizar botones activos
    document.querySelectorAll('.btn-category').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === categoria) {
            btn.classList.add('active');
        }
    });
    
    // Filtrar productos
    filtrarProductos();
}

// Resetear filtros (volver a mostrar todos)
function resetFilters() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    categoriaActual = 'todos';
    
    // Actualizar botones activos
    document.querySelectorAll('.btn-category').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === 'todos') {
            btn.classList.add('active');
        }
    });
    
    filtrarProductos();
}

// ========================================
// FUNCIONES DE CONTROLES DE CANTIDAD
// ========================================

// Aumentar cantidad de un producto
function aumentarCantidad(productoId) {
    // Obtener productos del localStorage
    let productos = [];
    try {
        const guardado = localStorage.getItem('productos');
        if (guardado) {
            productos = JSON.parse(guardado);
        } else {
            productos = productosActuales;
        }
    } catch (e) {
        productos = productosActuales;
    }
    
    const producto = productos.find(p => p.id === productoId);
    if (!producto) {
        console.error('Producto no encontrado:', productoId);
        return;
    }
    
    // Agregar al carrito usando la función global
    if (typeof window.agregarAlCarrito === 'function') {
        const success = window.agregarAlCarrito(productoId, 1);
        if (success) {
            actualizarControlesProductos();
        }
    } else {
        // Fallback si la función global no está disponible
        console.warn('agregarAlCarrito no está disponible');
        // Implementación local
        agregarAlCarritoLocal(productoId);
    }
}

// Disminuir cantidad de un producto
function disminuirCantidad(productoId) {
    // Obtener el carrito actual
    let carrito = [];
    try {
        const guardado = localStorage.getItem('carrito');
        if (guardado) {
            carrito = JSON.parse(guardado);
        }
    } catch (e) {
        carrito = [];
    }
    
    const item = carrito.find(p => p.id === productoId);
    if (!item) return;
    
    // Usar la función global para actualizar
    if (typeof window.actualizarCantidadCarrito === 'function') {
        const nuevaCantidad = item.cantidad - 1;
        window.actualizarCantidadCarrito(productoId, nuevaCantidad);
    } else {
        // Fallback local
        if (item.cantidad > 1) {
            item.cantidad -= 1;
            localStorage.setItem('carrito', JSON.stringify(carrito));
            if (typeof window.actualizarContadorGlobal === 'function') {
                window.actualizarContadorGlobal();
            }
            actualizarControlesProductos();
        } else {
            // Eliminar si cantidad es 1
            if (typeof window.eliminarDelCarrito === 'function') {
                window.eliminarDelCarrito(productoId);
            } else {
                carrito = carrito.filter(p => p.id !== productoId);
                localStorage.setItem('carrito', JSON.stringify(carrito));
                if (typeof window.actualizarContadorGlobal === 'function') {
                    window.actualizarContadorGlobal();
                }
                actualizarControlesProductos();
            }
        }
    }
}

// Actualizar los controles de cantidad en todos los productos
function actualizarControlesProductos() {
    // Obtener carrito actual
    let carrito = [];
    try {
        const guardado = localStorage.getItem('carrito');
        if (guardado) {
            carrito = JSON.parse(guardado);
        }
    } catch (e) {
        carrito = [];
    }
    
    // Actualizar cada display de cantidad
    carrito.forEach(item => {
        const display = document.getElementById(`qty-${item.id}`);
        if (display) {
            display.textContent = item.cantidad;
        }
        
        // Habilitar/deshabilitar botón de disminuir
        const btnDisminuir = document.querySelector(`[onclick="disminuirCantidad(${item.id})"]`);
        if (btnDisminuir) {
            btnDisminuir.disabled = (item.cantidad === 0);
        }
    });
    
    // Para productos que no están en el carrito, resetear a 0
    document.querySelectorAll('.qty-display').forEach(display => {
        const id = parseInt(display.id.replace('qty-', ''));
        const enCarrito = carrito.find(item => item.id === id);
        if (!enCarrito) {
            display.textContent = '0';
            const btnDisminuir = document.querySelector(`[onclick="disminuirCantidad(${id})"]`);
            if (btnDisminuir) {
                btnDisminuir.disabled = true;
            }
        }
    });
    
    // Actualizar contador global
    if (typeof window.actualizarContadorGlobal === 'function') {
        window.actualizarContadorGlobal();
    }
}

// ========================================
// FUNCIONES DE CARGA DE PRODUCTOS
// ========================================

// Cargar productos desde JSON o localStorage
async function cargarProductos() {
    try {
        // Primero intentar cargar desde localStorage
        const guardado = localStorage.getItem('productos');
        if (guardado) {
            const productos = JSON.parse(guardado);
            if (Array.isArray(productos) && productos.length > 0) {
                console.log('✅ Productos cargados desde localStorage');
                productosActuales = productos;
                renderizarProductos(productos);
                return;
            }
        }
        
        // Si no hay en localStorage, cargar desde JSON
        const response = await fetch('data/productos.json');
        if (response.ok) {
            const productos = await response.json();
            if (Array.isArray(productos) && productos.length > 0) {
                console.log('✅ Productos cargados desde JSON');
                productosActuales = productos;
                localStorage.setItem('productos', JSON.stringify(productos));
                renderizarProductos(productos);
                return;
            } else {
                throw new Error('El JSON no contiene productos válidos');
            }
        } else {
            throw new Error('No se pudo cargar el JSON');
        }
    } catch (error) {
        console.warn('⚠️ Error al cargar productos:', error.message);
        console.log('📦 Usando productos de respaldo');
        
        // Usar productos de respaldo
        const productosRespaldo = obtenerProductosRespaldoLocal();
        productosActuales = productosRespaldo;
        localStorage.setItem('productos', JSON.stringify(productosRespaldo));
        renderizarProductos(productosRespaldo);
    }
}

// Productos de respaldo (15 productos ficticios)
function obtenerProductosRespaldoLocal() {
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
// FUNCIONES DE INICIALIZACIÓN Y EVENTOS
// ========================================

// Inicializar la página de productos
function inicializarProductos() {
    console.log('🛒 Inicializando catálogo de productos...');
    
    // Cargar productos
    cargarProductos();
    
    // Configurar eventos de categorías
    document.querySelectorAll('.btn-category').forEach(btn => {
        btn.addEventListener('click', function() {
            const categoria = this.dataset.category;
            cambiarCategoria(categoria);
        });
    });
    
    // Configurar evento de búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filtrarProductos();
        });
        
        // Búsqueda al presionar Enter
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                filtrarProductos();
            }
        });
    }
    
    // Configurar botón de reset
    const resetBtn = document.querySelector('.btn-outline-primary[onclick="resetFilters()"]');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
    
    // Actualizar controles cada vez que cambie el carrito
    window.addEventListener('storage', function(e) {
        if (e.key === 'carrito') {
            actualizarControlesProductos();
        }
    });
    
    console.log('✅ Catálogo inicializado');
}

// ========================================
// FUNCIONES DE UTILIDAD
// ========================================

// Función para recargar productos (útil después de editar)
function recargarProductos() {
    localStorage.removeItem('productos');
    cargarProductos();
}

// Exportar funciones para uso global
window.renderizarProductos = renderizarProductos;
window.filtrarProductos = filtrarProductos;
window.cambiarCategoria = cambiarCategoria;
window.resetFilters = resetFilters;
window.aumentarCantidad = aumentarCantidad;
window.disminuirCantidad = disminuirCantidad;
window.actualizarControlesProductos = actualizarControlesProductos;
window.cargarProductos = cargarProductos;
window.recargarProductos = recargarProductos;
window.inicializarProductos = inicializarProductos;
window.obtenerIconoProducto = obtenerIconoProducto;
window.obtenerColorCategoria = obtenerColorCategoria;

console.log('✅ Módulo productos.js cargado');

// ========================================
// AUTO-INICIALIZACIÓN
// ========================================

// Inicializar automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Verificar que estamos en la página de productos
    if (window.location.pathname.includes('productos.html')) {
        inicializarProductos();
    }
});

// También inicializar si el DOM ya está cargado
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (window.location.pathname.includes('productos.html')) {
        // Esperar un poco para que app.js se cargue primero
        setTimeout(inicializarProductos, 100);
    }
}