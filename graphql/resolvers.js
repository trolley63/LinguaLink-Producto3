
const { GraphQLError } = require('graphql');

const {
    obtenerUsuarios: consultarUsuarios,
    obtenerUsuarioPorEmail,
    crearUsuario: crearUsuarioExpress,
    actualizarUsuario: actualizarUsuarioExpress,
    eliminarUsuario: eliminarUsuarioExpress
} = require('../controllers/usuariosController');

const {
    obtenerIntercambios: consultarIntercambios,
    obtenerIntercambiosPorUsuario: consultarIntercambiosPorUsuario,
    obtenerIntercambioPorId: consultarIntercambioPorId,
    crearIntercambio: crearIntercambioExpress,
    actualizarIntercambio: actualizarIntercambioExpress,
    eliminarIntercambio: eliminarIntercambioExpress
} = require('../controllers/intercambiosController');

const {
    guardarSeleccion: guardarSeleccionExpress,
    obtenerSeleccionados: consultarSeleccionados,
    eliminarSeleccion: eliminarSeleccionExpress
} = require('../controllers/seleccionesController');

/**
 * Adapta la resposta d'un controlador Express
 * perquè pugui ser utilitzada per GraphQL.
 * @param {Function} controlador
 * @param {Object} peticion
 * @returns {*}
 */
function ejecutarControlador(controlador, peticion = {}) {
    let estado = 200;
    let respuesta;

    const req = {
        params: peticion.params ?? {},
        body: peticion.body ?? {}
    };

    const res = {
        status(codigo) {
            estado = codigo;
            return this;
        },
        json(datos) {
            respuesta = datos;
            return datos;
        }
    };

    controlador(req, res);

    if (estado >= 400) {
        throw new GraphQLError(
            respuesta?.error ?? 'Se ha producido un error en la operación.'
        );
    }

    return respuesta;
}

const resolvers = {
    obtenerUsuarios: () => {
        return ejecutarControlador(consultarUsuarios);
    },

    obtenerUsuarioPorEmail: ({ email }) => {
        return obtenerUsuarioPorEmail(email);
    },

    obtenerIntercambios: () => {
        return ejecutarControlador(consultarIntercambios);
    },

    obtenerIntercambiosPorUsuario: ({ idUsuario }) => {
        return ejecutarControlador(consultarIntercambiosPorUsuario, {
            params: { idUsuario }
        });
    },

    obtenerIntercambioPorId: ({ id }) => {
        return ejecutarControlador(consultarIntercambioPorId, {
            params: { id }
        });
    },

    obtenerSeleccionados: ({ idUsuario }) => {
        return ejecutarControlador(consultarSeleccionados, {
            params: { idUsuario }
        });
    },

    crearUsuario: ({ datosUsuario }) => {
        return ejecutarControlador(crearUsuarioExpress, {
            body: datosUsuario
        });
    },

    actualizarUsuario: ({ id, datosUsuario }) => {
        return ejecutarControlador(actualizarUsuarioExpress, {
            params: { id },
            body: datosUsuario
        });
    },

    eliminarUsuario: ({ id }) => {
        ejecutarControlador(eliminarUsuarioExpress, {
            params: { id }
        });

        return true;
    },

    crearIntercambio: ({ datosIntercambio }) => {
        return ejecutarControlador(crearIntercambioExpress, {
            body: datosIntercambio
        });
    },

    actualizarIntercambio: ({ id, datosIntercambio }) => {
        return ejecutarControlador(actualizarIntercambioExpress, {
            params: { id },
            body: datosIntercambio
        });
    },

    eliminarIntercambio: ({ id }) => {
        ejecutarControlador(eliminarIntercambioExpress, {
            params: { id }
        });

        return true;
    },

    guardarSeleccion: ({ idUsuario, idIntercambio }) => {
        return ejecutarControlador(guardarSeleccionExpress, {
            params: { idUsuario, idIntercambio }
        });
    },

    eliminarSeleccion: ({ idUsuario, idIntercambio }) => {
        return ejecutarControlador(eliminarSeleccionExpress, {
            params: { idUsuario, idIntercambio }
        });
    }
};

module.exports = resolvers;
