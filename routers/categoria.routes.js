// routers/categoria.routes.js
const router = require('express').Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const { roleAuthorization } = require('../middlewares/role.middleware');
const c = require('../controladores/categoria.controller');

const base = '/categorias';
const admin = ['administrador'];

router.get(   base,          authenticateToken, roleAuthorization(admin), c.listar);
router.get(   `${base}/:id`, authenticateToken, roleAuthorization(admin), c.obtener);
router.post(  base,          authenticateToken, roleAuthorization(admin), c.crear);
router.put(   `${base}/:id`, authenticateToken, roleAuthorization(admin), c.actualizar);
router.delete(`${base}/:id`, authenticateToken, roleAuthorization(admin), c.eliminar);

module.exports = router;