//------------------------------------------------ IMPORTS ------------------------------------------------
const { pool } = require('../config/db.config');

//------------------------------------------------ MODELO ------------------------------------------------
const login = async (usuario) => {
  if (!usuario.username || !usuario.password) {
    throw new Error('Faltan campos obligatorios');
  }

  const rows = await pool.query(
    `SELECT
       id,
       nombre_usuario,
       nombre_completo,
       correo,
       password_hash,
       rol,
       activo,
       creado_en
     FROM usuarios
     WHERE nombre_usuario = ?`,
    [usuario.username]
  );

  if (rows.length === 0) {
    throw new Error('Usuario no encontrado');
  }

  return rows[0];
};

module.exports = { login };