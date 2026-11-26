
const CampanaModel = require('../modelos/campana.model');

//------------------------------------------------ LISTAR CAMPAÑAS ------------------------------------------------
exports.listar = async (req, res) => {
    try {
        const campanas = await CampanaModel.listar();
        return res.status(200).json(campanas);
    } catch (error) {
        console.error('Error al listar campañas:', error);
        return res.status(500).json({ message: 'Error al consultar las campañas' });
    }
};

//------------------------------------------------ OBTENER CAMPAÑA ------------------------------------------------
exports.obtener = async (req, res) => {
    try {
        const campana = await CampanaModel.obtener(req.params.id);

        if (!campana) {
            return res.status(404).json({ message: 'Campaña no encontrada' });
        }

        return res.status(200).json(campana);
    } catch (error) {
        console.error('Error al obtener campaña:', error);
        return res.status(500).json({ message: 'Error al consultar la campaña' });
    }
};

//------------------------------------------------ CREAR CAMPAÑA ------------------------------------------------
exports.crear = async (req, res) => {
    try {
        const {
            nombre,
            descripcion,
            fecha_inicio,
            fecha_fin,
            ubicacion,
            tipos_aceptados,
            estado
        } = req.body;

        if (!nombre || !fecha_inicio || !fecha_fin || !ubicacion) {
            return res.status(400).json({
                message: 'Nombre, fecha de inicio, fecha de fin y ubicación son obligatorios'
            });
        }

        if (fecha_fin < fecha_inicio) {
            return res.status(400).json({
                message: 'La fecha de fin no puede ser anterior a la fecha de inicio'
            });
        }

        const estadosPermitidos = ['borrador', 'publicada', 'finalizada', 'cancelada'];

        if (estado && !estadosPermitidos.includes(estado)) {
            return res.status(400).json({ message: 'Estado de campaña no válido' });
        }

        const id = await CampanaModel.crear({
            nombre,
            descripcion,
            fecha_inicio,
            fecha_fin,
            ubicacion,
            tipos_aceptados,
            estado,
            creado_por: req.user.id_usuario
        });

        return res.status(201).json({
            message: 'Campaña creada correctamente',
            id
        });
    } catch (error) {
        console.error('Error al crear campaña:', error);
        return res.status(500).json({ message: 'Error al crear la campaña' });
    }
};

//------------------------------------------------ ACTUALIZAR CAMPAÑA ------------------------------------------------
exports.actualizar = async (req, res) => {
    try {
        const id = req.params.id;

        const {
            nombre,
            descripcion,
            fecha_inicio,
            fecha_fin,
            ubicacion,
            tipos_aceptados,
            estado
        } = req.body;

        if (!nombre || !fecha_inicio || !fecha_fin || !ubicacion || !estado) {
            return res.status(400).json({
                message: 'Nombre, fechas, ubicación y estado son obligatorios'
            });
        }

        if (fecha_fin < fecha_inicio) {
            return res.status(400).json({
                message: 'La fecha de fin no puede ser anterior a la fecha de inicio'
            });
        }

        const estadosPermitidos = ['borrador', 'publicada', 'finalizada', 'cancelada'];

        if (!estadosPermitidos.includes(estado)) {
            return res.status(400).json({ message: 'Estado de campaña no válido' });
        }

        const existente = await CampanaModel.obtener(id);

        if (!existente) {
            return res.status(404).json({ message: 'Campaña no encontrada' });
        }

        await CampanaModel.actualizar(id, {
            nombre,
            descripcion,
            fecha_inicio,
            fecha_fin,
            ubicacion,
            tipos_aceptados,
            estado
        });

        return res.status(200).json({ message: 'Campaña actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar campaña:', error);
        return res.status(500).json({ message: 'Error al actualizar la campaña' });
    }
};

//------------------------------------------------ ELIMINAR CAMPAÑA ------------------------------------------------
exports.eliminar = async (req, res) => {
    try {
        const id = req.params.id;

        const existente = await CampanaModel.obtener(id);

        if (!existente) {
            return res.status(404).json({ message: 'Campaña no encontrada' });
        }

        await CampanaModel.eliminar(id);

        return res.status(200).json({ message: 'Campaña eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar campaña:', error);
        return res.status(500).json({ message: 'Error al eliminar la campaña' });
    }
};
