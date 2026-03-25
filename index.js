const express = require('express');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors()); // ¡IMPORTANTE! Sin esto Angular no podrá conectar
app.use(express.json());

// Ruta de Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body; // Aquí 'password' debe ser "123456"

  try {
    const [users] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    
    if (users.length === 0) return res.status(401).json({ message: 'Usuario no encontrado' });

    const user = users[0];

    // ¡ESTA ES LA CLAVE! 
    // Compara la variable 'password' (texto plano) con 'user.password' (hash de la DB)
    const validPassword = await bcrypt.compare(password, user.password);

    console.log("Password recibido de Angular:", password); // Debería decir "123456"
    console.log("Password de la DB:", user.password);        // Debería decir "$2a$10$..."

    if (!validPassword) {
      return res.status(401).json({ message: 'Clave incorrecta' });
    }

    res.json({ message: '¡Login exitoso!', user: { nombre: user.nombre } });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/viajes', async (req, res) => {
  try {
    const query = `
      SELECT 
        v.id AS folio_viaje,
        e.nombre AS nombre_empresa,
        t.modelo AS modelo,
        t.placa_tracto AS placa_tracto,
        t.gondola1 AS godola1,
        t.placa_gondola1 AS placa_gondola1,
        t.gondola2 AS godola2,
        t.placa_gondola2 AS placa_gondola2,
        o.nombre_completo AS nombre_operador,
        o.telefono AS telefono_operador,
        m.nombre AS nombre_mina,
        m.ubicacion AS ubicacion_mina,
        u_mina.nombre AS despachador_mina,
        u_receptor.nombre AS receptor_final,
        v.producto,
        v.cantidad_m3,
        v.fecha_viaje,
        v.observaciones_mina,
        v.observaciones_recepcion,
        v.fecha_recepcion,
        v.fecha_registro
      FROM viajes v
      INNER JOIN empresas e ON v.empresa_id = e.id
      INNER JOIN tracto_camiones t ON v.tracto_id = t.id
      INNER JOIN operadores o ON v.operador_id = o.id
      INNER JOIN minas m ON v.mina_id = m.id
      INNER JOIN usuarios u_mina ON v.usuario_mina_id = u_mina.id
      LEFT JOIN usuarios u_receptor ON v.usuario_receptor_id = u_receptor.id
      ORDER BY v.fecha_registro DESC
    `;

    const [rows] = await db.query(query);
    res.json(rows); // Enviamos el array de viajes al frontend

  } catch (error) {
    console.error("Error al obtener viajes:", error);
    res.status(500).json({ error: 'Error al obtener la lista de viajes' });
  }
});

app.listen(3000, () => console.log("Backend corriendo en el puerto 3000"));