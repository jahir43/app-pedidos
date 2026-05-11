const API = "http://localhost:3000";
let pedidosGlobal = [];
let cantidadActual = 1;
let indiceSlider = 0;

// --- INICIO ---
document.addEventListener("DOMContentLoaded", () => {
    cargarPedidos();
    activarBuscador();
    setInterval(cargarPedidos, 10000); // Auto-refresh suave cada 10s
});

// --- COMUNICACIÓN CON API ---
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

async function agregar() {
    const id = document.getElementById('pedido-id').value;
    const producto = document.getElementById('producto').value.trim();
    const precio = Number(document.getElementById('precio').value);

    if (!producto || precio <= 0) return alert("⚠️ Datos inválidos: ingresa nombre y precio.");

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
            cargarPedidos();
            animarEfecto();
        }
    } catch (err) {
        alert("❌ Error al guardar el pedido");
    }
}

async function agregarDirecto(nombre, precio) {
    try {
        await fetch(`${API}/pedido`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ producto: nombre, cantidad: 1, precio })
        });
        cargarPedidos();
        animarEfecto();
    } catch (err) { console.error("Error en agregado directo:", err); }
}

async function eliminar(id) {
    if (!confirm("¿Seguro que deseas eliminar este pedido? 🗑️")) return;
    try {
        await fetch(`${API}/pedidos/${id}`, { method: 'DELETE' });
        cargarPedidos();
    } catch (err) { console.error("Error al eliminar:", err); }
}

// --- INTERFAZ Y UI ---
function renderPedidos(data) {
    const lista = document.getElementById("lista");
    const totalTxt = document.getElementById("total");
    if (!lista || !totalTxt) return;

    lista.innerHTML = "";
    let suma = 0;

    if (data.length === 0) {
        lista.innerHTML = "<li>No hay pedidos coincidentes 🍟</li>";
    }

    data.forEach(p => {
        const sub = p.cantidad * p.precio;
        suma += sub;
        const li = document.createElement("li");
        li.innerHTML = `
            <span><b>${p.cantidad}x</b> ${p.producto} <br> <small>${formatoCOP(sub)}</small></span>
            <div>
                <button style="background:var(--primary); margin-right:5px;" onclick="prepararEdicion(${p.id}, '${p.producto}', ${p.cantidad}, ${p.precio})">✏️</button>
                <button style="background:var(--danger)" onclick="eliminar(${p.id})">🗑️</button>
            </div>
        `;
        lista.appendChild(li);
    });
    totalTxt.textContent = `Total: ${formatoCOP(suma)}`;
}

function prepararEdicion(id, prod, cant, prec) {
    document.getElementById('pedido-id').value = id;
    document.getElementById('producto').value = prod;
    document.getElementById('precio').value = prec;
    cantidadActual = cant;
    document.getElementById('cantidad').textContent = cant;
    document.getElementById('form-title').textContent = "✏️ Editando pedido";
    document.getElementById('btn-agregar').textContent = "Guardar Cambios";
    document.getElementById('btn-cancelar').style.display = "block";
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Sube al formulario
}

function cancelarEdicion() {
    document.getElementById('pedido-id').value = "";
    document.getElementById('producto').value = "";
    document.getElementById('precio').value = "";
    cantidadActual = 1;
    document.getElementById('cantidad').textContent = 1;
    document.getElementById('form-title').textContent = "Nuevo pedido";
    document.getElementById('btn-agregar').textContent = "Agregar al pedido";
    document.getElementById('btn-cancelar').style.display = "none";
}

// --- UTILIDADES ---
function formatoCOP(v) { return "$" + Number(v).toLocaleString("es-CO"); }

function cambiarCantidad(v) {
    cantidadActual = Math.max(1, cantidadActual + v);
    document.getElementById("cantidad").textContent = cantidadActual;
}

function fijarPrecio(valor) {
    const precioInput = document.getElementById('precio');
    if (precioInput) {
        precioInput.value = valor;
        precioInput.style.backgroundColor = "#e8f0fe";
        setTimeout(() => precioInput.style.backgroundColor = "white", 300);
    }
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
    if (buscador) {
        buscador.addEventListener("input", renderizarBusquedaLocal);
    }
}

function renderizarBusquedaLocal() {
    const filtro = document.getElementById("buscador").value.toLowerCase();
    const filtrados = pedidosGlobal.filter(p => p.producto.toLowerCase().includes(filtro));
    renderPedidos(filtrados);
}

function animarEfecto() {
    document.body.style.transition = "transform 0.1s";
    document.body.style.transform = "scale(0.995)";
    setTimeout(() => document.body.style.transform = "scale(1)", 100);
}

function actualizarDashboard(data) {
    const tv = document.getElementById("totalVentas");
    const mv = document.getElementById("masVendido");
    if (!tv || !mv) return;

    const totalVentas = data.reduce((acc, p) => acc + (p.cantidad * p.precio), 0);
    tv.textContent = formatoCOP(totalVentas);
    
    if (data.length === 0) {
        mv.textContent = "-";
        return;
    }

    const conteo = {};
    data.forEach(p => conteo[p.producto] = (conteo[p.producto] || 0) + p.cantidad);
    let top = Object.keys(conteo).reduce((a, b) => conteo[a] > conteo[b] ? a : b);
    mv.textContent = top;
}