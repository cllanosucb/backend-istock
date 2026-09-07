const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const equiposRoutes = require('./routes/equipos.routes');
const ventasRoutes = require('./routes/ventas.routes');
const manejadorErrores = require('./middleware/error.middleware');

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
}));
app.use(express.json());

app.get('/api/info', (req, res) => {
    res.json({ status: 'ok', servicio: 'istock-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/equipos', equiposRoutes);
app.use('/api/ventas', ventasRoutes);

app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use(manejadorErrores);

module.exports = app;
