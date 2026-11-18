const { pool } = require('../config/db.config');

class EquipoModel {
  static async listar()      { return pool.query('SELECT * FROM equipos'); }
  static async obtener(id)   { const r = await pool.query('SELECT * FROM equipos WHERE id=?', [id]); return r[0]||null; }
  static async crear(data)   { throw new Error('TODO: implementar'); }
  static async actualizar()  { throw new Error('TODO: implementar'); }
  static async eliminar()    { throw new Error('TODO: implementar'); }
}
module.exports = EquipoModel;