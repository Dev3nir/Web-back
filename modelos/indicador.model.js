//------------------------------------------------ IMPORTS ------------------------------------------------
const { pool } = require('../config/db.config');

//------------------------------------------------ ESQUEMA ------------------------------------------------
/**
 * Nombres de tablas/columnas de OTROS módulos que usan los indicadores.
 * Si algún compañero nombró distinto una columna, SOLO se cambia aquí.
 * (Son constantes del código, nunca vienen del usuario → no hay riesgo de inyección).
 */
const S = {
  equipos:         { t: 'equipos',         condicion: 'condicion', categoria: 'id_categoria', fecha: 'fecha_ingreso' },
  categorias:      { t: 'categorias',      nombre: 'nombre' },
  diagnosticos:    { t: 'diagnosticos',    recomendacion: 'recomendacion' },
  reparaciones:    { t: 'reparaciones',    equipo: 'id_equipo', costo: 'costo', ahorro: 'ahorro_estimado' },
  campanas:        { t: 'campanas',        nombre: 'nombre', inicio: 'fecha_inicio', fin: 'fecha_fin', ubicacion: 'ubicacion' },
  participaciones: { t: 'participaciones', campana: 'id_campana', equipos: 'cantidad_equipos' },
};

//------------------------------------------------ MODELO ------------------------------------------------
/**
 * Consultas agregadas (solo lectura) para el Módulo 5 — Indicadores y reportes.
 * Cada método es una consulta independiente; el controlador decide qué juntar.
 */
class IndicadorModel {
  // ---------- Equipos ----------
  static async totalEquipos() {
    const r = await pool.query(`SELECT COUNT(*) AS total FROM ${S.equipos.t}`);
    return r[0].total;
  }

  static async equiposPorCondicion() {
    const e = S.equipos;
    return pool.query(
      `SELECT COALESCE(${e.condicion}, 'sin_condicion') AS etiqueta, COUNT(*) AS total
       FROM ${e.t} GROUP BY etiqueta ORDER BY total DESC`
    );
  }

  static async equiposPorCategoria() {
    const e = S.equipos, c = S.categorias;
    return pool.query(
      `SELECT COALESCE(c.${c.nombre}, 'Sin categoría') AS etiqueta, COUNT(*) AS total
       FROM ${e.t} e LEFT JOIN ${c.t} c ON c.id = e.${e.categoria}
       GROUP BY etiqueta ORDER BY total DESC`
    );
  }

  /** Equipos registrados por mes en los últimos 12 meses. */
  static async equiposPorMes() {
    const e = S.equipos;
    return pool.query(
      `SELECT DATE_FORMAT(${e.fecha}, '%Y-%m') AS mes, COUNT(*) AS total
       FROM ${e.t}
       WHERE ${e.fecha} >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 11 MONTH), '%Y-%m-01')
       GROUP BY mes ORDER BY mes`
    );
  }

  // ---------- Diagnósticos y reparaciones ----------
  static async diagnosticosPorRecomendacion() {
    const d = S.diagnosticos;
    return pool.query(
      `SELECT COALESCE(${d.recomendacion}, 'sin_recomendacion') AS etiqueta, COUNT(*) AS total
       FROM ${d.t} GROUP BY etiqueta ORDER BY total DESC`
    );
  }

  static async resumenReparaciones() {
    const r = S.reparaciones;
    const rows = await pool.query(
      `SELECT COUNT(*) AS reparaciones,
              COUNT(DISTINCT ${r.equipo}) AS equipos_reparados,
              COALESCE(SUM(${r.costo}), 0)  AS costo_total,
              COALESCE(SUM(${r.ahorro}), 0) AS ahorro_estimado
       FROM ${r.t}`
    );
    return rows[0];
  }

  // ---------- Movimientos y gestores (tablas de este módulo) ----------
  static async movimientosPorTipo() {
    return pool.query(
      `SELECT tipo AS etiqueta, COUNT(*) AS total, COALESCE(SUM(validado), 0) AS validados
       FROM movimientos GROUP BY tipo ORDER BY total DESC`
    );
  }

  /** Equipos distintos reasignados (reutilizados) con movimiento validado. */
  static async reutilizados() {
    const rows = await pool.query(
      `SELECT COUNT(DISTINCT CASE WHEN validado = 1 THEN id_equipo END) AS validados,
              COUNT(DISTINCT CASE WHEN validado = 0 THEN id_equipo END) AS pendientes
       FROM movimientos WHERE tipo = 'reasignacion'`
    );
    return rows[0];
  }

  /**
   * Entregas a gestores. Solo cuenta como "documentada" si el movimiento está
   * validado Y el gestor está verificado; lo demás se reporta aparte como pendiente.
   */
  static async entregasGestores() {
    const rows = await pool.query(
      `SELECT
         COUNT(CASE WHEN m.validado = 1 AND g.verificado = 1 THEN 1 END)                 AS entregas_documentadas,
         COUNT(DISTINCT CASE WHEN m.validado = 1 AND g.verificado = 1 THEN m.id_equipo END) AS equipos_documentados,
         COALESCE(SUM(CASE WHEN m.validado = 1 AND g.verificado = 1 THEN m.cantidad_kg END), 0) AS kg_documentados,
         COUNT(CASE WHEN m.validado = 0 OR g.verificado = 0 THEN 1 END)                 AS entregas_pendientes,
         COALESCE(SUM(CASE WHEN m.validado = 0 OR g.verificado = 0 THEN m.cantidad_kg END), 0) AS kg_pendientes
       FROM movimientos m
       JOIN gestores g ON g.id = m.id_gestor
       WHERE m.tipo = 'entrega_gestor'`
    );
    return rows[0];
  }

  static async entregasPorGestor() {
    return pool.query(
      `SELECT g.id, g.nombre, g.tipo, g.verificado,
              COUNT(m.id) AS entregas,
              COALESCE(SUM(m.cantidad_kg), 0) AS kg,
              COALESCE(SUM(m.validado), 0) AS validadas
       FROM gestores g
       LEFT JOIN movimientos m ON m.id_gestor = g.id AND m.tipo = 'entrega_gestor'
       GROUP BY g.id, g.nombre, g.tipo, g.verificado
       ORDER BY kg DESC, g.nombre ASC`
    );
  }

  static async gestoresResumen() {
    const rows = await pool.query(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(verificado), 0) AS verificados,
              COALESCE(SUM(activo), 0) AS activos
       FROM gestores`
    );
    return rows[0];
  }

  // ---------- Campañas ----------
  static async campanasConParticipacion() {
    const c = S.campanas, p = S.participaciones;
    return pool.query(
      `SELECT c.id, c.${c.nombre} AS nombre, c.${c.inicio} AS fecha_inicio,
              c.${c.fin} AS fecha_fin, c.${c.ubicacion} AS ubicacion,
              COUNT(p.id) AS participaciones
       FROM ${c.t} c
       LEFT JOIN ${p.t} p ON p.${p.campana} = c.id
       GROUP BY c.id, c.${c.nombre}, c.${c.inicio}, c.${c.fin}, c.${c.ubicacion}
       ORDER BY c.${c.inicio} DESC`
    );
  }

  /** Equipos recibidos por campaña (si la tabla participaciones tiene esa columna). */
  static async equiposRecibidosPorCampana() {
    const p = S.participaciones;
    return pool.query(
      `SELECT ${p.campana} AS id_campana, COALESCE(SUM(${p.equipos}), 0) AS equipos_recibidos
       FROM ${p.t} GROUP BY ${p.campana}`
    );
  }
}

module.exports = IndicadorModel;
