//------------------------------------------------ IMPORTS ------------------------------------------------
const { pool } = require('../config/db.config');

//------------------------------------------------ MODELO ------------------------------------------------
/**
 * Repositorio de la tabla `gestores`.
 * Un gestor es la empresa / centro de acopio / reciclador al que se le
 * entregan los equipos que ya requieren gestión especializada.
 *
 * Solo hace consultas a la BD. Las validaciones están en el controlador.
 */
class GestorModel {
  // Columnas que se pueden escribir desde la API (whitelist)
  static CAMPOS = [
    'nombre',
    'tipo',
    'contacto',
    'telefono',
    'correo',
    'direccion',
    'materiales_aceptados',
    'numero_autorizacion',
    'verificado',
    'activo',
  ];

  /**
   * Lista gestores con filtros opcionales.
   * filtros = { activo?: 0|1, verificado?: 0|1, q?: string }
   */
  static async listar(filtros = {}) {
    const where = [];
    const params = [];

    if (filtros.activo !== undefined) {
      where.push('activo = ?');
      params.push(filtros.activo);
    }
    if (filtros.verificado !== undefined) {
      where.push('verificado = ?');
      params.push(filtros.verificado);
    }
    if (filtros.q) {
      where.push('(nombre LIKE ? OR tipo LIKE ? OR materiales_aceptados LIKE ?)');
      const like = `%${filtros.q}%`;
      params.push(like, like, like);
    }

    const sql = `SELECT * FROM gestores
                 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY nombre ASC`;
    return pool.query(sql, params);
  }

  /** Devuelve un gestor por id o null. */
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

  /** Inserta un gestor. Retorna el id insertado. */
  static async crear(data) {
    const result = await pool.query(
      `INSERT INTO gestores
         (nombre, tipo, contacto, telefono, correo, direccion,
          materiales_aceptados, numero_autorizacion, verificado, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.nombre,
        data.tipo,
        data.contacto ?? null,
        data.telefono ?? null,
        data.correo ?? null,
        data.direccion ?? null,
        data.materiales_aceptados ?? null,
        data.numero_autorizacion ?? null,
        data.verificado ?? 0,
        data.activo ?? 1,
      ]
    );
    return result.insertId;
  }

  /**
   * Actualiza solo los campos que vengan en `data` (PATCH-like).
   * Retorna true si existía el registro.
   */
  static async actualizar(id, data) {
    const campos = GestorModel.CAMPOS.filter((c) => data[c] !== undefined);
    if (campos.length === 0) return true;

    const set = campos.map((c) => `${c} = ?`).join(', ');
    const params = campos.map((c) => data[c]);
    params.push(id);

    const result = await pool.query(`UPDATE gestores SET ${set} WHERE id = ?`, params);
    return result.affectedRows > 0;
  }

  /** Soft delete: lo deja inactivo para que ya no se elija en nuevas entregas. */
  static async desactivar(id) {
    const result = await pool.query('UPDATE gestores SET activo = 0 WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /** Delete real. Falla con ER_ROW_IS_REFERENCED si tiene movimientos. */
  static async eliminar(id) {
    const result = await pool.query('DELETE FROM gestores WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = GestorModel;
