const { buildSchema } = require('graphql');

const schema = buildSchema(`
    """
    Dades públiques d'un usuari de LinguaLink.
    Les credencials de contrasenya no formen part de l'objecte exposat per GraphQL.
    """
    type Usuario {
        """Identificador únic de l'usuari."""
        id: Int!

        """Nom de l'usuari."""
        nombre: String!

        """Correu electrònic de l'usuari."""
        email: String!
    }

    """
    Dades d'un intercanvi d'idiomes publicat per un usuari.
    """
    type Intercambio {
        """Identificador únic de l'intercanvi."""
        id: Int!

        """Títol de l'intercanvi."""
        titulo: String!

        """Descripció de l'intercanvi."""
        descripcion: String!

        """Data de l'intercanvi."""
        fecha: String!

        """Tipus d'intercanvi: Ofrezco idioma o Busco idioma."""
        tipo: String!

        """Identificador de l'usuari que ha publicat l'intercanvi."""
        idUsuario: Int!

        """Correu electrònic de l'usuari associat a l'intercanvi."""
        email: String!
    }

    """
    Dades d'una selecció d'un intercanvi feta per un usuari.
    """
    type Seleccion {
        """Identificador de l'usuari que ha fet la selecció."""
        idUsuario: Int!

        """Identificador de l'intercanvi seleccionat."""
        idIntercambio: Int!

        """Data i hora en què s'ha guardat o actualitzat la selecció."""
        fechaSeleccion: String!
    }

    """
    Resultat de consultar les seleccions d'un usuari.
    Conté les dades de l'intercanvi i la data en què es va seleccionar.
    """
    type IntercambioSeleccionado {
        """Identificador únic de l'intercanvi."""
        id: Int!

        """Títol de l'intercanvi."""
        titulo: String!

        """Descripció de l'intercanvi."""
        descripcion: String!

        """Data de l'intercanvi."""
        fecha: String!

        """Tipus d'intercanvi."""
        tipo: String!

        """Identificador de l'usuari que ha publicat l'intercanvi."""
        idUsuario: Int!

        """Correu electrònic de l'usuari associat a l'intercanvi."""
        email: String!

        """Data i hora en què l'usuari ha seleccionat l'intercanvi."""
        fechaSeleccion: String!
    }

    """
    Dades necessàries per crear un usuari.
    """
    input NuevoUsuarioInput {
        """Nom de l'usuari."""
        nombre: String!

        """Correu electrònic de l'usuari."""
        email: String!

        """Contrasenya proporcionada per generar les credencials protegides de l'usuari."""
        password: String!
    }

    """
    Dades necessàries per actualitzar un usuari.
    El nom i el correu electrònic són obligatoris; la contrasenya és opcional.
    """
    input ActualizarUsuarioInput {
        """Nou nom de l'usuari."""
        nombre: String!

        """Nou correu electrònic de l'usuari."""
        email: String!

        """Nova contrasenya. Si no s'indica, es conserva l'actual."""
        password: String
    }

    """
    Dades necessàries per crear o actualitzar un intercanvi.
    El correu electrònic s'obté de l'usuari associat.
    """
    input DatosIntercambioInput {
        """Títol de l'intercanvi."""
        titulo: String!

        """Descripció de l'intercanvi."""
        descripcion: String!

        """Data de l'intercanvi."""
        fecha: String!

        """Tipus d'intercanvi: Ofrezco idioma o Busco idioma."""
        tipo: String!

        """Identificador de l'usuari propietari de l'intercanvi."""
        idUsuario: Int!
    }

    """
    Consultes disponibles per obtenir informació dels usuaris,
    els intercanvis i les seleccions.
    """
    type Query {
        """Retorna la llista de tots els usuaris amb les seves dades públiques."""
        obtenerUsuarios: [Usuario!]!

        """
        Busca un usuari pel seu correu electrònic.
        Retorna null si no existeix cap usuari amb aquest correu.
        """
        obtenerUsuarioPorEmail(
            """Correu electrònic de l'usuari que es vol consultar."""
            email: String!
        ): Usuario

        """Retorna la llista de tots els intercanvis."""
        obtenerIntercambios: [Intercambio!]!

        """Retorna els intercanvis publicats per un usuari concret."""
        obtenerIntercambiosPorUsuario(
            """Identificador de l'usuari."""
            idUsuario: Int!
        ): [Intercambio!]!

        """
        Busca un intercanvi pel seu identificador.
        Retorna null si no existeix.
        """
        obtenerIntercambioPorId(
            """Identificador de l'intercanvi."""
            id: Int!
        ): Intercambio

        """
        Retorna els intercanvis seleccionats per un usuari,
        incorporant la data de cada selecció.
        """
        obtenerSeleccionados(
            """Identificador de l'usuari."""
            idUsuario: Int!
        ): [IntercambioSeleccionado!]!
    }

    """
    Operacions disponibles per crear, actualitzar i eliminar
    usuaris, intercanvis i seleccions.
    """
    type Mutation {
        """Crea un usuari nou i retorna les seves dades públiques."""
        crearUsuario(
            """Dades necessàries per crear l'usuari."""
            datosUsuario: NuevoUsuarioInput!
        ): Usuario!

        """
        Actualitza les dades d'un usuari existent.
        Retorna les dades públiques actualitzades.
        """
        actualizarUsuario(
            """Identificador de l'usuari que es vol actualitzar."""
            id: Int!

            """Noves dades de l'usuari."""
            datosUsuario: ActualizarUsuarioInput!
        ): Usuario

        """
        Elimina un usuari existent.
        També elimina els seus intercanvis i les seleccions relacionades.
        Retorna true si l'operació s'ha completat correctament.
        """
        eliminarUsuario(
            """Identificador de l'usuari que es vol eliminar."""
            id: Int!
        ): Boolean!

        """Crea un intercanvi nou i retorna les seves dades."""
        crearIntercambio(
            """Dades necessàries per crear l'intercanvi."""
            datosIntercambio: DatosIntercambioInput!
        ): Intercambio!

        """Actualitza les dades d'un intercanvi existent."""
        actualizarIntercambio(
            """Identificador de l'intercanvi que es vol actualitzar."""
            id: Int!

            """Noves dades de l'intercanvi."""
            datosIntercambio: DatosIntercambioInput!
        ): Intercambio

        """
        Elimina un intercanvi existent i les seleccions relacionades.
        Retorna true si l'operació s'ha completat correctament.
        """
        eliminarIntercambio(
            """Identificador de l'intercanvi que es vol eliminar."""
            id: Int!
        ): Boolean!

        """
        Guarda una selecció d'un usuari.
        Si ja existeix, actualitza la data de selecció.
        """
        guardarSeleccion(
            """Identificador de l'usuari que fa la selecció."""
            idUsuario: Int!

            """Identificador de l'intercanvi seleccionat."""
            idIntercambio: Int!
        ): Seleccion!

        """
        Elimina una selecció concreta d'un usuari.
        Retorna true si l'eliminació s'ha completat correctament.
        """
        eliminarSeleccion(
            """Identificador de l'usuari."""
            idUsuario: Int!

            """Identificador de l'intercanvi que es vol deseleccionar."""
            idIntercambio: Int!
        ): Boolean!
    }
`);

module.exports = schema;