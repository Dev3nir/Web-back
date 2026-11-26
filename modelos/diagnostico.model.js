//------------------------------------------------ IMPORTS ------------------------------------------------
const { pool } = require('../config/db.config');

/**
 * MODELO: diagnosticos
 *
 * ⚠️ AJUSTA si tu tabla difiere. Columnas asumidas:
 *   id, equipo_id, usuario_id, fecha, descripcion,
 *   prioridad ('baja'|'media'|'alta'),
 *   estado ('pendiente'|'en_proceso'|'resuelto'), observaciones
 * Además se hace JOIN con equipos (marca, modelo) y usuarios (nombre_completo).
 */

//------------------------------------------------ MODELO ------------------------------------------------
class DiagnosticoModel {
  /**
   * Lista todos los diagnósticos, con datos del equipo y del responsable.
   * Más recientes primero.
   */
  static async listar() {
    return pool.query(
      `SELECT d.*,
              e.marca  AS equipo_marca,
              e.modelo AS equipo_modelo,
              u.nombre_completo AS responsable_nombre
       FROM diagnosticos d
       LEFT JOIN equipos   e ON e.id = d.equipo_id
       LEFT JOIN usuarios  u ON u.id = d.usuario_id
       ORDER BY d.id DESC`
    );
  }

  /**
   * Devuelve un diagnóstico por id. Retorna null si no existe.
   */
  static async obtener(id) {
    const rows = await pool.query(
      `SELECT d.*,
              e.marca  AS equipo_marca,
              e.modelo AS equipo_modelo,
              u.nombre_completo AS responsable_nombre
       FROM diagnosticos d
       LEFT JOIN equipos   e ON e.id = d.equipo_id
       LEFT JOIN usuarios  u ON u.id = d.usuario_id
       WHERE d.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Historial de diagnósticos de un equipo (útil para EquipoDetalle del Módulo 2).
   */
  static async porEquipo(equipoId) {
    return pool.query(
      `SELECT d.*, u.nombre_completo AS responsable_nombre
       FROM diagnosticos d
       LEFT JOIN usuarios u ON u.id = d.usuario_id
       WHERE d.equipo_id = ?
       ORDER BY d.id DESC`,
      [equipoId]
    );
  }

  /**
   * Crea un diagnóstico.
   * data = { equipo_id, usuario_id, descripcion, prioridad?, estado?, observaciones? }
   * La fecha se pone con NOW() (borra NOW() y pasa data.fecha si tu columna no es DATETIME).
   * Retorna el id insertado.
   */
  static async crear(data) {
    const result = await pool.query(
      `INSERT INTO diagnosticos
         (equipo_id, usuario_id, fecha, descripcion, prioridad, estado, observaciones)
       VALUES (?, ?, NOW(), ?, ?, ?, ?)`,
      [
        data.equipo_id,
        data.usuario_id ?? null,
        data.descripcion,
        data.prioridad ?? 'media',
        data.estado ?? 'pendiente',
        data.observaciones ?? null,
      ]
    );
    return result.insertId;
  }

  /**
   * Actualiza un diagnóstico (no mueve equipo ni fecha).
   * data = { descripcion, prioridad, estado, observaciones }
   * Retorna true si se modificó algo.
   */
  static async actualizar(id, data) {
    const result = await pool.query(
      `UPDATE diagnosticos
       SET descripcion   = ?,
           prioridad     = ?,
           estado        = ?,
           observaciones = ?
       WHERE id = ?`,
      [
        data.descripcion,
        data.prioridad ?? 'media',
        data.estado ?? 'pendiente',
        data.observaciones ?? null,
        id,
      ]
    );
    return result.affectedRows > 0;
  }

  /**
   * Elimina un diagnóstico (DELETE real). Retorna true si se eliminó.
   */
  static async eliminar(id) {
    const result = await pool.query(
      'DELETE FROM diagnosticos WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = DiagnosticoModel;
