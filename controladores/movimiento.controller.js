//------------------------------------------------ IMPORTS ------------------------------------------------
const MovimientoModel = require('../modelos/movimiento.model');
const EquipoModel = require('../modelos/equipo.model');
const GestorModel = require('../modelos/gestor.model');
const { obtenerEstrategia, tiposDisponibles, TIPOS_MOVIMIENTO } = require('../servicios/movimiento.strategies');


//------------------------------------------------ HELPERS ------------------------------------------------
const esIdValido = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

const textoOpcional = (v, max, nombre, errores) => {
  if (v === undefined) return undefined;
  const t = String(v ?? '').trim();
  if (t.length > max) errores.push(`${nombre} no puede pasar de ${max} caracteres`);
  return t || null;
};

/**
 * Limpia el body. `parcial` = true para PUT (solo valida lo que llegue).
 * Retorna { data, errores }.
 */
function limpiarMovimiento(body = {}, parcial = false) {
  const errores = [];
  const data = {};

  if (body.equipo_id !== undefined || !parcial) {
    if (!esIdValido(body.equipo_id)) errores.push('equipo_id es obligatorio y debe ser un número válido');
    else data.equipo_id = Number(body.equipo_id);
  }

  if (body.tipo !== undefined || !parcial) {
    const tipo = String(body.tipo ?? '').trim().toLowerCase();
    if (!TIPOS_MOVIMIENTO.includes(tipo)) {
      errores.push(`Tipo inválido. Usa: ${TIPOS_MOVIMIENTO.join(', ')}`);
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

  data.destino = textoOpcional(body.destino, 150, 'El destino', errores);
  data.observaciones = textoOpcional(body.observaciones, 255, 'Las observaciones', errores);

  if (body.gestor_id !== undefined) {
    if (body.gestor_id === null || body.gestor_id === '') data.gestor_id = null;
    else if (!esIdValido(body.gestor_id)) errores.push('gestor_id no es válido');
    else data.gestor_id = Number(body.gestor_id);
  }

  if (body.peso_kg !== undefined) {
    if (body.peso_kg === null || body.peso_kg === '') data.peso_kg = null;
    else {
      const kg = Number(body.peso_kg);
      if (!Number.isFinite(kg) || kg <= 0 || kg > 100000) {
        errores.push('peso_kg debe ser un número mayor a 0');
      } else data.peso_kg = Math.round(kg * 100) / 100;
    }
  }

  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  return { data, errores };
}

async function aplicarReglas(mov) {
  const estrategia = obtenerEstrategia(mov.tipo);
  if (!estrategia) return { errores: [`Tipo inválido: ${mov.tipo}`], advertencias: [] };
  const ctx = {};
  if (mov.gestor_id) ctx.gestor = await GestorModel.obtener(mov.gestor_id);
  return estrategia.validar(mov, ctx);
}

const errorResp = (res, errores) =>
  res.status(400).json({ message: errores.join('. '), errores });

//------------------------------------------------ CONTROLADORES ------------------------------------------------
/** GET /movimientos/tipos → [{ tipo, etiqueta }] para los selects del front. */
exports.tipos = (_req, res) => res.json(tiposDisponibles());

/**
 * GET /movimientos?equipo_id=&tipo=&desde=&hasta=
 */
exports.listar = async (req, res) => {
  try {
    const { equipo_id, tipo, desde, hasta } = req.query;
    const filtros = {};

    if (equipo_id !== undefined && equipo_id !== '') {
      if (!esIdValido(equipo_id)) return res.status(400).json({ message: 'equipo_id inválido' });
      filtros.equipo_id = Number(equipo_id);
    }
    if (tipo) {
      if (!TIPOS_MOVIMIENTO.includes(tipo)) return res.status(400).json({ message: 'Tipo inválido' });
      filtros.tipo = tipo;
    }
    const fechaRe = /^\d{4}-\d{2}-\d{2}$/;
    if (desde) { if (!fechaRe.test(desde)) return res.status(400).json({ message: 'desde inválido' }); filtros.desde = desde; }
    if (hasta) { if (!fechaRe.test(hasta)) return res.status(400).json({ message: 'hasta inválido' }); filtros.hasta = hasta; }

    return res.json(await MovimientoModel.listar(filtros));
  } catch (error) {
    console.error('Error listar movimientos:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/** GET /movimientos/equipo/:equipoId → historial del equipo. */
exports.historialEquipo = async (req, res) => {
  try {
    const { equipoId } = req.params;
    if (!esIdValido(equipoId)) return res.status(400).json({ message: 'id de equipo inválido' });
    return res.json(await MovimientoModel.historialEquipo(equipoId));
  } catch (error) {
    console.error('Error historial equipo:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/** GET /movimientos/:id */
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
 * POST /movimientos
 * Body: { equipo_id, tipo, fecha?, destino?, gestor_id?, peso_kg?, observaciones? }
 * responsable_id sale del token.
 */
exports.crear = async (req, res) => {
  try {
    const { data, errores } = limpiarMovimiento(req.body, false);
    if (errores.length) return errorResp(res, errores);

    const equipo = await EquipoModel.obtener(data.equipo_id);
    if (!equipo) return res.status(404).json({ message: 'El equipo indicado no existe' });

    const { errores: reglas } = await aplicarReglas(data);
    if (reglas.length) return errorResp(res, reglas);

    const id = await MovimientoModel.crear({
      ...data,
      responsable_id: req.user.id_usuario,
    });

    return res.status(201).json({ id, message: 'Movimiento registrado' });
  } catch (error) {
    if (error.errno === 1452) {
      return res.status(400).json({ message: 'El equipo o el gestor indicado no existe' });
    }
    console.error('Error crear movimiento:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * PUT /movimientos/:id
 * Capturista solo puede editar los que él registró.
 */
exports.actualizar = async (req, res) => {
  try {
    const actual = await MovimientoModel.obtener(req.params.id);
    if (!actual) return res.status(404).json({ message: 'Movimiento no encontrado' });

    const rol = String(req.user.rol || '').toLowerCase();
    if (rol === 'capturista' && String(actual.responsable_id) !== String(req.user.id_usuario)) {
      return res.status(403).json({ message: 'Solo puedes editar los movimientos que registraste' });
    }

    const { data, errores } = limpiarMovimiento(req.body, true);
    if (errores.length) return errorResp(res, errores);

    if (data.equipo_id && data.equipo_id !== actual.equipo_id) {
      if (!(await EquipoModel.obtener(data.equipo_id))) {
        return res.status(404).json({ message: 'El equipo indicado no existe' });
      }
    }

    const combinado = { ...actual, ...data };
    const { errores: reglas } = await aplicarReglas(combinado);
    if (reglas.length) return errorResp(res, reglas);

    await MovimientoModel.actualizar(req.params.id, data);
    return res.json({ message: 'Movimiento actualizado' });
  } catch (error) {
    if (error.errno === 1452) {
      return res.status(400).json({ message: 'El equipo o el gestor indicado no existe' });
    }
    console.error('Error actualizar movimiento:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/** DELETE /movimientos/:id (administrador). */
exports.eliminar = async (req, res) => {
  try {
    const mov = await MovimientoModel.obtener(req.params.id);
    if (!mov) return res.status(404).json({ message: 'Movimiento no encontrado' });
    await MovimientoModel.eliminar(req.params.id);
    return res.json({ message: 'Movimiento eliminado' });
  } catch (error) {
    console.error('Error eliminar movimiento:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};