const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// 🔥 SERVIR FRONTEND
app.use(express.static(path.join(__dirname, "../public")));

// --- DB ---
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

// --- TEST DB ---
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
  db.query(
    "SELECT * FROM pedidos ORDER BY id DESC",
    (err, results) => {

      if (err) {
        console.error("Error GET /pedidos:", err);

        return res.status(500).json({
          ok: false,
          error: "Error al obtener pedidos"
        });
      }

      res.json(results);
    }
  );
});

// 2. CREAR PEDIDO
app.post("/pedido", (req, res) => {

  let { producto, cantidad, precio } = req.body;

  // 🔒 VALIDACIONES
  if (!producto || typeof producto !== "string") {
    return res.status(400).json({
      ok: false,
      error: "Producto inválido"
    });
  }

  cantidad = Number(cantidad);
  precio = Number(precio);

  if (isNaN(cantidad) || cantidad <= 0) {
    return res.status(400).json({
      ok: false,
      error: "Cantidad inválida"
    });
  }

  if (isNaN(precio) || precio <= 0) {
    return res.status(400).json({
      ok: false,
      error: "Precio inválido"
    });
  }

  db.query(
    "INSERT INTO pedidos (producto, cantidad, precio) VALUES (?, ?, ?)",
    [producto.trim(), cantidad, precio],

    (err, result) => {

      if (err) {
        console.error("Error INSERT:", err);

        return res.status(500).json({
          ok: false,
          error: "Error al guardar"
        });
      }

      res.json({
        ok: true,
        id: result.insertId,
        mensaje: "Pedido creado"
      });
    }
  );
});

// 3. ACTUALIZAR PEDIDO
app.put("/pedidos/:id", (req, res) => {

  const { id } = req.params;

  let { producto, cantidad, precio } = req.body;

  cantidad = Number(cantidad);
  precio = Number(precio);

  if (!producto || cantidad <= 0 || precio <= 0) {
    return res.status(400).json({
      ok: false,
      error: "Datos inválidos"
    });
  }

  db.query(
    "UPDATE pedidos SET producto=?, cantidad=?, precio=? WHERE id=?",
    [producto.trim(), cantidad, precio, id],

    (err) => {

      if (err) {
        console.error("Error UPDATE:", err);

        return res.status(500).json({
          ok: false,
          error: "Error al actualizar"
        });
      }

      res.json({
        ok: true,
        mensaje: "Actualizado correctamente"
      });
    }
  );
});

// 4. ELIMINAR PEDIDO
app.delete("/pedidos/:id", (req, res) => {

  db.query(
    "DELETE FROM pedidos WHERE id=?",
    [req.params.id],

    (err) => {

      if (err) {
        console.error("Error DELETE:", err);

        return res.status(500).json({
          ok: false,
          error: "Error al eliminar"
        });
      }

      res.json({
        ok: true,
        mensaje: "Producto eliminado"
      });
    }
  );
});

// 5. LIMPIAR TODOS LOS PEDIDOS
app.delete("/limpiar-pedidos", (req, res) => {

  db.query(
    "DELETE FROM pedidos",

    (err) => {

      if (err) {
        console.error("Error limpiar:", err);

        return res.status(500).json({
          ok: false,
          error: "No se pudo limpiar"
        });
      }

      res.json({
        ok: true,
        mensaje: "Cuenta cerrada - pedidos eliminados"
      });
    }
  );
});

// --- 404 ---
app.use((req, res) => {

  res.status(404).json({
    ok: false,
    error: "Ruta no encontrada"
  });

});

// --- SERVER ---
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(`
🚀 SERVIDOR FUNCIONANDO
-----------------------
🌐 Puerto: ${PORT}
🗄️  DB: pedidos_db
🍔 Listo para pedidos
  `);

});