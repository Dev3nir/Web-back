//------------------------------ IMPORTS ------------------------------
const modelLogin = require('../modelos/login.model');
const bcrypt = require('bcrypt');
const { generateToken } = require('../middlewares/auth.middleware');

// Mapa en memoria: { username: { intentos: 0, bloqueadoHasta: null } }
const intentosFallidos = {};
const MAX_INTENTOS = 3;
const TIEMPO_BLOQUEO_MS = 5 * 60 * 1000; // 5 minutos

//------------------------------ CONTROLADORES ------------------------------
exports.login = async (req, res) => {
  try {
    const usuario = req.body || {};

    if (!usuario.username || !usuario.password) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    // Verificar bloqueo
    const registro = intentosFallidos[usuario.username];
    if (registro?.bloqueadoHasta && Date.now() < registro.bloqueadoHasta) {
      const minutosRestantes = Math.ceil(
        (registro.bloqueadoHasta - Date.now()) / 60000
      );
      return res.status(429).json({
        message: `Cuenta bloqueada. Intenta en ${minutosRestantes} minuto(s).`,
      });
    }

    // Buscar usuario
    const user = await modelLogin.login(usuario);

    // Cuenta inactiva
    if (!user.activo) {
      return res.status(403).json({ message: 'Usuario inactivo' });
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(
      usuario.password,
      user.password_hash
    );

    if (!passwordMatch) {
      if (!intentosFallidos[usuario.username]) {
        intentosFallidos[usuario.username] = { intentos: 0, bloqueadoHasta: null };
      }
      intentosFallidos[usuario.username].intentos++;

      if (intentosFallidos[usuario.username].intentos >= MAX_INTENTOS) {
        intentosFallidos[usuario.username].bloqueadoHasta =
          Date.now() + TIEMPO_BLOQUEO_MS;
        return res.status(429).json({
          message: 'Demasiados intentos fallidos. Cuenta bloqueada por 5 minutos.',
        });
      }

      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Login exitoso: limpiar intentos
    delete intentosFallidos[usuario.username];

    // Generar token (rol tal cual viene de la BD: 'administrador')
    const token = generateToken({
      id_usuario: user.id,
      nombreUsuario: user.nombre_usuario,
      rol: user.rol,
    });

    // Respuesta: datos del usuario (sin password_hash) + token
    const { password_hash, ...userSafe } = user;

    return res.json({
      ...userSafe,
      token,
    });
  } catch (error) {
    console.error('Error login:', error);

    // Si el modelo lanzó "Usuario no encontrado", responde 401 en vez de 500
    if (error.message === 'Usuario no encontrado') {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }
    if (error.message === 'Faltan campos obligatorios') {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({
      message: error.message || 'Error interno del servidor',
    });
  }
};