//------------------------------------------------ IMPORTS ------------------------------------------------
const router = require('express').Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const { roleAuthorization }  = require('../middlewares/role.middleware');
const c = require('../controladores/movimiento.controller');

//------------------------------------------------ RUTAS ------------------------------------------------
// Permisos (doc de consideraciones):
//   GET          → responsable, administrador
//   POST / PUT   → capturista, responsable, administrador
//   DELETE       → administrador
// Extra: validar un movimiento → responsable, administrador
const base = '/movimientos';
const lectura   = ['responsable', 'administrador'];
const escritura = ['capturista', 'responsable', 'administrador'];
const soloAdmin = ['administrador'];

// OJO: /tipos y /equipo/:idEquipo van ANTES de /:id para que no los confunda con un id
router.get(`${base}/tipos`,             authenticateToken, c.tipos);
router.get(`${base}/equipo/:idEquipo`,  authenticateToken, roleAuthorization(lectura), c.historialEquipo);
router.get(base,                        authenticateToken, roleAuthorization(lectura), c.listar);
router.get(`${base}/:id`,               authenticateToken, roleAuthorization(lectura), c.obtener);
router.post(base,                       authenticateToken, roleAuthorization(escritura), c.crear);
router.put(`${base}/:id`,               authenticateToken, roleAuthorization(escritura), c.actualizar);
router.delete(`${base}/:id`,            authenticateToken, roleAuthorization(soloAdmin), c.eliminar);

module.exports = router;
