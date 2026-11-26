const { pool } = require('../config/db.config');

class EquipoModel {
  static async listar() {
    return pool.query(`
      SELECT e.*, c.nombre AS categoria_nombre
      FROM equipos e
      LEFT JOIN categorias c ON e.categoria_id = c.id
      ORDER BY e.id DESC
    `);
  }

    static async contarPendientes() {
    const rows = await pool.query(`
      SELECT COUNT(*) AS total
      FROM equipos
      WHERE condicion = 'pendiente_gestion'
    `);

    return rows[0].total;
  }

  static async obtener(id) {
    const r = await pool.query(`
      SELECT e.*, c.nombre AS categoria_nombre
      FROM equipos e
      LEFT JOIN categorias c ON e.categoria_id = c.id
      WHERE e.id = ?
    `, [id]);
    return r[0] || null;
  }

  static async crear(data) {
    const {
      codigo,
      categoria_id,
      marca = null,
      modelo = null,
      fecha_ingreso,
      condicion = 'reparable',
      observaciones = null,
      campana_id = null,
      registrado_por
    } = data;

    const result = await pool.query(
      `INSERT INTO equipos 
        (codigo, categoria_id, marca, modelo, fecha_ingreso, condicion, observaciones, campana_id, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [codigo, categoria_id, marca, modelo, fecha_ingreso, condicion, observaciones, campana_id, registrado_por]
    );
    return Number(result.insertId);
  }

  static async actualizar(id, data) {
    const {
      codigo,
      categoria_id,
      marca = null,
      modelo = null,
      fecha_ingreso,
      condicion = 'reparable',
      observaciones = null,
      campana_id = null
    } = data;

    const result = await pool.query(
      `UPDATE equipos
       SET codigo = ?, categoria_id = ?, marca = ?, modelo = ?,
           fecha_ingreso = ?, condicion = ?, observaciones = ?, campana_id = ?
       WHERE id = ?`,
      [codigo, categoria_id, marca, modelo, fecha_ingreso, condicion, observaciones, campana_id, id]
    );
    return result.affectedRows > 0;
  }

  static async eliminar(id) {
    const result = await pool.query('DELETE FROM equipos WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = EquipoModel;