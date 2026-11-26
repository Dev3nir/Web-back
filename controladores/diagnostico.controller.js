//------------------------------------------------ IMPORTS ------------------------------------------------
const DiagnosticoModel = require('../modelos/diagnostico.model');

const RECOMENDACIONES = ['reparar', 'reutilizar', 'conservar', 'gestion_especializada'];

//------------------------------------------------ CONTROLADORES ------------------------------------------------
exports.listar = async (req, res) => {
  try {
    return res.json(await DiagnosticoModel.listar());
  } catch (error) {
    console.error('Error listar diagnosticos:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.obtener = async (req, res) => {
  try {
    const d = await DiagnosticoModel.obtener(req.params.id);
    if (!d) return res.status(404).json({ message: 'Diagnóstico no encontrado' });
    return res.json(d);
  } catch (error) {
    console.error('Error obtener diagnostico:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.porEquipo = async (req, res) => {
  try {
    return res.json(await DiagnosticoModel.porEquipo(req.params.equipoId));
  } catch (error) {
    console.error('Error listar diagnosticos por equipo:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * POST /diagnosticos
 * Body: { equipo_id, diagnostico, recomendacion }
 * responsable_id viene del JWT.
 */
exports.crear = async (req, res) => {
  try {
    const { equipo_id, diagnostico, recomendacion } = req.body || {};

    if (!equipo_id || !diagnostico) {
      return res.status(400).json({
        message: 'Faltan campos obligatorios: equipo_id, diagnostico',
      });
    }

    if (recomendacion && !RECOMENDACIONES.includes(recomendacion)) {
      return res.status(400).json({
        message: `Recomendación inválida. Valores: ${RECOMENDACIONES.join(', ')}`,
      });
    }

    const id = await DiagnosticoModel.crear({
      equipo_id,
      diagnostico,
      recomendacion: recomendacion || 'reparar',
      responsable_id: req.user?.id_usuario ?? null,
    });

    return res.status(201).json({ id, message: 'Diagnóstico creado' });
  } catch (error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'El equipo indicado no existe' });
    }
    console.error('Error crear diagnostico:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * PUT /diagnosticos/:id
 * Body: { diagnostico, recomendacion }
 */
exports.actualizar = async (req, res) => {
  try {
    const { diagnostico, recomendacion } = req.body || {};

    if (!diagnostico) {
      return res.status(400).json({ message: 'diagnostico es obligatorio' });
    }

    if (recomendacion && !RECOMENDACIONES.includes(recomendacion)) {
      return res.status(400).json({
        message: `Recomendación inválida. Valores: ${RECOMENDACIONES.join(', ')}`,
      });
    }

    const ok = await DiagnosticoModel.actualizar(req.params.id, {
      diagnostico,
      recomendacion: recomendacion || 'reparar',
    });

    if (!ok) return res.status(404).json({ message: 'Diagnóstico no encontrado' });
    return res.json({ message: 'Diagnóstico actualizado' });
  } catch (error) {
    console.error('Error actualizar diagnostico:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const ok = await DiagnosticoModel.eliminar(req.params.id);
    if (!ok) return res.status(404).json({ message: 'Diagnóstico no encontrado' });
    return res.json({ message: 'Diagnóstico eliminado' });
  } catch (error) {
    // FK: reparaciones con ON DELETE SET NULL → no debería fallar, pero por si acaso
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        message: 'No se puede eliminar: el diagnóstico tiene reparaciones asociadas',
      });
    }
    console.error('Error eliminar diagnostico:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};