
const { pool } = require('../config/db.config');

class CampanaModel {

    // Obtener todas las campañas
    static async listar() {
        return pool.query(
            'SELECT * FROM campanas ORDER BY fecha_inicio DESC'
        );
    }

    // Obtener una campaña por su ID
    static async obtener(id) {
        const resultado = await pool.query(
            'SELECT * FROM campanas WHERE id = ?',
            [id]
        );

        return resultado[0] || null;
    }

    // Crear una campaña
    static async crear(data) {
        const resultado = await pool.query(
            `INSERT INTO campanas
      (nombre, descripcion, fecha_inicio, fecha_fin, ubicacion,
       tipos_aceptados, estado, creado_por)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.nombre,
                data.descripcion ?? null,
                data.fecha_inicio,
                data.fecha_fin,
                data.ubicacion,
                data.tipos_aceptados ?? null,
                data.estado ?? 'borrador',
                data.creado_por
            ]
        );

        return resultado.insertId;
    }

    // Actualizar una campaña
    static async actualizar(id, data) {
        const resultado = await pool.query(
            `UPDATE campanas
       SET nombre = ?,
           descripcion = ?,
           fecha_inicio = ?,
           fecha_fin = ?,
           ubicacion = ?,
           tipos_aceptados = ?,
           estado = ?
       WHERE id = ?`,
            [
                data.nombre,
                data.descripcion ?? null,
                data.fecha_inicio,
                data.fecha_fin,
                data.ubicacion,
                data.tipos_aceptados ?? null,
                data.estado,
                id
            ]
        );

        return resultado.affectedRows;
    }

    // Eliminar una campaña
    static async eliminar(id) {
        const resultado = await pool.query(
            'DELETE FROM campanas WHERE id = ?',
            [id]
        );

        return resultado.affectedRows;
    }
}

module.exports = CampanaModel;
