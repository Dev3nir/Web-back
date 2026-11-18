
// conexión a mariadb

const mariadb = require('mariadb');
require('dotenv').config();

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    connectionLimit: 5
});

async function connectDB() {

    let conn;

    try {

        conn = await pool.getConnection();

        console.log('Conectado a MariaDB');

        // QUERY DE PRUEBA
        const result = await conn.query('SHOW TABLES');

        console.log('Tablas de la base de datos:');
        console.log(result);

    } catch (err) {

        console.error('Error de conexión:', err);

    } finally {

        if (conn) conn.release();

    }
}

module.exports = {
    pool,
    connectDB
};
