//------------------------------------------------ IMPORTS ------------------------------------------------
const DiagnosticoModel = require('../modelos/diagnostico.model');

const PRIORIDADES = ['baja', 'media', 'alta'];
const ESTADOS = ['pendiente', 'en_proceso', 'resuelto'];

//------------------------------------------------ CONTROLADORES ------------------------------------------------
/**
 * GET /api/v1/diagnosticos
 * (capturista, responsable, administrador)
 */
exports.listar = async (req, res) => {
  try {
    const diagnosticos = await DiagnosticoModel.listar();
    return res.json(diagnosticos);
  } catch (error) {
    console.error('Error listar diagnosticos:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * GET /api/v1/diagnosticos/:id
 */
exports.obtener = async (req, res) => {
  try {
    const diagnostico = await DiagnosticoModel.obtener(req.params.id);
    if (!diagnostico) {
      return res.status(404).json({ message: 'Diagnóstico no encontrado' });
    }
    return res.json(diagnostico);
  } catch (error) {
    console.error('Error obtener diagnostico:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * GET /api/v1/diagnosticos/equipo/:equipoId
 * Historial de diagnósticos de un equipo.
 */
exports.porEquipo = async (req, res) => {
  try {
    const diagnosticos = await DiagnosticoModel.porEquipo(req.params.equipoId);
    return res.json(diagnosticos);
  } catch (error) {
    console.error('Error listar diagnosticos por equipo:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * POST /api/v1/diagnosticos
 * (responsable, administrador)
 * Body: { equipo_id, descripcion, prioridad?, estado?, observaciones? }
 * El usuario_id se toma del token (quien registra el diagnóstico).
 */
exports.crear = async (req, res) => {
  try {
    const { equipo_id, descripcion, prioridad, estado, observaciones } = req.body || {};

    // Validaciones básicas
    if (!equipo_id || !descripcion) {
      return res.status(400).json({
        message: 'Faltan campos obligatorios: equipo_id, descripcion',
      });
    }

    if (prioridad && !PRIORIDADES.includes(prioridad)) {
      return res.status(400).json({ message: 'Prioridad inválida (baja, media, alta)' });
    }

    if (estado && !ESTADOS.includes(estado)) {
      return res.status(400).json({ message: 'Estado inválido (pendiente, en_proceso, resuelto)' });
    }

    const id = await DiagnosticoModel.crear({
      equipo_id,
      usuario_id: req.user?.id_usuario ?? null, // viene del JWT
      descripcion,
      prioridad: prioridad || 'media',
      estado: estado || 'pendiente',
      observaciones: observaciones || null,
    });

    return res.status(201).json({ id, message: 'Diagnóstico creado' });
  } catch (error) {
    // FK inválida (equipo_id no existe)
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'El equipo indicado no existe' });
    }
    console.error('Error crear diagnostico:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * PUT /api/v1/diagnosticos/:id
 * (responsable, administrador)
 * Body: { descripcion, prioridad?, estado?, observaciones? }
 */
exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, prioridad, estado, observaciones } = req.body || {};

    if (!descripcion) {
      return res.status(400).json({ message: 'descripcion es obligatoria' });
    }

    if (prioridad && !PRIORIDADES.includes(prioridad)) {
      return res.status(400).json({ message: 'Prioridad inválida (baja, media, alta)' });
    }

    if (estado && !ESTADOS.includes(estado)) {
      return res.status(400).json({ message: 'Estado inválido (pendiente, en_proceso, resuelto)' });
    }

    const actualizado = await DiagnosticoModel.actualizar(id, {
      descripcion,
      prioridad: prioridad || 'media',
      estado: estado || 'pendiente',
      observaciones: observaciones || null,
    });

    if (!actualizado) {
      return res.status(404).json({ message: 'Diagnóstico no encontrado' });
    }

    return res.json({ message: 'Diagnóstico actualizado' });
  } catch (error) {
    console.error('Error actualizar diagnostico:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * DELETE /api/v1/diagnosticos/:id
 * (solo administrador)
 */
exports.eliminar = async (req, res) => {
  try {
    const eliminado = await DiagnosticoModel.eliminar(req.params.id);
    if (!eliminado) {
      return res.status(404).json({ message: 'Diagnóstico no encontrado' });
    }
    return res.json({ message: 'Diagnóstico eliminado' });
  } catch (error) {
    // Si tiene reparaciones ligadas (FK), avisar en vez de tronar
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        message: 'No se puede eliminar: el diagnóstico tiene reparaciones asociadas',
      });
    }
    console.error('Error eliminar diagnostico:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};
