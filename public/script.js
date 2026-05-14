// --- CONFIG ---
const API = "https://app-pedidos-qhpu.onrender.com"; 
let pedidosGlobal = [];
let historialVentas = []; // Para guardar las ventas finalizadas
let cantidadActual = 1;

// --- INICIO ---
document.addEventListener("DOMContentLoaded", () => {
    cargarPedidos();
    activarBuscador();

    // Intervalo de actualización (30 seg)
    setInterval(cargarPedidos, 30000);

    // Evento para botón agregar
    const btnAgregar = document.getElementById("btn-agregar");
    if (btnAgregar) {
        btnAgregar.addEventListener("click", agregar);
    }

    // Evento para botón finalizar venta
    const btnFinalizar = document.getElementById("btn-finalizar");
    if (btnFinalizar) {
        btnFinalizar.addEventListener("click", finalizarPedido);
    }
});

// --- FUNCIÓN PARA EL CATÁLOGO VISUAL ---
// Se activa al tocar una imagen en el catálogo
function seleccionarProducto(nombre, precio) {
    document.getElementById("producto").value = nombre;
    document.getElementById("precio").value = precio;
    
    // Efecto visual de selección rápida
    const panel = document.getElementById("panel-manual");
    panel.style.backgroundColor = "#e8f5e9";
    setTimeout(() => panel.style.backgroundColor = "white", 300);
}

// --- API: OBTENER PEDIDOS ---
async function cargarPedidos() {
    try {
        const res = await fetch(`${API}/pedidos`);
        if (!res.ok) throw new Error("Error en servidor");
        const data = await res.json();
        pedidosGlobal = data;
        renderPedidos(data);
        actualizarDashboard(data);
    } catch (err) {
        console.error("Error al conectar:", err);
    }
}

// --- AGREGAR PEDIDO ---
async function agregar() {
    const productoInput = document.getElementById("producto");
    const precioInput = document.getElementById("precio");
    
    const producto = productoInput.value.trim();
    const precio = Number(precioInput.value);

    if (!producto || precio <= 0) {
        alert("⚠️ Selecciona un producto o ingresa datos válidos");
        return;
    }

    try {
        const res = await fetch(`${API}/pedido`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                producto,
                cantidad: cantidadActual,
                precio
            })
        });

        const data = await res.json();
        if (data.ok) {
            cancelarEdicion();
            await cargarPedidos();
        } else {
            alert("❌ Error: " + (data.error || "No se pudo guardar"));
        }
    } catch (err) {
        alert("❌ Error de conexión");
    }
}

// --- FINALIZAR VENTA Y GUARDAR EN HISTORIAL ---
async function finalizarPedido() {
    if (pedidosGlobal.length === 0) return alert("Carrito vacío");
    
    const totalVenta = pedidosGlobal.reduce((acc, p) => acc + (p.cantidad * p.precio), 0);
    
    if (!confirm(`¿Finalizar venta por ${formatoCOP(totalVenta)}?`)) return;

    // Guardamos en el historial antes de borrar
    const nuevaVenta = {
        fecha: new Date().toLocaleTimeString(),
        items: [...pedidosGlobal],
        total: totalVenta
    };
    historialVentas.unshift(nuevaVenta); // Agregamos al inicio de la lista
    actualizarVistaHistorial();

    try {
        // Usamos el endpoint para limpiar todo si existe, o borramos uno por uno
        await fetch(`${API}/limpiar-pedidos`, { method: "DELETE" });
        await cargarPedidos();
        alert("✅ Venta registrada en el historial");
    } catch (err) {
        console.error("Error al finalizar:", err);
    }
}

// --- ACTUALIZAR VISTA DEL HISTORIAL ---
function actualizarVistaHistorial() {
    const contenedor = document.getElementById("historial-ventas");
    if (!contenedor) return;

    if (historialVentas.length === 0) {
        contenedor.innerHTML = '<p style="color: #888; text-align: center;">No hay ventas recientes</p>';
        return;
    }

    contenedor.innerHTML = historialVentas.slice(0, 5).map(venta => `
        <div style="background: #fff; border-bottom: 1px solid #eee; padding: 10px; font-size: 0.9em;">
            <div style="display:flex; justify-content:space-between; font-weight:bold;">
                <span>🕒 ${venta.fecha}</span>
                <span style="color: #2e7d32;">${formatoCOP(venta.total)}</span>
            </div>
            <div style="color: #666;">
                ${venta.items.map(i => `${i.cantidad}x ${i.producto}`).join(", ")}
            </div>
        </div>
    `).join("");
}

// --- RENDERIZADO DE INTERFAZ ---
function renderPedidos(data) {
    const lista = document.getElementById("lista");
    const totalTxt = document.getElementById("total");
    if (!lista || !totalTxt) return;

    lista.innerHTML = "";
    let suma = 0;

    data.forEach(p => {
        const sub = p.cantidad * p.precio;
        suma += sub;
        const li = document.createElement("li");
        li.className = "item-carrito";
        li.innerHTML = `
            <span><b>${p.cantidad}x</b> ${p.producto}</span>
            <span>
                <small style="margin-right:10px">${formatoCOP(sub)}</small>
                <button class="btn-delete" onclick="eliminar(${p.id})">✕</button>
            </span>
        `;
        lista.appendChild(li);
    });
    totalTxt.textContent = `Total: ${formatoCOP(suma)}`;
}

// --- ELIMINAR ITEM INDIVIDUAL ---
async function eliminar(id) {
    try {
        await fetch(`${API}/pedidos/${id}`, { method: "DELETE" });
        cargarPedidos();
    } catch (err) {
        console.error(err);
    }
}

// --- UTILIDADES ---
function formatoCOP(v) {
    return "$" + Number(v).toLocaleString("es-CO");
}

function cambiarCantidad(v) {
    cantidadActual = Math.max(1, cantidadActual + v);
    document.getElementById("cantidad").textContent = cantidadActual;
}

function fijarPrecio(valor) {
    document.getElementById("precio").value = valor;
}

function cancelarEdicion() {
    document.getElementById("producto").value = "";
    document.getElementById("precio").value = "";
    cantidadActual = 1;
    document.getElementById("cantidad").textContent = 1;
}

function activarBuscador() {
    const buscador = document.getElementById("buscador");
    if (!buscador) return;
    buscador.addEventListener("input", () => {
        const filtro = buscador.value.toLowerCase();
        const filtrados = pedidosGlobal.filter(p => p.producto.toLowerCase().includes(filtro));
        renderPedidos(filtrados);
    });
}

function actualizarDashboard(data) {
    const tv = document.getElementById("totalVentas");
    const mv = document.getElementById("masVendido");
    if (!tv || !mv) return;

    const total = data.reduce((acc, p) => acc + (p.cantidad * p.precio), 0);
    tv.textContent = formatoCOP(total);

    if (data.length === 0) {
        mv.textContent = "-";
        return;
    }

    const conteo = {};
    data.forEach(p => {
        conteo[p.producto] = (conteo[p.producto] || 0) + p.cantidad;
    });
    const top = Object.keys(conteo).reduce((a, b) => conteo[a] > conteo[b] ? a : b);
    mv.textContent = top;
}