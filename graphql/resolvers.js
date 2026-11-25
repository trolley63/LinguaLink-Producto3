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
 * Adapta l'execució d'un controlador Express perquè pugui utilitzar-se
 * des d'un resolver GraphQL sense fer una petició HTTP REST.
 *
 * Simula els objectes req i res amb els mètodes que utilitzen
 * els controladors del projecte.
 *
 * @param {Function} controlador Controlador Express que s'executarà.
 * @param {Object} [peticion={}] Dades de la petició simulada.
 * @param {Object} [peticion.params={}] Paràmetres de la petició.
 * @param {Object} [peticion.body={}] Dades del cos de la petició.
 * @returns {*} Dades enviades pel controlador mitjançant res.json().
 * @throws {GraphQLError} Si el controlador respon amb un codi HTTP igual o superior a 400.
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

/**
 * Resolvers de les consultes i mutacions de LinguaLink.
 *
 * Connecten les operacions definides en l'esquema GraphQL
 * amb els controladors d'usuaris, intercanvis i seleccions.
 *
 * @type {Object}
 */
const resolvers = {
    /**
     * Consulta tots els usuaris registrats.
     *
     * @returns {Array<{id: number, nombre: string, email: string}>}
     * Llista d'usuaris amb les seves dades públiques.
     * @throws {GraphQLError} Si el controlador respon amb un codi HTTP d'error.
     */
    obtenerUsuarios: () => {
        return ejecutarControlador(consultarUsuarios);
    },

    /**
     * Consulta un usuari mitjançant el seu correu electrònic.
     *
     * @param {Object} args Arguments de la consulta GraphQL.
     * @param {string} args.email Correu electrònic de l'usuari.
     * @returns {{id: number, nombre: string, email: string}|null}
     * Dades públiques de l'usuari o null si no existeix.
     * @throws {Error} Si no s'indica un correu electrònic.
     */
    obtenerUsuarioPorEmail: ({ email }) => {
        return obtenerUsuarioPorEmail(email);
    },

    /**
     * Consulta tots els intercanvis publicats.
     *
     * @returns {Array<{id: number, titulo: string, descripcion: string, fecha: string, tipo: string, idUsuario: number, email: string}>}
     * Llista d'intercanvis.
     * @throws {GraphQLError} Si el controlador respon amb un codi HTTP d'error.
     */
    obtenerIntercambios: () => {
        return ejecutarControlador(consultarIntercambios);
    },

    /**
     * Consulta els intercanvis associats a un usuari.
     *
     * @param {Object} args Arguments de la consulta GraphQL.
     * @param {number} args.idUsuario Identificador de l'usuari.
     * @returns {Array<Object>} Intercanvis publicats per l'usuari.
     * @throws {GraphQLError} Si l'identificador de l'usuari no és vàlid.
     */
    obtenerIntercambiosPorUsuario: ({ idUsuario }) => {
        return ejecutarControlador(consultarIntercambiosPorUsuario, {
            params: { idUsuario }
        });
    },

    /**
     * Consulta un intercanvi mitjançant el seu identificador.
     *
     * @param {Object} args Arguments de la consulta GraphQL.
     * @param {number} args.id Identificador de l'intercanvi.
     * @returns {Object} Intercanvi trobat.
     * @throws {GraphQLError} Si l'identificador no és vàlid o l'intercanvi no existeix.
     */
    obtenerIntercambioPorId: ({ id }) => {
        return ejecutarControlador(consultarIntercambioPorId, {
            params: { id }
        });
    },

    /**
     * Consulta els intercanvis seleccionats per un usuari,
     * incloent-hi la data en què es va fer cada selecció.
     *
     * @param {Object} args Arguments de la consulta GraphQL.
     * @param {number} args.idUsuario Identificador de l'usuari.
     * @returns {Array<Object>} Intercanvis seleccionats amb el camp fechaSeleccion.
     * @throws {GraphQLError} Si l'identificador de l'usuari no és vàlid.
     */
    obtenerSeleccionados: ({ idUsuario }) => {
        return ejecutarControlador(consultarSeleccionados, {
            params: { idUsuario }
        });
    },

    /**
     * Registra un usuari nou.
     *
     * @param {Object} args Arguments de la mutació GraphQL.
     * @param {Object} args.datosUsuario Dades de l'usuari que es crearà.
     * @param {string} args.datosUsuario.nombre Nom de l'usuari.
     * @param {string} args.datosUsuario.email Correu electrònic.
     * @param {string} args.datosUsuario.password Contrasenya.
     * @returns {Object} Dades públiques de l'usuari creat.
     * @throws {GraphQLError} Si les dades no són vàlides o el correu electrònic ja existeix.
     */
    crearUsuario: ({ datosUsuario }) => {
        return ejecutarControlador(crearUsuarioExpress, {
            body: datosUsuario
        });
    },

    /**
     * Actualitza les dades d'un usuari existent.
     * La contrasenya només es modifica si se'n proporciona una de nova.
     *
     * @param {Object} args Arguments de la mutació GraphQL.
     * @param {number} args.id Identificador de l'usuari.
     * @param {Object} args.datosUsuario Noves dades de l'usuari.
     * @param {string} args.datosUsuario.nombre Nou nom de l'usuari.
     * @param {string} args.datosUsuario.email Nou correu electrònic.
     * @param {string} [args.datosUsuario.password] Nova contrasenya opcional.
     * @returns {Object} Dades públiques de l'usuari actualitzat.
     * @throws {GraphQLError} Si l'usuari no existeix o les dades no són vàlides.
     */
    actualizarUsuario: ({ id, datosUsuario }) => {
        return ejecutarControlador(actualizarUsuarioExpress, {
            params: { id },
            body: datosUsuario
        });
    },

    /**
     * Elimina un usuari i els seus intercanvis i seleccions relacionades.
     *
     * @param {Object} args Arguments de la mutació GraphQL.
     * @param {number} args.id Identificador de l'usuari que s'eliminarà.
     * @returns {boolean} true si l'eliminació s'ha realitzat correctament.
     * @throws {GraphQLError} Si l'usuari no existeix o l'identificador no és vàlid.
     */
    eliminarUsuario: ({ id }) => {
        ejecutarControlador(eliminarUsuarioExpress, {
            params: { id }
        });

        return true;
    },

    /**
     * Crea un intercanvi associat a un usuari existent.
     *
     * @param {Object} args Arguments de la mutació GraphQL.
     * @param {Object} args.datosIntercambio Dades de l'intercanvi.
     * @param {string} args.datosIntercambio.titulo Títol de la publicació.
     * @param {string} args.datosIntercambio.descripcion Descripció.
     * @param {string} args.datosIntercambio.fecha Data de publicació.
     * @param {string} args.datosIntercambio.tipo Tipus d'intercanvi.
     * @param {number} args.datosIntercambio.idUsuario Identificador de l'usuari.
     * @returns {Object} Intercanvi creat.
     * @throws {GraphQLError} Si les dades no són vàlides o l'usuari no existeix.
     */
    crearIntercambio: ({ datosIntercambio }) => {
        return ejecutarControlador(crearIntercambioExpress, {
            body: datosIntercambio
        });
    },

    /**
     * Actualitza un intercanvi existent.
     *
     * @param {Object} args Arguments de la mutació GraphQL.
     * @param {number} args.id Identificador de l'intercanvi.
     * @param {Object} args.datosIntercambio Noves dades de l'intercanvi.
     * @param {string} args.datosIntercambio.titulo Nou títol.
     * @param {string} args.datosIntercambio.descripcion Nova descripció.
     * @param {string} args.datosIntercambio.fecha Nova data.
     * @param {string} args.datosIntercambio.tipo Nou tipus d'intercanvi.
     * @param {number} args.datosIntercambio.idUsuario Identificador de l'usuari.
     * @returns {Object} Intercanvi actualitzat.
     * @throws {GraphQLError} Si l'intercanvi no existeix o les dades no són vàlides.
     */
    actualizarIntercambio: ({ id, datosIntercambio }) => {
        return ejecutarControlador(actualizarIntercambioExpress, {
            params: { id },
            body: datosIntercambio
        });
    },

    /**
     * Elimina un intercanvi i les seleccions relacionades.
     *
     * @param {Object} args Arguments de la mutació GraphQL.
     * @param {number} args.id Identificador de l'intercanvi.
     * @returns {boolean} true si l'eliminació s'ha realitzat correctament.
     * @throws {GraphQLError} Si l'intercanvi no existeix o l'identificador no és vàlid.
     */
    eliminarIntercambio: ({ id }) => {
        ejecutarControlador(eliminarIntercambioExpress, {
            params: { id }
        });

        return true;
    },

    /**
     * Guarda o actualitza la selecció d'un intercanvi per part d'un usuari.
     *
     * @param {Object} args Arguments de la mutació GraphQL.
     * @param {number} args.idUsuario Identificador de l'usuari.
     * @param {number} args.idIntercambio Identificador de l'intercanvi.
     * @returns {Object} Selecció guardada amb la seva data.
     * @throws {GraphQLError} Si no existeix l'usuari o l'intercanvi, o algun identificador no és vàlid.
     */
    guardarSeleccion: ({ idUsuario, idIntercambio }) => {
        return ejecutarControlador(guardarSeleccionExpress, {
            params: { idUsuario, idIntercambio }
        });
    },

    /**
     * Elimina una selecció concreta d'un usuari.
     *
     * @param {Object} args Arguments de la mutació GraphQL.
     * @param {number} args.idUsuario Identificador de l'usuari.
     * @param {number} args.idIntercambio Identificador de l'intercanvi.
     * @returns {boolean} true si la selecció s'elimina correctament.
     * @throws {GraphQLError} Si la selecció no existeix o els identificadors no són vàlids.
     */
    eliminarSeleccion: ({ idUsuario, idIntercambio }) => {
        return ejecutarControlador(eliminarSeleccionExpress, {
            params: { idUsuario, idIntercambio }
        });
    }
};

module.exports = resolvers;