// controladores/equipo.controller.js
const EquipoModel = require('../modelos/equipo.model');

const CONDICIONES_VALIDAS = ['funcional', 'reparable', 'reutilizable', 'pendiente_gestion'];

exports.listar = async (req, res) => {
  try {
    const equipos = await EquipoModel.listar();
    res.json(equipos);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.contarPendientes = async (req, res) => {
  try {
    const total = await EquipoModel.contarPendientes();

    res.json({ total });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.obtener = async (req, res) => {
  try {
    const equipo = await EquipoModel.obtener(req.params.id);
    if (!equipo) {
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }
    res.json(equipo);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const { codigo, categoria_id, fecha_ingreso, condicion } = req.body;
    const registrado_por = req.user?.id_usuario || req.body.registrado_por;

    if (!codigo || !categoria_id || !fecha_ingreso) {
      return res.status(400).json({
        message: 'Faltan campos obligatorios: codigo, categoria_id y fecha_ingreso'
      });
    }

    if (!registrado_por) {
      return res.status(400).json({ message: 'No se pudo identificar el usuario que registra' });
    }

    if (condicion && !CONDICIONES_VALIDAS.includes(condicion)) {
      return res.status(400).json({
        message: `Condición inválida. Valores permitidos: ${CONDICIONES_VALIDAS.join(', ')}`
      });
    }

    const id = await EquipoModel.crear({ ...req.body, registrado_por });
    res.status(201).json({ id, message: 'Equipo creado correctamente' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ya existe un equipo con ese código' });
    }
    if (e.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'La categoría, campaña o usuario no existe' });
    }
    res.status(500).json({ message: e.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { codigo, categoria_id, fecha_ingreso, condicion } = req.body;

    if (!codigo || !categoria_id || !fecha_ingreso) {
      return res.status(400).json({
        message: 'Faltan campos obligatorios: codigo, categoria_id y fecha_ingreso'
      });
    }

    if (condicion && !CONDICIONES_VALIDAS.includes(condicion)) {
      return res.status(400).json({
        message: `Condición inválida. Valores permitidos: ${CONDICIONES_VALIDAS.join(', ')}`
      });
    }

    const actualizado = await EquipoModel.actualizar(req.params.id, req.body);
    if (!actualizado) {
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }

    res.json({ message: 'Equipo actualizado correctamente' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ya existe otro equipo con ese código' });
    }
    if (e.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'La categoría o campaña indicada no existe' });
    }
    res.status(500).json({ message: e.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const eliminado = await EquipoModel.eliminar(req.params.id);
    if (!eliminado) {
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }
    res.json({ message: 'Equipo eliminado correctamente' });
  } catch (e) {
    if (e.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        message: 'No se puede eliminar el equipo porque tiene diagnósticos, reparaciones o movimientos registrados'
      });
    }
    res.status(500).json({ message: e.message });
  }
};