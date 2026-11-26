//------------------------------------------------ IMPORTS ------------------------------------------------
const { pool } = require('../config/db.config');

//------------------------------------------------ MODELO ------------------------------------------------
/**
 * Repositorio de la tabla `gestores`.
 * Empresas / centros de acopio autorizados para recibir residuos.
 *
 * Esquema real:
 *   id, nombre, contacto, telefono, activo
 */
class GestorModel {
  static CAMPOS = ['nombre', 'contacto', 'telefono', 'activo'];

  /**
   * filtros = { activo?: 0|1, q?: string }
   */
  static async listar(filtros = {}) {
    const where = [];
    const params = [];

    if (filtros.activo !== undefined) {
      where.push('activo = ?');
      params.push(filtros.activo);
    }
    if (filtros.q) {
      where.push('nombre LIKE ?');
      params.push(`%${filtros.q}%`);
    }

    const sql = `SELECT * FROM gestores
                 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY nombre ASC`;
    return pool.query(sql, params);
  }

  static async obtener(id) {
    const rows = await pool.query('SELECT * FROM gestores WHERE id = ?', [id]);
    return rows[0] || null;
  }

  /** Busca por nombre exacto (para evitar duplicados). */
  static async porNombre(nombre) {
    const rows = await pool.query(
      'SELECT id FROM gestores WHERE LOWER(nombre) = LOWER(?)',
      [nombre]
    );
    return rows[0] || null;
  }

  static async crear(data) {
    const result = await pool.query(
      `INSERT INTO gestores (nombre, contacto, telefono, activo)
       VALUES (?, ?, ?, ?)`,
      [
        data.nombre,
        data.contacto ?? null,
        data.telefono ?? null,
        data.activo ?? 1,
      ]
    );
    return Number(result.insertId);
  }

  /** Actualiza solo los campos que vengan en `data`. */
  static async actualizar(id, data) {
    const campos = GestorModel.CAMPOS.filter((c) => data[c] !== undefined);
    if (campos.length === 0) return true;

    const set = campos.map((c) => `${c} = ?`).join(', ');
    const params = [...campos.map((c) => data[c]), id];
    const result = await pool.query(`UPDATE gestores SET ${set} WHERE id = ?`, params);
    return result.affectedRows > 0;
  }

  /** Soft delete: lo deja inactivo. */
  static async desactivar(id) {
    const result = await pool.query('UPDATE gestores SET activo = 0 WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /** Delete real (falla si tiene movimientos con FK). */
  static async eliminar(id) {
    const result = await pool.query('DELETE FROM gestores WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = GestorModel;