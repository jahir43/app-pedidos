// --- CONFIG ---
const API = "https://app-pedidos-qhpu.onrender.com"; 
let pedidosGlobal = [];
let cantidadActual = 1;

// --- INICIO ---
document.addEventListener("DOMContentLoaded", () => {
    // Cargamos pedidos iniciales
    cargarPedidos();
    
    // El buscador sigue funcionando para la lista de abajo
    activarBuscador();

    // Evento único para agregar (Manual)
    const btnAgregarManual = document.getElementById("btn-agregar");
    if (btnAgregarManual) {
        // Usamos solo 'click', es lo más estable en móviles modernos
        btnAgregarManual.addEventListener("click", agregarManual);
    }

    // Botón para finalizar venta
    const btnFinalizar = document.getElementById("btn-finalizar");
    if (btnFinalizar) {
        btnFinalizar.addEventListener("click", finalizarPedido);
    }
});

// --- OBTENER DATOS ---
async function cargarPedidos() {
    try {
        const res = await fetch(`${API}/pedidos`);
        const data = await res.json();
        pedidosGlobal = data;
        renderPedidos(data);
        actualizarDashboard(data);
    } catch (err) {
        console.error("Error de carga:", err);
    }
}

// --- FUNCIÓN ÚNICA DE AGREGADO ---
async function agregarManual() {
    const producto = document.getElementById("producto").value.trim();
    const precio = Number(document.getElementById("precio").value);

    if (!producto || precio <= 0) {
        alert("⚠️ Por favor, ingresa producto y precio");
        return;
    }

    try {
        const res = await fetch(`${API}/pedido`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                producto: producto,
                cantidad: cantidadActual,
                precio: precio
            })
        });

        const data = await res.json();

        if (data.ok) {
            // Limpiar campos y refrescar
            document.getElementById("producto").value = "";
            document.getElementById("precio").value = "";
            cantidadActual = 1;
            document.getElementById("cantidad").textContent = "1";
            
            await cargarPedidos();
            alert("✅ Guardado correctamente");
        } else {
            alert("❌ Error del servidor: " + data.error);
        }
    } catch (err) {
        alert("❌ Error de conexión. Revisa tu internet.");
    }
}

// --- RENDER Y UTILIDADES (Mantener igual) ---
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
                <small style="margin-right:10px">$${Number(sub).toLocaleString("es-CO")}</small>
                <button class="btn-delete" onclick="eliminar(${p.id})">✕</button>
            </span>
        `;
        lista.appendChild(li);
    });
    totalTxt.textContent = `Total: $${Number(suma).toLocaleString("es-CO")}`;
}

async function eliminar(id) {
    try {
        await fetch(`${API}/pedidos/${id}`, { method: "DELETE" });
        cargarPedidos();
    } catch (err) { console.error(err); }
}

async function finalizarPedido() {
    if (pedidosGlobal.length === 0) return;
    if (!confirm("¿Cerrar cuenta?")) return;
    try {
        for (const p of pedidosGlobal) {
            await fetch(`${API}/pedidos/${p.id}`, { method: "DELETE" });
        }
        cargarPedidos();
        alert("✅ Venta finalizada");
    } catch (err) { console.error(err); }
}

function cambiarCantidad(v) {
    cantidadActual = Math.max(1, cantidadActual + v);
    document.getElementById("cantidad").textContent = cantidadActual;
}

function activarBuscador() {
    const b = document.getElementById("buscador");
    if (b) {
        b.addEventListener("input", () => {
            const f = b.value.toLowerCase();
            renderPedidos(pedidosGlobal.filter(p => p.producto.toLowerCase().includes(f)));
        });
    }
}

function actualizarDashboard(data) {
    const tv = document.getElementById("totalVentas");
    const mv = document.getElementById("masVendido");
    if (!tv || !mv) return;
    const total = data.reduce((acc, p) => acc + (p.cantidad * p.precio), 0);
    tv.textContent = "$" + Number(total).toLocaleString("es-CO");
}