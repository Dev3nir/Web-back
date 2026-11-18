//------------------------------------------------ IMPORTS ------------------------------------------------
// (no requiere jwt: authenticateToken ya pobló req.user)
//------------------------------------------------ MIDDLEWARES ------------------------------------------------
/**
 * Autoriza según rol. Debe usarse DESPUÉS de authenticateToken.
 *
 * Uso:
 *   roleAuthorization(['administrador'])
 *   roleAuthorization('administrador')          // string también funciona
 *   roleAuthorization(['capturista','responsable','administrador'])
 *
 * Si el usuario no está autenticado → 401
 * Si el rol no está permitido       → 403
 * Si pasa                          → next()
 */
const roleAuthorization = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      // Defensa: si por error no se puso authenticateToken antes,
      // no dejamos pasar silenciosamente.
      return res.status(401).json({ message: 'No autenticado' });
    }

    const rolUsuario = String(req.user.rol || '').toLowerCase();
    const permitido = allowedRoles
      .map((r) => String(r).toLowerCase())
      .includes(rolUsuario);

    if (!permitido) {
      return res.status(403).json({
        message: 'Acceso denegado: rol no autorizado',
      });
    }

    next();
  };
};

module.exports = { roleAuthorization };