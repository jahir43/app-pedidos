const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();

// --- MIDDLEWARES ---
// Configuración de CORS optimizada para dispositivos móviles
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// SERVIR FRONTEND
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

// 2. CREAR PEDIDO (Corregido y Unificado)
app.post("/pedido", (req, res) => {
  console.log("Cuerpo recibido desde el dispositivo:", req.body);

  let { producto, cantidad, precio } = req.body;

  // Validaciones básicas
  if (!producto || typeof producto !== "string") {
    return res.status(400).json({ ok: false, error: "Producto inválido o vacío" });
  }

  cantidad = Number(cantidad);
  precio = Number(precio);

  if (isNaN(cantidad) || cantidad <= 0 || isNaN(precio) || precio <= 0) {
    return res.status(400).json({ ok: false, error: "Cantidad o precio inválidos" });
  }

  const query = "INSERT INTO pedidos (producto, cantidad, precio) VALUES (?, ?, ?)";
  db.query(query, [producto.trim(), cantidad, precio], (err, result) => {
    if (err) {
      console.error("❌ DETALLE DEL ERROR EN DB:", err);
      return res.status(500).json({ 
        ok: false, 
        error: "Error de base de datos: " + err.message 
      });
    }

    res.json({
      ok: true,
      id: result.insertId,
      mensaje: "Pedido creado correctamente"
    });
  });
});

// 3. ACTUALIZAR PEDIDO
app.put("/pedidos/:id", (req, res) => {
  const { id } = req.params;
  let { producto, cantidad, precio } = req.body;

  cantidad = Number(cantidad);
  precio = Number(precio);

  if (!producto || cantidad <= 0 || precio <= 0) {
    return res.status(400).json({ ok: false, error: "Datos inválidos para actualizar" });
  }

  db.query(
    "UPDATE pedidos SET producto=?, cantidad=?, precio=? WHERE id=?",
    [producto.trim(), cantidad, precio, id],
    (err) => {
      if (err) {
        console.error("Error UPDATE:", err);
        return res.status(500).json({ ok: false, error: "Error al actualizar" });
      }
      res.json({ ok: true, mensaje: "Actualizado correctamente" });
    }
  );
});

// 4. ELIMINAR PEDIDO
app.delete("/pedidos/:id", (req, res) => {
  db.query("DELETE FROM pedidos WHERE id=?", [req.params.id], (err) => {
    if (err) {
      console.error("Error DELETE:", err);
      return res.status(500).json({ ok: false, error: "Error al eliminar" });
    }
    res.json({ ok: true, mensaje: "Producto eliminado" });
  });
});

// 5. LIMPIAR TODOS LOS PEDIDOS
app.delete("/limpiar-pedidos", (req, res) => {
  db.query("DELETE FROM pedidos", (err) => {
    if (err) {
      console.error("Error limpiar:", err);
      return res.status(500).json({ ok: false, error: "No se pudo limpiar la tabla" });
    }
    res.json({ ok: true, mensaje: "Cuenta cerrada - pedidos eliminados" });
  });
});

// --- MANEJO DE RUTAS NO ENCONTRADAS ---
app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Ruta no encontrada en el servidor" });
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