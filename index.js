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

app.listen(3000, () => console.log("Backend corriendo en el puerto 3000"));