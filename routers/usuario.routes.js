const router = require('express').Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const { roleAuthorization }  = require('../middlewares/role.middleware');
const c = require('../controladores/usuario.controller');

const base = '/usuarios';
const soloAdmin = ['administrador'];

router.get(base,          authenticateToken, roleAuthorization(soloAdmin), c.listar);
router.get(`${base}/:id`, authenticateToken, roleAuthorization(soloAdmin), c.obtener);
router.post(base,         authenticateToken, roleAuthorization(soloAdmin), c.crear);
router.put(`${base}/:id`, authenticateToken, roleAuthorization(soloAdmin), c.actualizar);
router.put(`${base}/:id/password`, authenticateToken, roleAuthorization(soloAdmin), c.cambiarPassword);
router.delete(`${base}/:id`, authenticateToken, roleAuthorization(soloAdmin), c.eliminar);

router.put(`${base}/:id/desactivar`, authenticateToken, roleAuthorization(soloAdmin), c.desactivar);

module.exports = router;