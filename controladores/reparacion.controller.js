//------------------------------------------------ IMPORTS ------------------------------------------------
const ReparacionModel = require('../modelos/reparacion.model');

//------------------------------------------------ CONTROLADORES ------------------------------------------------
exports.listar = async (req, res) => {
  try {
    return res.json(await ReparacionModel.listar());
  } catch (error) {
    console.error('Error listar reparaciones:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.obtener = async (req, res) => {
  try {
    const r = await ReparacionModel.obtener(req.params.id);
    if (!r) return res.status(404).json({ message: 'Reparación no encontrada' });
    return res.json(r);
  } catch (error) {
    console.error('Error obtener reparacion:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.porDiagnostico = async (req, res) => {
  try {
    return res.json(await ReparacionModel.porDiagnostico(req.params.diagnosticoId));
  } catch (error) {
    console.error('Error listar reparaciones por diagnostico:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * POST /reparaciones
 * Body: { equipo_id, diagnostico_id?, descripcion, costo?, ahorro_estimado?, fecha }
 * responsable_id viene del JWT.
 */
exports.crear = async (req, res) => {
  try {
    const {
      equipo_id,
      diagnostico_id,
      descripcion,
      costo,
      ahorro_estimado,
      fecha,
    } = req.body || {};

    if (!equipo_id || !descripcion || !fecha) {
      return res.status(400).json({
        message: 'Faltan campos obligatorios: equipo_id, descripcion, fecha',
      });
    }

    if (costo !== undefined && (isNaN(Number(costo)) || Number(costo) < 0)) {
      return res.status(400).json({ message: 'El costo debe ser un número >= 0' });
    }

    if (ahorro_estimado !== undefined && (isNaN(Number(ahorro_estimado)) || Number(ahorro_estimado) < 0)) {
      return res.status(400).json({ message: 'El ahorro estimado debe ser un número >= 0' });
    }

    const id = await ReparacionModel.crear({
      equipo_id,
      diagnostico_id: diagnostico_id ?? null,
      descripcion,
      costo: costo ?? 0,
      ahorro_estimado: ahorro_estimado ?? 0,
      fecha,
      responsable_id: req.user?.id_usuario ?? null,
    });

    return res.status(201).json({ id, message: 'Reparación creada' });
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        message: 'El equipo o el diagnóstico indicado no existe',
      });
    }
    console.error('Error crear reparacion:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * PUT /reparaciones/:id
 * Body: { diagnostico_id?, descripcion, costo?, ahorro_estimado?, fecha }
 */
exports.actualizar = async (req, res) => {
  try {
    const {
      diagnostico_id,
      descripcion,
      costo,
      ahorro_estimado,
      fecha,
    } = req.body || {};

    if (!descripcion || !fecha) {
      return res.status(400).json({
        message: 'descripcion y fecha son obligatorias',
      });
    }

    if (costo !== undefined && (isNaN(Number(costo)) || Number(costo) < 0)) {
      return res.status(400).json({ message: 'El costo debe ser un número >= 0' });
    }

    if (ahorro_estimado !== undefined && (isNaN(Number(ahorro_estimado)) || Number(ahorro_estimado) < 0)) {
      return res.status(400).json({ message: 'El ahorro estimado debe ser un número >= 0' });
    }

    const ok = await ReparacionModel.actualizar(req.params.id, {
      diagnostico_id: diagnostico_id ?? null,
      descripcion,
      costo: costo ?? 0,
      ahorro_estimado: ahorro_estimado ?? 0,
      fecha,
    });

    if (!ok) return res.status(404).json({ message: 'Reparación no encontrada' });
    return res.json({ message: 'Reparación actualizada' });
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'El diagnóstico indicado no existe' });
    }
    console.error('Error actualizar reparacion:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const ok = await ReparacionModel.eliminar(req.params.id);
    if (!ok) return res.status(404).json({ message: 'Reparación no encontrada' });
    return res.json({ message: 'Reparación eliminada' });
  } catch (error) {
    console.error('Error eliminar reparacion:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};