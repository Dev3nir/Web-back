//------------------------------------------------ IMPORTS ------------------------------------------------
const express = require('express');
const cors = require('cors');
const http = require('http');

require('dotenv').config();

// rutas
// aqupi poner las rutas que se generen
// rutas
const loginRoutes = require('./routers/login.routes');

//------------------------------------------------ CONFIGS ------------------------------------------------
const { connectDB } = require('./config/db.config');

const PORT = 3001;
const version = 'v1';
const apiBasePath = `/api/${version}`;

//------------------------------ INICIALIZACIÓN DE LA APLICACIÓN ------------------------------
const app = express();
const server = http.createServer(app);

connectDB();

//------------------------------------------------ MIDDLEWARES ------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

//------------------------------------------------ RUTAS ------------------------------------------------
app.use(apiBasePath, require('./routers/login.routes'));
app.use(apiBasePath, require('./routers/usuario.routes'));
app.use(apiBasePath, require('./routers/equipo.routes'));
app.use(apiBasePath, require('./routers/categoria.routes'));
app.use(apiBasePath, require('./routers/campana.routes'));
app.use(apiBasePath, require('./routers/participacion.routes'));
app.use(apiBasePath, require('./routers/diagnostico.routes'));
app.use(apiBasePath, require('./routers/reparacion.routes'));
app.use(apiBasePath, require('./routers/movimiento.routes'));
app.use(apiBasePath, require('./routers/gestor.routes'));

//------------------------------------------------ SERVER ------------------------------------------------
server.listen(PORT, '0.0.0.0', () => {
    console.log('API escuchando en el puerto ' + PORT);
});
