//------------------------------------------------ IMPORTS ------------------------------------------------
const MovimientoModel = require('../modelos/movimiento.model');
const EquipoModel = require('../modelos/equipo.model');
const GestorModel = require('../modelos/gestor.model');
const {
  obtenerEstrategia,
  tiposDisponibles,
  TIPOS_MOVIMIENTO,
} = require('../servicios/movimiento.strategies');

//------------------------------------------------ HELPERS ------------------------------------------------
const esIdValido = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

const textoOpcional = (v, max, nombre, errores) => {
  if (v === undefined) return undefined;
  const t = String(v ?? '').trim();
  if (t.length > max) errores.push(`${nombre} no puede pasar de ${max} caracteres`);
  return t || null;
};

/**
 * Limpia el body. Con `parcial` solo procesa lo que venga (para PUT).
 * Retorna { data, errores }.
 */
function limpiarMovimiento(body = {}, parcial = false) {
  const errores = [];
  const data = {};

  if (body.id_equipo !== undefined || !parcial) {
    if (!esIdValido(body.id_equipo)) errores.push('id_equipo es obligatorio y debe ser un número válido');
    else data.id_equipo = Number(body.id_equipo);
  }

  if (body.tipo !== undefined || !parcial) {
    const tipo = String(body.tipo ?? '').trim().toLowerCase();
    if (!TIPOS_MOVIMIENTO.includes(tipo)) {
      errores.push(`Tipo de movimiento inválido. Usa uno de: ${TIPOS_MOVIMIENTO.join(', ')}`);
    } else data.tipo = tipo;
  }

  if (body.fecha !== undefined && body.fecha !== null && body.fecha !== '') {
    const f = String(body.fecha).trim();
    const d = new Date(f.length === 10 ? `${f}T12:00:00` : f);
    if (!/^\d{4}-\d{2}-\d{2}/.test(f) || Number.isNaN(d.getTime())) {
      errores.push('La fecha debe tener formato AAAA-MM-DD');
    } else if (d.getTime() > Date.now() + 60 * 1000) {
      errores.push('La fecha no puede ser futura');
    } else {
      data.fecha = f.slice(0, 10);
    }
  }

  data.destino = textoOpcional(body.destino, 255, 'El destino', errores);
  data.evidencia = textoOpcional(body.evidencia, 255, 'La evidencia', errores);
  data.observaciones = textoOpcional(body.observaciones, 1000, 'Las observaciones', errores);

  if (body.id_gestor !== undefined) {
    if (body.id_gestor === null || body.id_gestor === '') data.id_gestor = null;
    else if (!esIdValido(body.id_gestor)) errores.push('id_gestor no es válido');
    else data.id_gestor = Number(body.id_gestor);
  }

  if (body.cantidad_kg !== undefined) {
    if (body.cantidad_kg === null || body.cantidad_kg === '') data.cantidad_kg = null;
    else {
      const kg = Number(body.cantidad_kg);
      if (!Number.isFinite(kg) || kg <= 0 || kg > 100000) {
        errores.push('cantidad_kg debe ser un número mayor a 0');
      } else data.cantidad_kg = Math.round(kg * 100) / 100;
    }
  }

  // quitar undefined para no pisar columnas en el UPDATE
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  return { data, errores };
}

/** Corre la estrategia del tipo (patrón Strategy) sobre el movimiento completo. */
async function aplicarReglas(mov) {
  const estrategia = obtenerEstrategia(mov.tipo);
  const ctx = {};
  if (mov.id_gestor) ctx.gestor = await GestorModel.obtener(mov.id_gestor);
  return estrategia.validar(mov, ctx);
}

const errorResp = (res, errores) =>
  res.status(400).json({ message: errores.join('. '), errores });

//------------------------------------------------ CONTROLADORES ------------------------------------------------
/** GET /api/v1/movimientos/tipos → [{ tipo, etiqueta }] para los selects del front */
exports.tipos = (req, res) => res.json(tiposDisponibles());

/**
 * GET /api/v1/movimientos?id_equipo=&tipo=&validado=0|1&desde=&hasta=
 * responsable, administrador
 */
exports.listar = async (req, res) => {
  try {
    const { id_equipo, tipo, validado, desde, hasta } = req.query;
    const filtros = {};

    if (id_equipo !== undefined && id_equipo !== '') {
      if (!esIdValido(id_equipo)) return res.status(400).json({ message: 'id_equipo inválido' });
      filtros.id_equipo = Number(id_equipo);
    }
    if (tipo) {
      if (!TIPOS_MOVIMIENTO.includes(tipo)) return res.status(400).json({ message: 'Tipo inválido' });
      filtros.tipo = tipo;
    }
    if (validado === '0' || validado === '1') filtros.validado = Number(validado);
    const fechaRe = /^\d{4}-\d{2}-\d{2}$/;
    if (desde) { if (!fechaRe.test(desde)) return res.status(400).json({ message: 'desde inválido' }); filtros.desde = desde; }
    if (hasta) { if (!fechaRe.test(hasta)) return res.status(400).json({ message: 'hasta inválido' }); filtros.hasta = hasta; }

    return res.json(await MovimientoModel.listar(filtros));
  } catch (error) {
    console.error('Error listar movimientos:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/** GET /api/v1/movimientos/equipo/:idEquipo → historial del equipo */
exports.historialEquipo = async (req, res) => {
  try {
    const { idEquipo } = req.params;
    if (!esIdValido(idEquipo)) return res.status(400).json({ message: 'id de equipo inválido' });
    return res.json(await MovimientoModel.historialEquipo(idEquipo));
  } catch (error) {
    console.error('Error historial equipo:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/** GET /api/v1/movimientos/:id */
exports.obtener = async (req, res) => {
  try {
    const mov = await MovimientoModel.obtener(req.params.id);
    if (!mov) return res.status(404).json({ message: 'Movimiento no encontrado' });
    return res.json(mov);
  } catch (error) {
    console.error('Error obtener movimiento:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * POST /api/v1/movimientos
 * Body: { id_equipo, tipo, fecha?, destino?, id_gestor?, cantidad_kg?, evidencia?, observaciones? }
 * El responsable se toma del token (no del body) → nadie registra a nombre de otro.
 */
exports.crear = async (req, res) => {
  try {
    const { data, errores } = limpiarMovimiento(req.body, false);
    if (errores.length) return errorResp(res, errores);

    const equipo = await EquipoModel.obtener(data.id_equipo);
    if (!equipo) return res.status(404).json({ message: 'El equipo indicado no existe' });

    const { errores: reglas, advertencias } = await aplicarReglas(data);
    if (reglas.length) return errorResp(res, reglas);

    const id = await MovimientoModel.crear({ ...data, id_responsable: req.user.id_usuario });
    return res.status(201).json({ id, message: 'Movimiento registrado', advertencias });
  } catch (error) {
    if (error.errno === 1452) {
      return res.status(400).json({ message: 'El equipo o el gestor indicado no existe' });
    }
    console.error('Error crear movimiento:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * PUT /api/v1/movimientos/:id
 * Solo mientras NO esté validado. El capturista solo puede editar los que él registró.
 */
exports.actualizar = async (req, res) => {
  try {
    const actual = await MovimientoModel.obtener(req.params.id);
    if (!actual) return res.status(404).json({ message: 'Movimiento no encontrado' });

    if (Number(actual.validado)) {
      return res.status(409).json({
        message: 'El movimiento ya fue validado y no se puede modificar (trazabilidad)',
      });
    }
    const rol = String(req.user.rol || '').toLowerCase();
    if (rol === 'capturista' && String(actual.id_responsable) !== String(req.user.id_usuario)) {
      return res.status(403).json({ message: 'Solo puedes editar los movimientos que registraste' });
    }

    const { data, errores } = limpiarMovimiento(req.body, true);
    if (errores.length) return errorResp(res, errores);

    if (data.id_equipo && data.id_equipo !== actual.id_equipo) {
      if (!(await EquipoModel.obtener(data.id_equipo))) {
        return res.status(404).json({ message: 'El equipo indicado no existe' });
      }
    }

    // Las reglas se aplican al movimiento ya combinado (lo que había + lo nuevo)
    const combinado = { ...actual, ...data };
    const { errores: reglas, advertencias } = await aplicarReglas(combinado);
    if (reglas.length) return errorResp(res, reglas);

    await MovimientoModel.actualizar(req.params.id, data);
    return res.json({ message: 'Movimiento actualizado', advertencias });
  } catch (error) {
    if (error.errno === 1452) {
      return res.status(400).json({ message: 'El equipo o el gestor indicado no existe' });
    }
    console.error('Error actualizar movimiento:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * PUT /api/v1/movimientos/:id/validar   (responsable, administrador)
 * Valida el movimiento. Una entrega a gestor solo se valida si el gestor está verificado.
 */
exports.validar = async (req, res) => {
  try {
    const mov = await MovimientoModel.obtener(req.params.id);
    if (!mov) return res.status(404).json({ message: 'Movimiento no encontrado' });
    if (Number(mov.validado)) return res.status(409).json({ message: 'El movimiento ya estaba validado' });

    if (mov.tipo === 'entrega_gestor' && !Number(mov.gestor_verificado)) {
      return res.status(409).json({
        message: 'No se puede validar: el gestor de esta entrega no está verificado',
      });
    }

    await MovimientoModel.validar(req.params.id, req.user.id_usuario);
    return res.json({ message: 'Movimiento validado' });
  } catch (error) {
    console.error('Error validar movimiento:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/** DELETE /api/v1/movimientos/:id  (administrador; no se borran los validados) */
exports.eliminar = async (req, res) => {
  try {
    const mov = await MovimientoModel.obtener(req.params.id);
    if (!mov) return res.status(404).json({ message: 'Movimiento no encontrado' });
    if (Number(mov.validado)) {
      return res.status(409).json({
        message: 'Un movimiento validado forma parte del historial y no se puede eliminar',
      });
    }
    await MovimientoModel.eliminar(req.params.id);
    return res.json({ message: 'Movimiento eliminado' });
  } catch (error) {
    console.error('Error eliminar movimiento:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};
