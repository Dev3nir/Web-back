// rutas/diagnostico.routes.js
// Permisos (según mapa del documento "consideraciones web"):
//   GET     → capturista, responsable, administrador
//   POST/PUT→ responsable, administrador
//   DELETE  → administrador
const router = require('express').Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const { roleAuthorization }  = require('../middlewares/role.middleware');
const c = require('../controladores/diagnostico.controller');

const base = '/diagnosticos';
const lectura   = ['capturista', 'responsable', 'administrador'];
const escritura = ['responsable', 'administrador'];

// OJO: esta ruta va ANTES de /:id para que "equipo" no se confunda con un id
router.get(   `${base}/equipo/:equipoId`, authenticateToken, roleAuthorization(lectura), c.porEquipo);

router.get(   base,          authenticateToken, roleAuthorization(lectura),   c.listar);
router.get(   `${base}/:id`, authenticateToken, roleAuthorization(lectura),   c.obtener);
router.post(  base,          authenticateToken, roleAuthorization(escritura), c.crear);
router.put(   `${base}/:id`, authenticateToken, roleAuthorization(escritura), c.actualizar);
router.delete(`${base}/:id`, authenticateToken, roleAuthorization(['administrador']), c.eliminar);

module.exports = router;
