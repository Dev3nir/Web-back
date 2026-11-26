
const { pool } = require('../config/db.config');

class ParticipacionModel {

    // Obtener todas las participaciones
    static async listar() {
        return pool.query(`
      SELECT
        p.*,
        c.nombre AS nombre_campana
      FROM participaciones p
      INNER JOIN campanas c ON p.campana_id = c.id
      ORDER BY p.fecha_registro DESC
    `);
    }

    // Obtener una participación por su ID
    static async obtener(id) {
        const resultado = await pool.query(`
      SELECT
        p.*,
        c.nombre AS nombre_campana
      FROM participaciones p
      INNER JOIN campanas c ON p.campana_id = c.id
      WHERE p.id = ?
    `, [id]);

        return resultado[0] || null;
    }

    // Crear una participación
    static async crear(data) {
        const resultado = await pool.query(
            `INSERT INTO participaciones
      (campana_id, usuario_id, nombre_participante, correo)
      VALUES (?, ?, ?, ?)`,
            [
                data.campana_id,
                data.usuario_id ?? null,
                data.nombre_participante,
                data.correo ?? null
            ]
        );

        return resultado.insertId;
    }

    // Actualizar una participación
    static async actualizar(id, data) {
        const resultado = await pool.query(
            `UPDATE participaciones
       SET campana_id = ?,
           nombre_participante = ?,
           correo = ?
       WHERE id = ?`,
            [
                data.campana_id,
                data.nombre_participante,
                data.correo ?? null,
                id
            ]
        );

        return resultado.affectedRows;
    }

    // Eliminar una participación
    static async eliminar(id) {
        const resultado = await pool.query(
            'DELETE FROM participaciones WHERE id = ?',
            [id]
        );

        return resultado.affectedRows;
    }
}

module.exports = ParticipacionModel;
