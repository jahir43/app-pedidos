const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();

// --- MIDDLEWARES ---
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Accept'] 
}));

app.use(express.json());

// SERVIR FRONTEND (Asegúrate de que la carpeta se llame 'public')
app.use(express.static(path.join(__dirname, "../public")));

// --- CONFIGURACIÓN DE BASE DE DATOS ---
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "123456",
  database: process.env.DB_NAME || "pedidos_db",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Prueba de conexión
db.getConnection((err, conn) => {
  if (err) {
    console.error("❌ Error conectando a MySQL:", err);
  } else {
    console.log("✅ Conectado a MySQL");
    conn.release();
  }
});

// --- RUTAS ---

// 1. OBTENER PEDIDOS
app.get("/pedidos", (req, res) => {
  db.query("SELECT * FROM pedidos ORDER BY id DESC", (err, results) => {
    if (err) {
      console.error("Error GET /pedidos:", err);
      return res.status(500).json({ ok: false, error: "Error al obtener pedidos" });
    }
    res.json(results);
  });
});

// 2. CREAR PEDIDO
app.post("/pedido", (req, res) => {
  console.log("Cuerpo recibido:", req.body);
  let { producto, cantidad, precio } = req.body;

  if (!producto || typeof producto !== "string") {
    return res.status(400).json({ ok: false, error: "Producto inválido" });
  }

  cantidad = Number(cantidad);
  precio = Number(precio);

  if (isNaN(cantidad) || cantidad <= 0 || isNaN(precio) || precio <= 0) {
    return res.status(400).json({ ok: false, error: "Cantidad o precio inválidos" });
  }

  const query = "INSERT INTO pedidos (producto, cantidad, precio) VALUES (?, ?, ?)";
  db.query(query, [producto.trim(), cantidad, precio], (err, result) => {
    if (err) {
      console.error("❌ ERROR DB:", err);
      return res.status(500).json({ ok: false, error: err.message });
    }
    res.json({ ok: true, id: result.insertId, mensaje: "Pedido creado" });
  });
});

// 3. ACTUALIZAR PEDIDO
app.put("/pedidos/:id", (req, res) => {
  const { id } = req.params;
  let { producto, cantidad, precio } = req.body;

  db.query(
    "UPDATE pedidos SET producto=?, cantidad=?, precio=? WHERE id=?",
    [producto.trim(), Number(cantidad), Number(precio), id],
    (err) => {
      if (err) return res.status(500).json({ ok: false, error: "Error al actualizar" });
      res.json({ ok: true, mensaje: "Actualizado" });
    }
  );
});

// 4. ELIMINAR UN PRODUCTO ESPECÍFICO
app.delete("/pedidos/:id", (req, res) => {
  db.query("DELETE FROM pedidos WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ ok: false, error: "Error al eliminar" });
    res.json({ ok: true, mensaje: "Producto eliminado" });
  });
});

// 5. RUTA DE LIMPIEZA TOTAL (Para el botón Finalizar y Cobrar)
app.delete("/limpiar-pedidos", (req, res) => {
  const sql = "DELETE FROM pedidos";
  db.query(sql, (err, result) => {
    if (err) {
      console.error("❌ Error al limpiar tabla:", err);
      return res.status(500).json({ ok: false, error: "No se pudo vaciar la cuenta" });
    }
    console.log("🧹 Carrito vaciado correctamente");
    res.json({ ok: true, mensaje: "Cuenta cerrada - pedidos eliminados" });
  });
});

// --- MANEJO DE RUTAS NO ENCONTRADAS ---
app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Ruta no encontrada" });
});

// --- INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
🚀 SERVIDOR FUNCIONANDO
-----------------------
🌐 Puerto: ${PORT}
🗄️  Estado: Esperando peticiones
🍔 App: App-Pedidos
  `);
});