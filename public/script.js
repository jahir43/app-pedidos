// --- CONFIG ---
const API = "https://app-pedidos-qhpu.onrender.com"; 
let pedidosGlobal = [];
let cantidadActual = 1;
let indiceSlider = 0;

// --- INICIO ---
document.addEventListener("DOMContentLoaded", () => {
    cargarPedidos();
    activarBuscador();

    // Intervalo de actualización
    setInterval(cargarPedidos, 30000);

    // Evento para botón agregar manual
    const btnAgregar = document.getElementById("btn-agregar");
    if (btnAgregar) {
        btnAgregar.addEventListener("click", agregar);
    }

    // Evento para botón finalizar venta
    const btnFinalizar = document.getElementById("btn-finalizar");
    if (btnFinalizar) {
        btnFinalizar.addEventListener("click", finalizarPedido);
    }

    // Delegación de eventos para botones del Slider (Optimizado para iOS/Android)
    document.addEventListener("click", function(e) {
        if (e.target && e.target.classList.contains("btn-add-slider")) {
            const btn = e.target;
            const producto = btn.dataset.producto;
            const precio = Number(btn.dataset.precio);
            agregarDesdeSlider(btn, producto, precio);
        }
    });
});

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

// --- AGREGAR MANUAL ---
async function agregar() {
    const productoInput = document.getElementById("producto");
    const precioInput = document.getElementById("precio");
    
    const producto = productoInput.value.trim();
    const precio = Number(precioInput.value);

    if (!producto || precio <= 0) {
        alert("⚠️ Datos inválidos");
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
            alert("✅ Pedido agregado");
        } else {
            alert("❌ Error: " + (data.error || "No se pudo guardar"));
        }
    } catch (err) {
        alert("❌ Error de conexión");
    }
}

// --- AGREGAR DESDE SLIDER ---
async function agregarDesdeSlider(btn, producto, precio) {
    const slide = btn.closest(".slide");
    const cantidadSpan = slide.querySelector(".cantidad");
    const cantidad = parseInt(cantidadSpan.textContent);

    try {
        const res = await fetch(`${API}/pedido`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ producto, cantidad, precio })
        });

        const data = await res.json();
        if (data.ok) {
            cantidadSpan.textContent = 1;
            await cargarPedidos();
            alert("✅ " + producto + " agregado");
        }
    } catch (err) {
        console.error(err);
    }
}

// --- ELIMINAR PEDIDO ---
async function eliminar(id) {
    if (!confirm("¿Eliminar este producto?")) return;
    try {
        await fetch(`${API}/pedidos/${id}`, { 
            method: "DELETE",
            headers: { "Accept": "application/json" }
        });
        cargarPedidos();
    } catch (err) {
        console.error(err);
    }
}

// --- FINALIZAR VENTA (BORRAR TODO) ---
async function finalizarPedido() {
    if (pedidosGlobal.length === 0) return alert("Carrito vacío");
    if (!confirm("¿Finalizar y vaciar pedido?")) return;

    try {
        // Borramos todos los items uno por uno o mediante un endpoint global si lo tienes
        for (const p of pedidosGlobal) {
            await fetch(`${API}/pedidos/${p.id}`, { method: "DELETE" });
        }
        cargarPedidos();
        alert("✅ Venta finalizada");
    } catch (err) {
        console.error(err);
    }
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

// --- UTILIDADES ---
function formatoCOP(v) {
    return "$" + Number(v).toLocaleString("es-CO");
}

function cambiarCantidad(v) {
    cantidadActual = Math.max(1, cantidadActual + v);
    document.getElementById("cantidad").textContent = cantidadActual;
}

function cambiarCantidadSlider(btn, cambio) {
    const span = btn.parentElement.querySelector(".cantidad");
    let cantidad = parseInt(span.textContent);
    cantidad = Math.max(1, cantidad + cambio);
    span.textContent = cantidad;
}

function moverSlide(p) {
    const slider = document.getElementById("slider");
    const slides = document.querySelectorAll(".slide");
    if (!slider || slides.length === 0) return;
    indiceSlider = (indiceSlider + p + slides.length) % slides.length;
    slider.style.transform = `translateX(${-indiceSlider * 100}%)`;
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

function fijarPrecio(valor) {
    document.getElementById("precio").value = valor;
}

function toggleManual() {
    const panel = document.getElementById("panel-manual");
    panel.style.display = (panel.style.display === "block") ? "none" : "block";
}