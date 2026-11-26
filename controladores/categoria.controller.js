// controladores/categoria.controller.js
const CategoriaModel = require('../modelos/categoria.model');

exports.listar = async (req, res) => {
  try {
    const categorias = await CategoriaModel.listar();
    res.json(categorias);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.obtener = async (req, res) => {
  try {
    const categoria = await CategoriaModel.obtener(req.params.id);
    if (!categoria) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    res.json(categoria);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ message: 'El nombre de la categoría es obligatorio' });
    }

    const id = await CategoriaModel.crear(req.body);
    res.status(201).json({ id, message: 'Categoría creada correctamente' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ya existe una categoría con ese nombre' });
    }
    res.status(500).json({ message: e.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ message: 'El nombre de la categoría es obligatorio' });
    }

    const actualizado = await CategoriaModel.actualizar(req.params.id, req.body);
    if (!actualizado) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    res.json({ message: 'Categoría actualizada correctamente' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ya existe otra categoría con ese nombre' });
    }
    res.status(500).json({ message: e.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const eliminado = await CategoriaModel.eliminar(req.params.id);
    if (!eliminado) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (e) {
    if (e.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        message: 'No se puede eliminar la categoría porque tiene equipos asociados'
      });
    }
    res.status(500).json({ message: e.message });
  }
};