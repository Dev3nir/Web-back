//------------------------------------------------ IMPORTS ------------------------------------------------
const jwt = require('jsonwebtoken');
require('dotenv').config();

//------------------------------------------------ MIDDLEWARES ------------------------------------------------
/**
 * Verifica que el request traiga un JWT válido en:
 *   Authorization: Bearer <token>
 * Si es válido, deja el payload en req.user:
 *   { id_usuario, nombreUsuario, rol, iat, exp }
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido o expirado' });
    }
    req.user = user;
    next();
  });
};

/**
 * Firma un JWT con los datos del usuario.
 * Espera: { id_usuario, nombreUsuario, rol }
 * Expira en 24 h.
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id_usuario: user.id_usuario,
      nombreUsuario: user.nombreUsuario,
      rol: user.rol,
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

module.exports = { authenticateToken, generateToken };