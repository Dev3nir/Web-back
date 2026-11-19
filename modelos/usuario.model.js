//------------------------------------------------ IMPORTS ------------------------------------------------
const { pool } = require('../config/db.config');

//------------------------------------------------ MODELO ------------------------------------------------
class UsuarioModel {
  /**
   * Lista todos los usuarios (sin password_hash por seguridad).
   * Ordenados por id ascendente.
   */
  static async listar() {
    return pool.query(
      `SELECT id, nombre_usuario, nombre_completo, correo, rol, activo, creado_en
       FROM usuarios
       ORDER BY id ASC`
    );
  }

  /**
   * Devuelve un usuario por id (sin password_hash).
   * Retorna null si no existe.
   */
  static async obtener(id) {
    const rows = await pool.query(
      `SELECT id, nombre_usuario, nombre_completo, correo, rol, activo, creado_en
       FROM usuarios
       WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Crea un usuario nuevo.
   * data = { nombre_usuario, nombre_completo, correo, password_hash, rol, activo }
   * Retorna el id insertado.
   */
  static async crear(data) {
    const result = await pool.query(
      `INSERT INTO usuarios
         (nombre_usuario, nombre_completo, correo, password_hash, rol, activo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.nombre_usuario,
        data.nombre_completo,
        data.correo ?? null,
        data.password_hash,
        data.rol ?? 'capturista',
        data.activo ?? 1,
      ]
    );
    return result.insertId;
  }

  /**
   * Actualiza campos de un usuario (sin tocar password aquí).
   * data = { nombre_completo, correo, rol, activo }
   * Retorna true si se modificó algo.
   */
  static async actualizar(id, data) {
    const result = await pool.query(
      `UPDATE usuarios
       SET nombre_completo = ?,
           correo = ?,
           rol = ?,
           activo = ?
       WHERE id = ?`,
      [
        data.nombre_completo,
        data.correo ?? null,
        data.rol ?? 'capturista',
        data.activo ?? 1,
        id,
      ]
    );
    return result.affectedRows > 0;
  }

  /**
   * Actualiza solo el password_hash (para cambio de contraseña).
   */
  static async actualizarPassword(id, password_hash) {
    const result = await pool.query(
      'UPDATE usuarios SET password_hash = ? WHERE id = ?',
      [password_hash, id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Elimina un usuario (DELETE real).
   * Retorna true si se eliminó.
   */
  static async eliminar(id) {
    const result = await pool.query(
      'DELETE FROM usuarios WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * ELiminar un usuario utilizando soft DELETE 
   * Desactiva el usuario para login
   */
  static async desactivar(id) {
  const result = await pool.query(
    'UPDATE usuarios SET activo = 0 WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}

  /**
   * Búsqueda por nombre_usuario (para validar duplicados antes de crear).
   * Retorna el usuario o null.
   */
  static async porNombreUsuario(nombre_usuario) {
    const rows = await pool.query(
      `SELECT id FROM usuarios WHERE nombre_usuario = ?`,
      [nombre_usuario]
    );
    return rows[0] || null;
  }
}

module.exports = UsuarioModel;