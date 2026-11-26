// rutas/reparacion.routes.js
// Permisos (según mapa del documento "consideraciones web"):
//   GET     → capturista, responsable, administrador
//   POST/PUT→ responsable, administrador
//   DELETE  → administrador
const router = require('express').Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const { roleAuthorization }  = require('../middlewares/role.middleware');
const c = require('../controladores/reparacion.controller');

const base = '/reparaciones';
const lectura   = ['capturista', 'responsable', 'administrador'];
const escritura = ['responsable', 'administrador'];

// OJO: esta ruta va ANTES de /:id para que "diagnostico" no se confunda con un id
router.get(   `${base}/diagnostico/:diagnosticoId`, authenticateToken, roleAuthorization(lectura), c.porDiagnostico);

router.get(   base,          authenticateToken, roleAuthorization(lectura),   c.listar);
router.get(   `${base}/:id`, authenticateToken, roleAuthorization(lectura),   c.obtener);
router.post(  base,          authenticateToken, roleAuthorization(escritura), c.crear);
router.put(   `${base}/:id`, authenticateToken, roleAuthorization(escritura), c.actualizar);
router.delete(`${base}/:id`, authenticateToken, roleAuthorization(['administrador']), c.eliminar);

module.exports = router;
