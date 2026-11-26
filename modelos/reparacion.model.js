//------------------------------------------------ IMPORTS ------------------------------------------------
const { pool } = require('../config/db.config');

//------------------------------------------------ MODELO ------------------------------------------------
/**
 * Tabla real `reparaciones`:
 *   id, equipo_id, diagnostico_id, descripcion (text), costo (decimal),
 *   ahorro_estimado (decimal), fecha (date), responsable_id
 */
class ReparacionModel {
  static async listar() {
    return pool.query(
      `SELECT r.*,
              d.diagnostico AS diagnostico_descripcion,
              u.nombre_completo AS responsable_nombre
       FROM reparaciones r
       LEFT JOIN diagnosticos d ON d.id = r.diagnostico_id
       LEFT JOIN usuarios     u ON u.id = r.responsable_id
       ORDER BY r.id DESC`
    );
  }

  static async obtener(id) {
    const rows = await pool.query(
      `SELECT r.*,
              d.diagnostico AS diagnostico_descripcion,
              u.nombre_completo AS responsable_nombre
       FROM reparaciones r
       LEFT JOIN diagnosticos d ON d.id = r.diagnostico_id
       LEFT JOIN usuarios     u ON u.id = r.responsable_id
       WHERE r.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async porEquipo(equipoId) {
    return pool.query(
      `SELECT r.*, u.nombre_completo AS responsable_nombre
       FROM reparaciones r
       LEFT JOIN usuarios u ON u.id = r.responsable_id
       WHERE r.equipo_id = ?
       ORDER BY r.id DESC`,
      [equipoId]
    );
  }

  static async porDiagnostico(diagnosticoId) {
    return pool.query(
      `SELECT r.*, u.nombre_completo AS responsable_nombre
       FROM reparaciones r
       LEFT JOIN usuarios u ON u.id = r.responsable_id
       WHERE r.diagnostico_id = ?
       ORDER BY r.id DESC`,
      [diagnosticoId]
    );
  }

  /**
   * data = { equipo_id, diagnostico_id?, descripcion, costo?, ahorro_estimado?, fecha, responsable_id }
   * fecha es NOT NULL: la manda el front en "YYYY-MM-DD"
   */
  static async crear(data) {
    const result = await pool.query(
      `INSERT INTO reparaciones
         (equipo_id, diagnostico_id, descripcion, costo, ahorro_estimado, fecha, responsable_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.equipo_id,
        data.diagnostico_id ?? null,
        data.descripcion,
        data.costo ?? 0,
        data.ahorro_estimado ?? 0,
        data.fecha,
        data.responsable_id,
      ]
    );
    return Number(result.insertId);
  }

  /**
   * data = { diagnostico_id?, descripcion, costo?, ahorro_estimado?, fecha }
   */
  static async actualizar(id, data) {
    const result = await pool.query(
      `UPDATE reparaciones
       SET diagnostico_id  = ?,
           descripcion     = ?,
           costo           = ?,
           ahorro_estimado = ?,
           fecha           = ?
       WHERE id = ?`,
      [
        data.diagnostico_id ?? null,
        data.descripcion,
        data.costo ?? 0,
        data.ahorro_estimado ?? 0,
        data.fecha,
        id,
      ]
    );
    return result.affectedRows > 0;
  }

  static async eliminar(id) {
    const result = await pool.query(
      'DELETE FROM reparaciones WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = ReparacionModel;