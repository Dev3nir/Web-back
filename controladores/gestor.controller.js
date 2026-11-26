//------------------------------------------------ IMPORTS ------------------------------------------------
const GestorModel = require('../modelos/gestor.model');

//------------------------------------------------ CONSTANTES ------------------------------------------------
const TIPOS_GESTOR = ['reciclador', 'reacondicionador', 'centro_acopio', 'donataria', 'otro'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//------------------------------------------------ HELPERS ------------------------------------------------
/** Convierte true/false/"1"/"0"/1/0 a 1|0. Devuelve undefined si no viene. */
const aBit = (v) => {
  if (v === undefined || v === null || v === '') return undefined;
  if (v === true || v === 1 || v === '1' || v === 'true') return 1;
  if (v === false || v === 0 || v === '0' || v === 'false') return 0;
  return NaN; // valor inválido
};

const textoOpcional = (v) =>
  v === undefined ? undefined : (String(v ?? '').trim() || null);

/**
 * Limpia y valida el body. `parcial` = true para PUT (solo valida lo que llegue).
 * Retorna { data, errores }.
 */
function validarGestor(body = {}, parcial = false) {
  const errores = [];
  const data = {};

  // nombre
  if (body.nombre !== undefined || !parcial) {
    const nombre = String(body.nombre ?? '').trim();
    if (!nombre) errores.push('El nombre es obligatorio');
    else if (nombre.length > 150) errores.push('El nombre no puede pasar de 150 caracteres');
    data.nombre = nombre;
  }

  // tipo
  if (body.tipo !== undefined || !parcial) {
    const tipo = String(body.tipo ?? '').trim().toLowerCase();
    if (!TIPOS_GESTOR.includes(tipo)) {
      errores.push(`Tipo inválido. Usa uno de: ${TIPOS_GESTOR.join(', ')}`);
    }
    data.tipo = tipo;
  }

  // textos opcionales
  ['contacto', 'telefono', 'correo', 'direccion', 'materiales_aceptados', 'numero_autorizacion']
    .forEach((c) => {
      const v = textoOpcional(body[c]);
      if (v !== undefined) data[c] = v;
    });

  if (data.correo && !EMAIL_RE.test(data.correo)) errores.push('Correo no válido');
  if (data.telefono && !/^[0-9+\-\s()]{7,20}$/.test(data.telefono)) {
    errores.push('Teléfono no válido');
  }

  // banderas
  const verificado = aBit(body.verificado);
  const activo = aBit(body.activo);
  if (Number.isNaN(verificado)) errores.push('verificado debe ser 0 o 1');
  if (Number.isNaN(activo)) errores.push('activo debe ser 0 o 1');
  if (verificado !== undefined) data.verificado = verificado;
  if (activo !== undefined) data.activo = activo;

  // Regla ambiental: no se puede marcar como verificado sin número de autorización
  if (data.verificado === 1 && !data.numero_autorizacion && !parcial) {
    errores.push('Para marcar al gestor como verificado registra su número de autorización');
  }

  return { data, errores };
}

//------------------------------------------------ CONTROLADORES ------------------------------------------------
/**
 * GET /api/v1/gestores?activo=1&verificado=1&q=texto
 * Todos los autenticados.
 */
exports.listar = async (req, res) => {
  try {
    const activo = aBit(req.query.activo);
    const verificado = aBit(req.query.verificado);
    if (Number.isNaN(activo) || Number.isNaN(verificado)) {
      return res.status(400).json({ message: 'Filtros inválidos: usa 0 o 1' });
    }
    const gestores = await GestorModel.listar({
      activo,
      verificado,
      q: req.query.q ? String(req.query.q).trim() : undefined,
    });
    return res.json(gestores);
  } catch (error) {
    console.error('Error listar gestores:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/** GET /api/v1/gestores/:id */
exports.obtener = async (req, res) => {
  try {
    const gestor = await GestorModel.obtener(req.params.id);
    if (!gestor) return res.status(404).json({ message: 'Gestor no encontrado' });
    return res.json(gestor);
  } catch (error) {
    console.error('Error obtener gestor:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * POST /api/v1/gestores
 * Body: { nombre, tipo, contacto?, telefono?, correo?, direccion?,
 *         materiales_aceptados?, numero_autorizacion?, verificado? }
 */
exports.crear = async (req, res) => {
  try {
    const { data, errores } = validarGestor(req.body, false);
    if (errores.length) return res.status(400).json({ message: errores.join('. '), errores });

    if (await GestorModel.porNombre(data.nombre)) {
      return res.status(409).json({ message: 'Ya existe un gestor con ese nombre' });
    }

    const id = await GestorModel.crear(data);
    return res.status(201).json({ id, message: 'Gestor registrado' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ya existe un gestor con ese nombre' });
    }
    console.error('Error crear gestor:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/** PUT /api/v1/gestores/:id  (actualiza solo lo que se mande) */
exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const actual = await GestorModel.obtener(id);
    if (!actual) return res.status(404).json({ message: 'Gestor no encontrado' });

    const { data, errores } = validarGestor(req.body, true);

    // Regla: verificado = 1 exige número de autorización (el nuevo o el que ya tenía)
    const verificadoFinal = data.verificado ?? actual.verificado;
    const autorizacionFinal =
      data.numero_autorizacion !== undefined ? data.numero_autorizacion : actual.numero_autorizacion;
    if (Number(verificadoFinal) === 1 && !autorizacionFinal) {
      errores.push('Para marcar al gestor como verificado registra su número de autorización');
    }

    if (errores.length) return res.status(400).json({ message: errores.join('. '), errores });

    if (data.nombre && data.nombre.toLowerCase() !== String(actual.nombre).toLowerCase()) {
      const otro = await GestorModel.porNombre(data.nombre);
      if (otro && String(otro.id) !== String(id)) {
        return res.status(409).json({ message: 'Ya existe un gestor con ese nombre' });
      }
    }

    await GestorModel.actualizar(id, data);
    return res.json({ message: 'Gestor actualizado' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ya existe un gestor con ese nombre' });
    }
    console.error('Error actualizar gestor:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/** PUT /api/v1/gestores/:id/desactivar  (soft delete) */
exports.desactivar = async (req, res) => {
  try {
    const ok = await GestorModel.desactivar(req.params.id);
    if (!ok) return res.status(404).json({ message: 'Gestor no encontrado' });
    return res.json({ message: 'Gestor desactivado' });
  } catch (error) {
    console.error('Error desactivar gestor:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/** DELETE /api/v1/gestores/:id  (solo admin) */
exports.eliminar = async (req, res) => {
  try {
    const ok = await GestorModel.eliminar(req.params.id);
    if (!ok) return res.status(404).json({ message: 'Gestor no encontrado' });
    return res.json({ message: 'Gestor eliminado' });
  } catch (error) {
    // Tiene movimientos asociados → no se borra para no perder la trazabilidad
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
      return res.status(409).json({
        message: 'El gestor tiene entregas registradas. Desactívalo en lugar de eliminarlo.',
      });
    }
    console.error('Error eliminar gestor:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.TIPOS_GESTOR = TIPOS_GESTOR;
