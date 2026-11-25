
const { buildSchema } = require('graphql');

const schema = buildSchema(`
    type Usuario {
        id: Int!
        nombre: String!
        email: String!
    }

    type Intercambio {
        id: Int!
        titulo: String!
        descripcion: String!
        fecha: String!
        tipo: String!
        idUsuario: Int!
        email: String!
    }

    type Seleccion {
        idUsuario: Int!
        idIntercambio: Int!
        fechaSeleccion: String!
    }

    type IntercambioSeleccionado {
        id: Int!
        titulo: String!
        descripcion: String!
        fecha: String!
        tipo: String!
        idUsuario: Int!
        email: String!
        fechaSeleccion: String!
    }

    input NuevoUsuarioInput {
        nombre: String!
        email: String!
        password: String!
    }

    input ActualizarUsuarioInput {
        nombre: String!
        email: String!
        password: String
    }

    input DatosIntercambioInput {
        titulo: String!
        descripcion: String!
        fecha: String!
        tipo: String!
        idUsuario: Int!
    }

    type Query {
        obtenerUsuarios: [Usuario!]!
        obtenerUsuarioPorEmail(email: String!): Usuario

        obtenerIntercambios: [Intercambio!]!
        obtenerIntercambiosPorUsuario(idUsuario: Int!): [Intercambio!]!
        obtenerIntercambioPorId(id: Int!): Intercambio

        obtenerSeleccionados(idUsuario: Int!): [IntercambioSeleccionado!]!
    }

    type Mutation {
        crearUsuario(datosUsuario: NuevoUsuarioInput!): Usuario!
        actualizarUsuario(id: Int!, datosUsuario: ActualizarUsuarioInput!): Usuario
        eliminarUsuario(id: Int!): Boolean!

        crearIntercambio(datosIntercambio: DatosIntercambioInput!): Intercambio!
        actualizarIntercambio(id: Int!, datosIntercambio: DatosIntercambioInput!): Intercambio
        eliminarIntercambio(id: Int!): Boolean!

        guardarSeleccion(idUsuario: Int!, idIntercambio: Int!): Seleccion!
        eliminarSeleccion(idUsuario: Int!, idIntercambio: Int!): Boolean!
    }
`);

module.exports = schema;
