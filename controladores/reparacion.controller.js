//------------------------------------------------ IMPORTS ------------------------------------------------
const ReparacionModel = require('../modelos/reparacion.model');

const ESTADOS = ['pendiente', 'en_proceso', 'completada'];

//------------------------------------------------ CONTROLADORES ------------------------------------------------
/**
 * GET /api/v1/reparaciones
 * (capturista, responsable, administrador)
 */
exports.listar = async (req, res) => {
  try {
    const reparaciones = await ReparacionModel.listar();
    return res.json(reparaciones);
  } catch (error) {
    console.error('Error listar reparaciones:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * GET /api/v1/reparaciones/:id
 */
exports.obtener = async (req, res) => {
  try {
    const reparacion = await ReparacionModel.obtener(req.params.id);
    if (!reparacion) {
      return res.status(404).json({ message: 'Reparación no encontrada' });
    }
    return res.json(reparacion);
  } catch (error) {
    console.error('Error obtener reparacion:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * GET /api/v1/reparaciones/diagnostico/:diagnosticoId
 * Reparaciones ligadas a un diagnóstico.
 */
exports.porDiagnostico = async (req, res) => {
  try {
    const reparaciones = await ReparacionModel.porDiagnostico(req.params.diagnosticoId);
    return res.json(reparaciones);
  } catch (error) {
    console.error('Error listar reparaciones por diagnostico:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * POST /api/v1/reparaciones
 * (responsable, administrador)
 * Body: { diagnostico_id, descripcion, fecha_inicio?, fecha_fin?, costo?, estado? }
 * El usuario_id se toma del token (quien registra la reparación).
 */
exports.crear = async (req, res) => {
  try {
    const { diagnostico_id, descripcion, fecha_inicio, fecha_fin, costo, estado } = req.body || {};

    // Validaciones básicas
    if (!diagnostico_id || !descripcion) {
      return res.status(400).json({
        message: 'Faltan campos obligatorios: diagnostico_id, descripcion',
      });
    }

    if (estado && !ESTADOS.includes(estado)) {
      return res.status(400).json({ message: 'Estado inválido (pendiente, en_proceso, completada)' });
    }

    if (costo !== undefined && (isNaN(Number(costo)) || Number(costo) < 0)) {
      return res.status(400).json({ message: 'El costo debe ser un número mayor o igual a 0' });
    }

    const id = await ReparacionModel.crear({
      diagnostico_id,
      usuario_id: req.user?.id_usuario ?? null, // viene del JWT
      fecha_inicio: fecha_inicio || null,
      fecha_fin: fecha_fin || null,
      descripcion,
      costo: costo ?? 0,
      estado: estado || 'pendiente',
    });

    return res.status(201).json({ id, message: 'Reparación creada' });
  } catch (error) {
    // FK inválida (diagnostico_id no existe)
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'El diagnóstico indicado no existe' });
    }
    console.error('Error crear reparacion:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * PUT /api/v1/reparaciones/:id
 * (responsable, administrador)
 * Body: { descripcion, fecha_inicio?, fecha_fin?, costo?, estado? }
 */
exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, fecha_inicio, fecha_fin, costo, estado } = req.body || {};

    if (!descripcion) {
      return res.status(400).json({ message: 'descripcion es obligatoria' });
    }

    if (estado && !ESTADOS.includes(estado)) {
      return res.status(400).json({ message: 'Estado inválido (pendiente, en_proceso, completada)' });
    }

    if (costo !== undefined && (isNaN(Number(costo)) || Number(costo) < 0)) {
      return res.status(400).json({ message: 'El costo debe ser un número mayor o igual a 0' });
    }

    const actualizado = await ReparacionModel.actualizar(id, {
      fecha_inicio: fecha_inicio || null,
      fecha_fin: fecha_fin || null,
      descripcion,
      costo: costo ?? 0,
      estado: estado || 'pendiente',
    });

    if (!actualizado) {
      return res.status(404).json({ message: 'Reparación no encontrada' });
    }

    return res.json({ message: 'Reparación actualizada' });
  } catch (error) {
    console.error('Error actualizar reparacion:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * DELETE /api/v1/reparaciones/:id
 * (solo administrador)
 */
exports.eliminar = async (req, res) => {
  try {
    const eliminado = await ReparacionModel.eliminar(req.params.id);
    if (!eliminado) {
      return res.status(404).json({ message: 'Reparación no encontrada' });
    }
    return res.json({ message: 'Reparación eliminada' });
  } catch (error) {
    console.error('Error eliminar reparacion:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};
