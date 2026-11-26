//------------------------------------------------ IMPORTS ------------------------------------------------
const router = require('express').Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const { roleAuthorization }  = require('../middlewares/role.middleware');
const c = require('../controladores/indicador.controller');

//------------------------------------------------ RUTAS ------------------------------------------------
// Servicio web 2 — API de indicadores (Módulo 5). Solo lectura.
// Consultar reportes: responsable ambiental y administrador.
const base = '/indicadores';
const lectura = ['responsable', 'administrador'];

router.get(base,                    authenticateToken, roleAuthorization(lectura), c.resumen);
router.get(`${base}/campanas`,      authenticateToken, roleAuthorization(lectura), c.campanas);
router.get(`${base}/reutilizacion`, authenticateToken, roleAuthorization(lectura), c.reutilizacion);

module.exports = router;
