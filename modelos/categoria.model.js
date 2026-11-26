const { pool } = require('../config/db.config');

class CategoriaModel {
  static async listar() {
    return pool.query('SELECT * FROM categorias ORDER BY nombre ASC');
  }

  static async obtener(id) {
    const r = await pool.query('SELECT * FROM categorias WHERE id = ?', [id]);
    return r[0] || null;
  }

  static async crear(data) {
    const { nombre, descripcion = null } = data;
    const result = await pool.query(
      'INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)',
      [nombre, descripcion]
    );
    return Number(result.insertId);
  }

  static async actualizar(id, data) {
    const { nombre, descripcion = null } = data;
    const result = await pool.query(
      'UPDATE categorias SET nombre = ?, descripcion = ? WHERE id = ?',
      [nombre, descripcion, id]
    );
    return result.affectedRows > 0;
  }

  static async eliminar(id) {
    const result = await pool.query('DELETE FROM categorias WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = CategoriaModel;