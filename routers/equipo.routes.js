// rutas/equipo.routes.js
const router = require('express').Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const { roleAuthorization }  = require('../middlewares/role.middleware');
const c = require('../controladores/equipo.controller');

const base = '/equipos';
const lectura = ['capturista', 'responsable', 'administrador'];
const escritura = ['capturista', 'responsable', 'administrador'];

router.get(   base,          authenticateToken, roleAuthorization(lectura),          c.listar);
router.get(`${base}/pendientes/count`, authenticateToken, roleAuthorization(lectura), c.contarPendientes);
router.get(   `${base}/:id`, authenticateToken, roleAuthorization(lectura),          c.obtener);
router.post(  base,          authenticateToken, roleAuthorization(escritura),        c.crear);
router.put(   `${base}/:id`, authenticateToken, roleAuthorization(escritura),        c.actualizar);
router.delete(`${base}/:id`, authenticateToken, roleAuthorization(['administrador']), c.eliminar);

module.exports = router;