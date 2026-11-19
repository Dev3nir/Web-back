//------------------------------------------------ IMPORTS ------------------------------------------------
const bcrypt = require('bcrypt');
const UsuarioModel = require('../modelos/usuario.model');

//------------------------------------------------ CONTROLADORES ------------------------------------------------
/**
 * GET /api/v1/usuarios
 * Lista todos los usuarios (solo admin).
 */
exports.listar = async (req, res) => {
  try {
    const usuarios = await UsuarioModel.listar();
    return res.json(usuarios);
  } catch (error) {
    console.error('Error listar usuarios:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * GET /api/v1/usuarios/:id
 */
exports.obtener = async (req, res) => {
  try {
    const usuario = await UsuarioModel.obtener(req.params.id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    return res.json(usuario);
  } catch (error) {
    console.error('Error obtener usuario:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * POST /api/v1/usuarios
 * Body: { nombre_usuario, nombre_completo, correo?, password, rol? }
 */
exports.crear = async (req, res) => {
  try {
    const { nombre_usuario, nombre_completo, correo, password, rol } = req.body || {};

    // Validaciones básicas
    if (!nombre_usuario || !nombre_completo || !password) {
      return res.status(400).json({
        message: 'Faltan campos obligatorios: nombre_usuario, nombre_completo, password',
      });
    }

    if (rol && !['capturista', 'responsable', 'administrador'].includes(rol)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }

    // ¿Duplicado?
    const existente = await UsuarioModel.porNombreUsuario(nombre_usuario);
    if (existente) {
      return res.status(409).json({ message: 'El nombre de usuario ya existe' });
    }

    // Hashear contraseña
    const password_hash = await bcrypt.hash(password, 10);

    const id = await UsuarioModel.crear({
      nombre_usuario,
      nombre_completo,
      correo: correo || null,
      password_hash,
      rol: rol || 'capturista',
      activo: 1,
    });

    return res.status(201).json({ id, message: 'Usuario creado' });
  } catch (error) {
    // Error de duplicado en correo (UNIQUE)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'El correo o usuario ya existe' });
    }
    console.error('Error crear usuario:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * PUT /api/v1/usuarios/:id
 * Body: { nombre_completo, correo?, rol?, activo? }
 */
exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_completo, correo, rol, activo } = req.body || {};

    if (!nombre_completo) {
      return res.status(400).json({ message: 'nombre_completo es obligatorio' });
    }

    if (rol && !['capturista', 'responsable', 'administrador'].includes(rol)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }

    const actualizado = await UsuarioModel.actualizar(id, {
      nombre_completo,
      correo: correo || null,
      rol: rol || 'capturista',
      activo: activo ?? 1,
    });

    if (!actualizado) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.json({ message: 'Usuario actualizado' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'El correo ya está en uso' });
    }
    console.error('Error actualizar usuario:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * DELETE /api/v1/usuarios/:id
 */
exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir que un admin se borre a sí mismo
    if (String(req.user?.id_usuario) === String(id)) {
      return res.status(400).json({ message: 'No puedes eliminar tu propio usuario' });
    }

    const eliminado = await UsuarioModel.eliminar(id);
    if (!eliminado) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    return res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    console.error('Error eliminar usuario:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * PUT /api/v1/usuarios/:id/desactivar
 */
exports.desactivar = async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir que un admin se borre a sí mismo
    if (String(req.user?.id_usuario) === String(id)) {
      return res.status(400).json({ message: 'No puedes desactivar tu propio usuario' });
    }

    const eliminado = await UsuarioModel.desactivar(id);
    if (!eliminado) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    return res.json({ message: 'Usuario desactivado' });
  } catch (error) {
    console.error('Error desactivar usuario:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * PUT /api/v1/usuarios/:id/password
 * Body: { password }
 * (Cambio de contraseña por admin)
 */
exports.cambiarPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body || {};

    if (!password || password.length < 6) {
      return res.status(400).json({
        message: 'La contraseña debe tener al menos 6 caracteres',
      });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const actualizado = await UsuarioModel.actualizarPassword(id, password_hash);

    if (!actualizado) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    return res.json({ message: 'Contraseña actualizada' });
  } catch (error) {
    console.error('Error cambiar password:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};