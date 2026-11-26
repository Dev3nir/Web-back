
const ParticipacionModel = require('../modelos/participacion.model');
const CampanaModel = require('../modelos/campana.model');

//------------------------------------------------ LISTAR PARTICIPACIONES ------------------------------------------------
exports.listar = async (req, res) => {
    try {
        const participaciones = await ParticipacionModel.listar();
        return res.status(200).json(participaciones);
    } catch (error) {
        console.error('Error al listar participaciones:', error);
        return res.status(500).json({
            message: 'Error al consultar las participaciones'
        });
    }
};

//------------------------------------------------ OBTENER PARTICIPACIÓN ------------------------------------------------
exports.obtener = async (req, res) => {
    try {
        const participacion = await ParticipacionModel.obtener(req.params.id);

        if (!participacion) {
            return res.status(404).json({
                message: 'Participación no encontrada'
            });
        }

        return res.status(200).json(participacion);
    } catch (error) {
        console.error('Error al obtener participación:', error);
        return res.status(500).json({
            message: 'Error al consultar la participación'
        });
    }
};

//------------------------------------------------ CREAR PARTICIPACIÓN ------------------------------------------------
exports.crear = async (req, res) => {
    try {
        const {
            campana_id,
            nombre_participante,
            correo
        } = req.body;

        if (!campana_id || !nombre_participante) {
            return res.status(400).json({
                message: 'El ID de campaña y el nombre del participante son obligatorios'
            });
        }

        if (!Number.isInteger(Number(campana_id)) || Number(campana_id) <= 0) {
            return res.status(400).json({
                message: 'El ID de campaña debe ser un número entero positivo'
            });
        }

        if (typeof nombre_participante !== 'string' || !nombre_participante.trim()) {
            return res.status(400).json({
                message: 'El nombre del participante no es válido'
            });
        }

        if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            return res.status(400).json({
                message: 'El correo electrónico no es válido'
            });
        }

        const campana = await CampanaModel.obtener(campana_id);

        if (!campana) {
            return res.status(404).json({
                message: 'La campaña indicada no existe'
            });
        }

        const id = await ParticipacionModel.crear({
            campana_id,
            usuario_id: req.user.id_usuario,
            nombre_participante: nombre_participante.trim(),
            correo
        });

        return res.status(201).json({
            message: 'Participación registrada correctamente',
            id
        });
    } catch (error) {
        console.error('Error al crear participación:', error);
        return res.status(500).json({
            message: 'Error al registrar la participación'
        });
    }
};

//------------------------------------------------ ACTUALIZAR PARTICIPACIÓN ------------------------------------------------
exports.actualizar = async (req, res) => {
    try {
        const id = req.params.id;

        const {
            campana_id,
            nombre_participante,
            correo
        } = req.body;

        if (!campana_id || !nombre_participante) {
            return res.status(400).json({
                message: 'El ID de campaña y el nombre del participante son obligatorios'
            });
        }

        if (!Number.isInteger(Number(campana_id)) || Number(campana_id) <= 0) {
            return res.status(400).json({
                message: 'El ID de campaña debe ser un número entero positivo'
            });
        }

        if (typeof nombre_participante !== 'string' || !nombre_participante.trim()) {
            return res.status(400).json({
                message: 'El nombre del participante no es válido'
            });
        }

        if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            return res.status(400).json({
                message: 'El correo electrónico no es válido'
            });
        }

        const existente = await ParticipacionModel.obtener(id);

        if (!existente) {
            return res.status(404).json({
                message: 'Participación no encontrada'
            });
        }

        const campana = await CampanaModel.obtener(campana_id);

        if (!campana) {
            return res.status(404).json({
                message: 'La campaña indicada no existe'
            });
        }

        await ParticipacionModel.actualizar(id, {
            campana_id,
            nombre_participante: nombre_participante.trim(),
            correo
        });

        return res.status(200).json({
            message: 'Participación actualizada correctamente'
        });
    } catch (error) {
        console.error('Error al actualizar participación:', error);
        return res.status(500).json({
            message: 'Error al actualizar la participación'
        });
    }
};

//------------------------------------------------ ELIMINAR PARTICIPACIÓN ------------------------------------------------
exports.eliminar = async (req, res) => {
    try {
        const id = req.params.id;

        const existente = await ParticipacionModel.obtener(id);

        if (!existente) {
            return res.status(404).json({
                message: 'Participación no encontrada'
            });
        }

        await ParticipacionModel.eliminar(id);

        return res.status(200).json({
            message: 'Participación eliminada correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar participación:', error);
        return res.status(500).json({
            message: 'Error al eliminar la participación'
        });
    }
};
