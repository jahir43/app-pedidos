// --- CONFIG ---
const API = "http://localhost:3000";
let pedidosGlobal = [];
let cantidadActual = 1;
let indiceSlider = 0;

// --- INICIO ---
document.addEventListener("DOMContentLoaded", () => {
    cargarPedidos();
    activarBuscador();
    setInterval(cargarPedidos, 10000);
});

// --- API ---
async function cargarPedidos() {
    try {
        const res = await fetch(`${API}/pedidos`);
        const data = await res.json();
        pedidosGlobal = data;
        
        const buscador = document.getElementById("buscador");
        const filtro = buscador ? buscador.value.toLowerCase() : "";

        const filtrados = filtro 
            ? data.filter(p => p.producto.toLowerCase().includes(filtro))
            : data;
            
        renderPedidos(filtrados);
        actualizarDashboard(data);
    } catch (err) {
        console.error("Error al conectar con el servidor:", err);
    }
}

// --- AGREGAR DESDE FORMULARIO ---
async function agregar() {
    const id = document.getElementById('pedido-id').value;
    const producto = document.getElementById('producto').value.trim();
    const precio = Number(document.getElementById('precio').value);

    if (!producto || precio <= 0) return alert("⚠️ Datos inválidos");

    const payload = { producto, cantidad: cantidadActual, precio };
    const url = id ? `${API}/pedidos/${id}` : `${API}/pedido`;
    const method = id ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            cancelarEdicion();
            toggleManual();
            cargarPedidos();
            animarEfecto();
        }
    } catch (err) {
        alert("❌ Error al guardar");
    }
}

// --- AGREGAR DIRECTO (1 unidad) ---
async function agregarDirecto(nombre, precio) {
    try {
        await fetch(`${API}/pedido`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ producto: nombre, cantidad: 1, precio })
        });
    } catch (err) {
        console.error("Error en agregado directo:", err);
    }
}

// --- 🔥 NUEVO: AGREGAR DESDE SLIDER CON CANTIDAD ---
async function agregarDesdeSlider(btn, producto, precio) {
    const slide = btn.parentElement;
    const cantidad = parseInt(slide.querySelector(".cantidad").textContent);

    try {
        await fetch(`${API}/pedido`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ producto, cantidad, precio })
        });

        // Reset visual
        slide.querySelector(".cantidad").textContent = 1;

        cargarPedidos();
        animarEfecto();
    } catch (err) {
        console.error("Error agregando desde slider:", err);
    }
}

// --- 🔢 CONTROL DE CANTIDAD EN SLIDER ---
function cambiarCantidadSlider(btn, cambio) {
    const contenedor = btn.parentElement;
    const span = contenedor.querySelector(".cantidad");

    let cantidad = parseInt(span.textContent);
    cantidad += cambio;

    if (cantidad < 1) cantidad = 1;

    span.textContent = cantidad;
}

// --- ELIMINAR ---
async function eliminar(id) {
    try {
        await fetch(`${API}/pedidos/${id}`, { method: 'DELETE' });
        cargarPedidos();
    } catch (err) {
        console.error("Error al eliminar:", err);
    }
}

// --- FINALIZAR PEDIDO ---
async function finalizarPedido() {
    if (pedidosGlobal.length === 0) return alert("El carrito está vacío 🍟");

    const totalActual = pedidosGlobal.reduce((acc, p) => acc + (p.cantidad * p.precio), 0);
    const confirmacion = confirm(`¿Cobrar ${formatoCOP(totalActual)}?`);

    if (confirmacion) {
        try {
            const promesas = pedidosGlobal.map(p => 
                fetch(`${API}/pedidos/${p.id}`, { method: 'DELETE' })
            );
            await Promise.all(promesas);

            alert("✅ Venta finalizada");
            cargarPedidos();
        } catch (err) {
            alert("Error al procesar");
        }
    }
}

// --- RENDER ---
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

// --- UI ---
function toggleManual() {
    const panel = document.getElementById('panel-manual');
    if (panel) {
        panel.style.display = (panel.style.display === 'none' || panel.style.display === '') ? 'block' : 'none';
    }
}

function cancelarEdicion() {
    document.getElementById('pedido-id').value = "";
    document.getElementById('producto').value = "";
    document.getElementById('precio').value = "";
    cantidadActual = 1;
    document.getElementById('cantidad').textContent = 1;
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
    const input = document.getElementById('precio');
    if (input) input.value = valor;
}

function moverSlide(p) {
    const slider = document.getElementById("slider");
    const slides = document.querySelectorAll(".slide");

    if (!slider || slides.length === 0) return;

    indiceSlider = (indiceSlider + p + slides.length) % slides.length;
    slider.style.transform = `translateX(${-indiceSlider * 100}%)`;
}

function activarBuscador() {
    const buscador = document.getElementById("buscador");
    if (!buscador) return;

    buscador.addEventListener("input", () => {
        const filtro = buscador.value.toLowerCase();
        const filtrados = pedidosGlobal.filter(p =>
            p.producto.toLowerCase().includes(filtro)
        );
        renderPedidos(filtrados);
    });
}

function animarEfecto() {
    document.body.style.transform = "scale(0.98)";
    setTimeout(() => document.body.style.transform = "scale(1)", 100);
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
    data.forEach(p => conteo[p.producto] = (conteo[p.producto] || 0) + p.cantidad);

    const top = Object.keys(conteo).reduce((a, b) => conteo[a] > conteo[b] ? a : b);
    mv.textContent = top;
}