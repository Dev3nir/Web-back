// controladores/equipo.controller.js
const EquipoModel = require('../modelos/equipo.model');
exports.listar = async (req, res) => { try { res.json(await EquipoModel.listar()); } catch(e){ res.status(500).json({message:e.message}); } };
exports.obtener = async (req, res) => { try { const e = await EquipoModel.obtener(req.params.id); e ? res.json(e) : res.status(404).json({message:'No encontrado'}); } catch(e){ res.status(500).json({message:e.message}); } };
exports.crear = async (req, res) => { try { res.status(201).json({ id: await EquipoModel.crear(req.body) }); } catch(e){ res.status(500).json({message:e.message}); } };
exports.actualizar = async (req, res) => { /* TODO */ res.status(501).json({message:'No implementado'}); };
exports.eliminar   = async (req, res) => { /* TODO */ res.status(501).json({message:'No implementado'}); };