
const router = require('express').Router();

const { authenticateToken } = require('../middlewares/auth.middleware');
const { roleAuthorization } = require('../middlewares/role.middleware');

const c = require('../controladores/campana.controller');

const base = '/campanas';

// Roles autorizados
const escritura = ['responsable', 'administrador'];

//------------------------------------------------ CONSULTAS PÚBLICAS ------------------------------------------------

// Listar todas las campañas (público)
router.get(base, c.listar);

// Obtener una campaña por ID (público)
router.get(`${base}/:id`, c.obtener);

//------------------------------------------------ OPERACIONES PROTEGIDAS ------------------------------------------------

// Crear campaña
router.post(
    base,
    authenticateToken,
    roleAuthorization(escritura),
    c.crear
);

// Actualizar campaña
router.put(
    `${base}/:id`,
    authenticateToken,
    roleAuthorization(escritura),
    c.actualizar
);

// Eliminar campaña (solo administrador)
router.delete(
    `${base}/:id`,
    authenticateToken,
    roleAuthorization(['administrador']),
    c.eliminar
);

module.exports = router;
