//------------------------------------------------ IMPORTS ------------------------------------------------
const { pool } = require('../config/db.config');

//------------------------------------------------ MODELO ------------------------------------------------
/**
 * Repositorio de la tabla `movimientos`.
 * Registra el destino de cada equipo (reasignación, reutilización,
 * conservación o entrega a gestor especializado).
 *
 * Esquema real:
 *   id, equipo_id, tipo, destino, gestor_id, peso_kg, fecha,
 *   responsable_id, observaciones
 */
const SELECT_DETALLE = `
  SELECT m.*,
         e.codigo          AS equipo_codigo,
         e.marca           AS equipo_marca,
         e.modelo          AS equipo_modelo,
         u.nombre_completo AS responsable_nombre,
         g.nombre          AS gestor_nombre
  FROM movimientos m
  LEFT JOIN equipos  e ON e.id = m.equipo_id
  LEFT JOIN usuarios u ON u.id = m.responsable_id
  LEFT JOIN gestores g ON g.id = m.gestor_id
`;

class MovimientoModel {
  static CAMPOS = [
    'equipo_id', 'tipo', 'fecha', 'destino',
    'gestor_id', 'peso_kg', 'observaciones',
  ];

  /**
   * filtros = { equipo_id?, tipo?, desde?, hasta? }
   */
  static async listar(filtros = {}) {
    const where = [];
    const params = [];

    if (filtros.equipo_id) { where.push('m.equipo_id = ?'); params.push(filtros.equipo_id); }
    if (filtros.tipo)      { where.push('m.tipo = ?');      params.push(filtros.tipo); }
    if (filtros.desde)     { where.push('m.fecha >= ?');    params.push(filtros.desde); }
    if (filtros.hasta)     { where.push('m.fecha < DATE_ADD(?, INTERVAL 1 DAY)'); params.push(filtros.hasta); }

    const sql = `${SELECT_DETALLE}
                 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY m.fecha DESC, m.id DESC`;
    return pool.query(sql, params);
  }

  /** Historial completo de un equipo, del más antiguo al más reciente. */
  static async historialEquipo(equipoId) {
    return pool.query(
      `${SELECT_DETALLE} WHERE m.equipo_id = ? ORDER BY m.fecha ASC, m.id ASC`,
      [equipoId]
    );
  }

  static async obtener(id) {
    const rows = await pool.query(`${SELECT_DETALLE} WHERE m.id = ?`, [id]);
    return rows[0] || null;
  }

  /** Inserta y retorna el id. Si no viene fecha, la BD pone NOW(). */
  static async crear(data) {
    const result = await pool.query(
      `INSERT INTO movimientos
         (equipo_id, tipo, fecha, responsable_id, destino, gestor_id, peso_kg, observaciones)
       VALUES (?, ?, COALESCE(?, NOW()), ?, ?, ?, ?, ?)`,
      [
        data.equipo_id,
        data.tipo,
        data.fecha ?? null,
        data.responsable_id,
        data.destino,
        data.gestor_id ?? null,
        data.peso_kg ?? null,
        data.observaciones ?? null,
      ]
    );
    return Number(result.insertId);
  }

  /** Actualiza solo los campos que vengan en data. */
  static async actualizar(id, data) {
    const campos = MovimientoModel.CAMPOS.filter((c) => data[c] !== undefined);
    if (campos.length === 0) return true;

    const set = campos.map((c) => `${c} = ?`).join(', ');
    const params = [...campos.map((c) => data[c]), id];
    const result = await pool.query(`UPDATE movimientos SET ${set} WHERE id = ?`, params);
    return result.affectedRows > 0;
  }

  static async eliminar(id) {
    const result = await pool.query('DELETE FROM movimientos WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = MovimientoModel;