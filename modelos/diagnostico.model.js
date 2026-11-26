//------------------------------------------------ IMPORTS ------------------------------------------------
const { pool } = require('../config/db.config');

//------------------------------------------------ MODELO ------------------------------------------------
/**
 * Tabla real `diagnosticos`:
 *   id, equipo_id, diagnostico (text), recomendacion (enum),
 *   fecha (datetime), responsable_id
 */
class DiagnosticoModel {
  static async listar() {
    return pool.query(
      `SELECT d.*,
              e.marca  AS equipo_marca,
              e.modelo AS equipo_modelo,
              u.nombre_completo AS responsable_nombre
       FROM diagnosticos d
       LEFT JOIN equipos  e ON e.id = d.equipo_id
       LEFT JOIN usuarios u ON u.id = d.responsable_id
       ORDER BY d.id DESC`
    );
  }

  static async obtener(id) {
    const rows = await pool.query(
      `SELECT d.*,
              e.marca  AS equipo_marca,
              e.modelo AS equipo_modelo,
              u.nombre_completo AS responsable_nombre
       FROM diagnosticos d
       LEFT JOIN equipos  e ON e.id = d.equipo_id
       LEFT JOIN usuarios u ON u.id = d.responsable_id
       WHERE d.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async porEquipo(equipoId) {
    return pool.query(
      `SELECT d.*, u.nombre_completo AS responsable_nombre
       FROM diagnosticos d
       LEFT JOIN usuarios u ON u.id = d.responsable_id
       WHERE d.equipo_id = ?
       ORDER BY d.id DESC`,
      [equipoId]
    );
  }

  /**
   * data = { equipo_id, diagnostico, recomendacion, responsable_id }
   * fecha la pone MySQL con DEFAULT current_timestamp()
   */
  static async crear(data) {
    const result = await pool.query(
      `INSERT INTO diagnosticos
         (equipo_id, diagnostico, recomendacion, responsable_id)
       VALUES (?, ?, ?, ?)`,
      [
        data.equipo_id,
        data.diagnostico,
        data.recomendacion ?? 'reparar',
        data.responsable_id,
      ]
    );
    return Number(result.insertId);
  }

  /**
   * data = { diagnostico, recomendacion }
   * (no se permite cambiar equipo ni responsable)
   */
  static async actualizar(id, data) {
    const result = await pool.query(
      `UPDATE diagnosticos
       SET diagnostico   = ?,
           recomendacion = ?
       WHERE id = ?`,
      [data.diagnostico, data.recomendacion, id]
    );
    return result.affectedRows > 0;
  }

  static async eliminar(id) {
    const result = await pool.query(
      'DELETE FROM diagnosticos WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = DiagnosticoModel;