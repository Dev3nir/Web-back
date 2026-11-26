
const router = require('express').Router();

const { authenticateToken } = require('../middlewares/auth.middleware');
const { roleAuthorization } = require('../middlewares/role.middleware');

const c = require('../controladores/participacion.controller');

const base = '/participaciones';

// Roles autorizados para registrar y modificar
const escritura = ['capturista', 'responsable', 'administrador'];

//------------------------------------------------ CONSULTAS ------------------------------------------------

// Listar participaciones (responsable y administrador)
router.get(
    base,
    authenticateToken,
    roleAuthorization(['responsable', 'administrador']),
    c.listar
);

// Consultar participación por ID (responsable y administrador)
router.get(
    `${base}/:id`,
    authenticateToken,
    roleAuthorization(['responsable', 'administrador']),
    c.obtener
);

//------------------------------------------------ ESCRITURA ------------------------------------------------

// Registrar participación
router.post(
    base,
    authenticateToken,
    roleAuthorization(escritura),
    c.crear
);

// Actualizar participación
router.put(
    `${base}/:id`,
    authenticateToken,
    roleAuthorization(escritura),
    c.actualizar
);

// Eliminar participación (solo administrador)
router.delete(
    `${base}/:id`,
    authenticateToken,
    roleAuthorization(['administrador']),
    c.eliminar
);

module.exports = router;
