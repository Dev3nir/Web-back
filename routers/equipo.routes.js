// rutas/equipo.routes.js
const router = require('express').Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const { roleAuthorization }  = require('../middlewares/role.middleware');
const c = require('../controladores/equipo.controller');

const base = '/equipos';
const escritura = ['capturista','responsable','administrador'];

router.get(   base,          authenticateToken, c.listar);
router.get(   `${base}/:id`, authenticateToken, c.obtener);
router.post(  base,          authenticateToken, roleAuthorization(escritura), c.crear);
router.put(   `${base}/:id`, authenticateToken, roleAuthorization(escritura), c.actualizar);
router.delete(`${base}/:id`, authenticateToken, roleAuthorization(['administrador']), c.eliminar);

module.exports = router;