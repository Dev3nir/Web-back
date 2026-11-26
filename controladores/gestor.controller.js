//------------------------------------------------ IMPORTS ------------------------------------------------
const GestorModel = require('../modelos/gestor.model');

//------------------------------------------------ HELPERS ------------------------------------------------
const aBit = (v) => {
  if (v === undefined || v === null || v === '') return undefined;
  if (v === true || v === 1 || v === '1' || v === 'true') return 1;
  if (v === false || v === 0 || v === '0' || v === 'false') return 0;
  return NaN;
};

const textoOpcional = (v) =>
  v === undefined ? undefined : (String(v ?? '').trim() || null);

function validarGestor(body = {}, parcial = false) {
  const errores = [];
  const data = {};

  if (body.nombre !== undefined || !parcial) {
    const nombre = String(body.nombre ?? '').trim();
    if (!nombre) errores.push('El nombre es obligatorio');
    else if (nombre.length > 100) errores.push('El nombre no puede pasar de 100 caracteres');
    data.nombre = nombre;
  }

  ['contacto', 'telefono'].forEach((c) => {
    const v = textoOpcional(body[c]);
    if (v !== undefined) data[c] = v;
  });

  const activo = aBit(body.activo);
  if (Number.isNaN(activo)) errores.push('activo debe ser 0 o 1');
  if (activo !== undefined) data.activo = activo;

  return { data, errores };
}

//------------------------------------------------ CONTROLADORES ------------------------------------------------
/**
 * GET /gestores?activo=1&q=texto
 */
exports.listar = async (req, res) => {
  try {
    const activo = aBit(req.query.activo);
    if (Number.isNaN(activo)) {
      return res.status(400).json({ message: 'Filtro activo inválido: usa 0 o 1' });
    }
    const gestores = await GestorModel.listar({
      activo,
      q: req.query.q ? String(req.query.q).trim() : undefined,
    });
    return res.json(gestores);
  } catch (error) {
    console.error('Error listar gestores:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/** GET /gestores/:id */
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
 * POST /gestores
 * Body: { nombre, contacto?, telefono?, activo? }
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

/** PUT /gestores/:id (actualiza solo lo que se mande). */
exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const actual = await GestorModel.obtener(id);
    if (!actual) return res.status(404).json({ message: 'Gestor no encontrado' });

    const { data, errores } = validarGestor(req.body, true);
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

/** PUT /gestores/:id/desactivar (soft delete). */
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

/** DELETE /gestores/:id (solo admin). */
exports.eliminar = async (req, res) => {
  try {
    const ok = await GestorModel.eliminar(req.params.id);
    if (!ok) return res.status(404).json({ message: 'Gestor no encontrado' });
    return res.json({ message: 'Gestor eliminado' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
      return res.status(409).json({
        message: 'El gestor tiene entregas registradas. Desactívalo en lugar de eliminarlo.',
      });
    }
    console.error('Error eliminar gestor:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};