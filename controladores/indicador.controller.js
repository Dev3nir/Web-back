//------------------------------------------------ IMPORTS ------------------------------------------------
const IndicadorModel = require('../modelos/indicador.model');

//------------------------------------------------ HELPERS ------------------------------------------------
// Campos de texto que NO deben convertirse a número
const CAMPOS_TEXTO = new Set(['etiqueta', 'nombre', 'mes', 'tipo', 'ubicacion', 'fecha_inicio', 'fecha_fin', 'estado']);

/** MariaDB devuelve COUNT como BigInt y SUM(decimal) como string → todo a Number. */
function numerizar(valor) {
  if (Array.isArray(valor)) return valor.map(numerizar);
  if (valor && typeof valor === 'object' && !(valor instanceof Date)) {
    const out = {};
    for (const [k, v] of Object.entries(valor)) {
      if (typeof v === 'bigint') out[k] = Number(v);
      else if (typeof v === 'string' && !CAMPOS_TEXTO.has(k) && /^-?\d+(\.\d+)?$/.test(v)) out[k] = Number(v);
      else out[k] = v;
    }
    return out;
  }
  return typeof valor === 'bigint' ? Number(valor) : valor;
}

/**
 * Ejecuta una consulta y, si falla (p. ej. la tabla de otro módulo aún no existe),
 * devuelve null y agrega un aviso en vez de tumbar todo el reporte.
 */
async function seguro(fn, descripcion, avisos) {
  try {
    return numerizar(await fn());
  } catch (error) {
    console.error(`Indicador "${descripcion}" falló:`, error.message);
    avisos.push(`No se pudo calcular: ${descripcion}`);
    return null;
  }
}

function estadoCampana(inicio, fin) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const i = inicio ? new Date(inicio) : null;
  const f = fin ? new Date(fin) : null;
  if (i && hoy < i) return 'proxima';
  if (f && hoy > f) return 'finalizada';
  return 'activa';
}

//------------------------------------------------ CONTROLADORES ------------------------------------------------
/**
 * GET /api/v1/indicadores
 * Totales de equipos por estado/condición, por categoría y por mes,
 * más el resumen rápido de reutilización, entregas y campañas.
 */
exports.resumen = async (req, res) => {
  try {
    const avisos = [];
    const [total, porCondicion, porCategoria, porMes, reparaciones, reutilizados, entregas, campanas] =
      await Promise.all([
        seguro(() => IndicadorModel.totalEquipos(), 'total de equipos', avisos),
        seguro(() => IndicadorModel.equiposPorCondicion(), 'equipos por condición', avisos),
        seguro(() => IndicadorModel.equiposPorCategoria(), 'equipos por categoría', avisos),
        seguro(() => IndicadorModel.equiposPorMes(), 'equipos registrados por mes', avisos),
        seguro(() => IndicadorModel.resumenReparaciones(), 'reparaciones y costos', avisos),
        seguro(() => IndicadorModel.reutilizados(), 'equipos reutilizados', avisos),
        seguro(() => IndicadorModel.entregasGestores(), 'entregas a gestores', avisos),
        seguro(() => IndicadorModel.campanasConParticipacion(), 'participación en campañas', avisos),
      ]);

    const listaCampanas = campanas || [];
    return res.json({
      generado_en: new Date().toISOString(),
      equipos: { total, por_condicion: porCondicion, por_categoria: porCategoria, por_mes: porMes },
      reparaciones,
      reutilizados,
      entregas,
      campanas: campanas && {
        total: listaCampanas.length,
        activas: listaCampanas.filter((c) => estadoCampana(c.fecha_inicio, c.fecha_fin) === 'activa').length,
        participaciones: listaCampanas.reduce((s, c) => s + (c.participaciones || 0), 0),
      },
      avisos,
    });
  } catch (error) {
    console.error('Error indicadores resumen:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * GET /api/v1/indicadores/campanas
 * Resultados por campaña: participaciones y equipos recibidos.
 */
exports.campanas = async (req, res) => {
  try {
    const avisos = [];
    const lista = await seguro(() => IndicadorModel.campanasConParticipacion(), 'resultados por campaña', avisos);
    // La columna de equipos recibidos es opcional: si no existe, solo se omite
    const recibidos = await seguro(() => IndicadorModel.equiposRecibidosPorCampana(), 'equipos recibidos por campaña', []);
    const mapa = new Map((recibidos || []).map((r) => [String(r.id_campana), r.equipos_recibidos]));

    const campanas = (lista || []).map((c) => ({
      ...c,
      estado: estadoCampana(c.fecha_inicio, c.fecha_fin),
      equipos_recibidos: recibidos ? (mapa.get(String(c.id)) ?? 0) : null,
    }));

    return res.json({ generado_en: new Date().toISOString(), campanas, avisos });
  } catch (error) {
    console.error('Error indicadores campañas:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * GET /api/v1/indicadores/reutilizacion
 * Métricas de reparación, reutilización, diagnósticos, movimientos y gestores.
 */
exports.reutilizacion = async (req, res) => {
  try {
    const avisos = [];
    const [reparaciones, reutilizados, diagnosticos, movimientos, entregas, porGestor, gestores] =
      await Promise.all([
        seguro(() => IndicadorModel.resumenReparaciones(), 'reparaciones y costos', avisos),
        seguro(() => IndicadorModel.reutilizados(), 'equipos reutilizados', avisos),
        seguro(() => IndicadorModel.diagnosticosPorRecomendacion(), 'diagnósticos por recomendación', avisos),
        seguro(() => IndicadorModel.movimientosPorTipo(), 'movimientos por tipo', avisos),
        seguro(() => IndicadorModel.entregasGestores(), 'entregas a gestores', avisos),
        seguro(() => IndicadorModel.entregasPorGestor(), 'entregas por gestor', avisos),
        seguro(() => IndicadorModel.gestoresResumen(), 'resumen de gestores', avisos),
      ]);

    return res.json({
      generado_en: new Date().toISOString(),
      reparaciones,
      reutilizados,
      diagnosticos_por_recomendacion: diagnosticos,
      movimientos_por_tipo: movimientos,
      entregas,
      entregas_por_gestor: porGestor,
      gestores,
      avisos,
    });
  } catch (error) {
    console.error('Error indicadores reutilización:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// exportado para pruebas
exports._helpers = { numerizar, estadoCampana };
