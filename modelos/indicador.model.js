//------------------------------------------------ IMPORTS ------------------------------------------------
const { pool } = require('../config/db.config');

//------------------------------------------------ MODELO ------------------------------------------------
/**
 * Consultas agregadas (solo lectura) para el Módulo 5 — Indicadores y reportes.
 * Cada método es una consulta independiente; el controlador decide qué juntar.
 */
class IndicadorModel {
  // ---------- Equipos ----------
  static async totalEquipos() {
    const r = await pool.query('SELECT COUNT(*) AS total FROM equipos');
    return r[0].total;
  }

  static async equiposPorCondicion() {
    return pool.query(
      `SELECT COALESCE(condicion, 'sin_condicion') AS etiqueta, COUNT(*) AS total
       FROM equipos GROUP BY etiqueta ORDER BY total DESC`
    );
  }

  static async equiposPorCategoria() {
    return pool.query(
      `SELECT COALESCE(c.nombre, 'Sin categoría') AS etiqueta, COUNT(*) AS total
       FROM equipos e
       LEFT JOIN categorias c ON c.id = e.categoria_id
       GROUP BY etiqueta ORDER BY total DESC`
    );
  }

  static async equiposPorMes() {
    return pool.query(
      `SELECT DATE_FORMAT(fecha_ingreso, '%Y-%m') AS mes, COUNT(*) AS total
       FROM equipos
       WHERE fecha_ingreso >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 11 MONTH), '%Y-%m-01')
       GROUP BY mes ORDER BY mes`
    );
  }

  // ---------- Diagnósticos y reparaciones ----------
  static async diagnosticosPorRecomendacion() {
    return pool.query(
      `SELECT COALESCE(recomendacion, 'sin_recomendacion') AS etiqueta, COUNT(*) AS total
       FROM diagnosticos GROUP BY etiqueta ORDER BY total DESC`
    );
  }

  static async resumenReparaciones() {
    const rows = await pool.query(
      `SELECT COUNT(*) AS reparaciones,
              COUNT(DISTINCT equipo_id) AS equipos_reparados,
              COALESCE(SUM(costo), 0) AS costo_total,
              COALESCE(SUM(ahorro_estimado), 0) AS ahorro_estimado
       FROM reparaciones`
    );
    return rows[0];
  }

  // ---------- Movimientos y gestores ----------
  static async movimientosPorTipo() {
    return pool.query(
      `SELECT tipo AS etiqueta, COUNT(*) AS total
       FROM movimientos GROUP BY tipo ORDER BY total DESC`
    );
  }

  /** Equipos reutilizados o reasignados (según el ENUM real). */
  static async reutilizados() {
    const rows = await pool.query(
      `SELECT COUNT(DISTINCT equipo_id) AS reutilizados
       FROM movimientos
       WHERE tipo IN ('reasignacion','reutilizacion','conservacion')`
    );
    return rows[0];
  }

  static async entregasGestores() {
    const rows = await pool.query(
      `SELECT COUNT(*) AS entregas,
              COUNT(DISTINCT equipo_id) AS equipos_entregados,
              COALESCE(SUM(peso_kg), 0) AS kg_entregados
       FROM movimientos
       WHERE tipo = 'gestion_especializada'`
    );
    return rows[0];
  }

  static async entregasPorGestor() {
    return pool.query(
      `SELECT g.id, g.nombre,
              COUNT(m.id) AS entregas,
              COALESCE(SUM(m.peso_kg), 0) AS kg
       FROM gestores g
       LEFT JOIN movimientos m
         ON m.gestor_id = g.id AND m.tipo = 'gestion_especializada'
       GROUP BY g.id, g.nombre
       ORDER BY kg DESC, g.nombre ASC`
    );
  }

  static async gestoresResumen() {
    const rows = await pool.query(
      `SELECT COUNT(*) AS total, COALESCE(SUM(activo), 0) AS activos FROM gestores`
    );
    return rows[0];
  }

  // ---------- Campañas ----------
  static async campanasConParticipacion() {
    return pool.query(
      `SELECT c.id, c.nombre, c.fecha_inicio, c.fecha_fin, c.ubicacion,
              COUNT(p.id) AS participaciones
       FROM campanas c
       LEFT JOIN participaciones p ON p.campana_id = c.id
       GROUP BY c.id, c.nombre, c.fecha_inicio, c.fecha_fin, c.ubicacion
       ORDER BY c.fecha_inicio DESC`
    );
  }

  /** Equipos recibidos por campaña (vía equipos.campana_id). */
  static async equiposRecibidosPorCampana() {
    return pool.query(
      `SELECT campana_id AS id_campana, COUNT(*) AS equipos_recibidos
       FROM equipos
       WHERE campana_id IS NOT NULL
       GROUP BY campana_id`
    );
  }
}

module.exports = IndicadorModel;