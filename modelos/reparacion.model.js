//------------------------------------------------ IMPORTS ------------------------------------------------
const { pool } = require('../config/db.config');

/**
 * MODELO: reparaciones
 *
 * ⚠️ AJUSTA si tu tabla difiere. Columnas asumidas:
 *   id, diagnostico_id, usuario_id, fecha_inicio, fecha_fin,
 *   descripcion, costo,
 *   estado ('pendiente'|'en_proceso'|'completada'), creado_en
 * Se hace JOIN con diagnosticos (descripcion, equipo_id) y usuarios (nombre_completo).
 */

//------------------------------------------------ MODELO ------------------------------------------------
class ReparacionModel {
  /**
   * Lista todas las reparaciones, con el diagnóstico y el responsable.
   * Más recientes primero.
   */
  static async listar() {
    return pool.query(
      `SELECT r.*,
              d.descripcion AS diagnostico_descripcion,
              d.equipo_id   AS equipo_id,
              u.nombre_completo AS responsable_nombre
       FROM reparaciones r
       LEFT JOIN diagnosticos d ON d.id = r.diagnostico_id
       LEFT JOIN usuarios     u ON u.id = r.usuario_id
       ORDER BY r.id DESC`
    );
  }

  /**
   * Devuelve una reparación por id. Retorna null si no existe.
   */
  static async obtener(id) {
    const rows = await pool.query(
      `SELECT r.*,
              d.descripcion AS diagnostico_descripcion,
              d.equipo_id   AS equipo_id,
              u.nombre_completo AS responsable_nombre
       FROM reparaciones r
       LEFT JOIN diagnosticos d ON d.id = r.diagnostico_id
       LEFT JOIN usuarios     u ON u.id = r.usuario_id
       WHERE r.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Reparaciones ligadas a un diagnóstico.
   */
  static async porDiagnostico(diagnosticoId) {
    return pool.query(
      `SELECT r.*, u.nombre_completo AS responsable_nombre
       FROM reparaciones r
       LEFT JOIN usuarios u ON u.id = r.usuario_id
       WHERE r.diagnostico_id = ?
       ORDER BY r.id DESC`,
      [diagnosticoId]
    );
  }

  /**
   * Crea una reparación.
   * data = { diagnostico_id, usuario_id, fecha_inicio?, fecha_fin?,
   *          descripcion, costo?, estado? }
   * fecha_inicio se pone con NOW() si no se manda (ajusta según tu columna).
   * Retorna el id insertado.
   */
  static async crear(data) {
    const result = await pool.query(
      `INSERT INTO reparaciones
         (diagnostico_id, usuario_id, fecha_inicio, fecha_fin, descripcion, costo, estado)
       VALUES (?, ?, COALESCE(?, NOW()), ?, ?, ?, ?)`,
      [
        data.diagnostico_id,
        data.usuario_id ?? null,
        data.fecha_inicio ?? null,
        data.fecha_fin ?? null,
        data.descripcion,
        data.costo ?? 0,
        data.estado ?? 'pendiente',
      ]
    );
    return result.insertId;
  }

  /**
   * Actualiza una reparación.
   * data = { fecha_inicio?, fecha_fin?, descripcion, costo?, estado? }
   * Retorna true si se modificó algo.
   */
  static async actualizar(id, data) {
    const result = await pool.query(
      `UPDATE reparaciones
       SET fecha_inicio = ?,
           fecha_fin    = ?,
           descripcion  = ?,
           costo        = ?,
           estado       = ?
       WHERE id = ?`,
      [
        data.fecha_inicio ?? null,
        data.fecha_fin ?? null,
        data.descripcion,
        data.costo ?? 0,
        data.estado ?? 'pendiente',
        id,
      ]
    );
    return result.affectedRows > 0;
  }

  /**
   * Elimina una reparación (DELETE real). Retorna true si se eliminó.
   */
  static async eliminar(id) {
    const result = await pool.query(
      'DELETE FROM reparaciones WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = ReparacionModel;
