//------------------------------------------------ IMPORTS ------------------------------------------------
const router = require('express').Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const { roleAuthorization }  = require('../middlewares/role.middleware');
const c = require('../controladores/gestor.controller');

//------------------------------------------------ RUTAS ------------------------------------------------
// Permisos (doc de consideraciones):
//   GET          → todos los autenticados
//   POST / PUT   → responsable, administrador
//   DELETE       → administrador
const base = '/gestores';
const escritura = ['responsable', 'administrador'];
const soloAdmin = ['administrador'];

router.get(base,          authenticateToken, c.listar);
router.get(`${base}/:id`, authenticateToken, c.obtener);
router.post(base,         authenticateToken, roleAuthorization(escritura), c.crear);
router.put(`${base}/:id`, authenticateToken, roleAuthorization(escritura), c.actualizar);
router.put(`${base}/:id/desactivar`, authenticateToken, roleAuthorization(escritura), c.desactivar);
router.delete(`${base}/:id`, authenticateToken, roleAuthorization(soloAdmin), c.eliminar);

module.exports = router;
