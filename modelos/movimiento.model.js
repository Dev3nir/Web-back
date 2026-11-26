//------------------------------------------------ IMPORTS ------------------------------------------------
const { pool } = require('../config/db.config');

//------------------------------------------------ MODELO ------------------------------------------------
/**
 * Repositorio de la tabla `movimientos`.
 * Cada fila es un paso en la vida de un equipo: ingreso, reasignación,
 * reparación, resguardo, entrega a gestor o baja. Así se arma el historial.
 *
 * Solo consultas a la BD; las reglas de negocio están en el controlador
 * y en servicios/movimiento.strategies.js
 */

// SELECT base con los datos legibles del equipo, el responsable y el gestor
const SELECT_DETALLE = `
  SELECT m.*,
         e.marca           AS equipo_marca,
         e.modelo          AS equipo_modelo,
         u.nombre_completo AS responsable_nombre,
         v.nombre_completo AS validado_por_nombre,
         g.nombre          AS gestor_nombre,
         g.verificado      AS gestor_verificado
  FROM movimientos m
  LEFT JOIN equipos  e ON e.id = m.id_equipo
  LEFT JOIN usuarios u ON u.id = m.id_responsable
  LEFT JOIN usuarios v ON v.id = m.validado_por
  LEFT JOIN gestores g ON g.id = m.id_gestor
`;

class MovimientoModel {
  // Campos editables (whitelist para el UPDATE)
  static CAMPOS = ['id_equipo', 'tipo', 'fecha', 'destino', 'id_gestor',
                   'cantidad_kg', 'evidencia', 'observaciones'];

  /**
   * filtros = { id_equipo?, tipo?, validado?: 0|1, desde?: 'YYYY-MM-DD', hasta?: 'YYYY-MM-DD' }
   */
  static async listar(filtros = {}) {
    const where = [];
    const params = [];

    if (filtros.id_equipo) { where.push('m.id_equipo = ?'); params.push(filtros.id_equipo); }
    if (filtros.tipo)      { where.push('m.tipo = ?');      params.push(filtros.tipo); }
    if (filtros.validado !== undefined) { where.push('m.validado = ?'); params.push(filtros.validado); }
    if (filtros.desde)     { where.push('m.fecha >= ?');    params.push(filtros.desde); }
    if (filtros.hasta)     { where.push('m.fecha < DATE_ADD(?, INTERVAL 1 DAY)'); params.push(filtros.hasta); }

    const sql = `${SELECT_DETALLE}
                 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY m.fecha DESC, m.id DESC`;
    return pool.query(sql, params);
  }

  /** Historial completo de un equipo, del más antiguo al más reciente. */
  static async historialEquipo(idEquipo) {
    return pool.query(
      `${SELECT_DETALLE} WHERE m.id_equipo = ? ORDER BY m.fecha ASC, m.id ASC`,
      [idEquipo]
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
         (id_equipo, tipo, fecha, id_responsable, destino, id_gestor,
          cantidad_kg, evidencia, observaciones)
       VALUES (?, ?, COALESCE(?, NOW()), ?, ?, ?, ?, ?, ?)`,
      [
        data.id_equipo,
        data.tipo,
        data.fecha ?? null,
        data.id_responsable,
        data.destino ?? null,
        data.id_gestor ?? null,
        data.cantidad_kg ?? null,
        data.evidencia ?? null,
        data.observaciones ?? null,
      ]
    );
    return result.insertId;
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

  /** Marca el movimiento como validado por un responsable ambiental / admin. */
  static async validar(id, idUsuario) {
    const result = await pool.query(
      `UPDATE movimientos
       SET validado = 1, validado_por = ?, validado_en = NOW()
       WHERE id = ? AND validado = 0`,
      [idUsuario, id]
    );
    return result.affectedRows > 0;
  }

  static async eliminar(id) {
    const result = await pool.query('DELETE FROM movimientos WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = MovimientoModel;
