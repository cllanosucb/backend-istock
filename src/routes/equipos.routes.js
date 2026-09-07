const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/auth.middleware');
const {
    getAll, getDisponibles, getById, create, update, remove,
} = require('../controllers/equipos.controller');

router.use(verificarToken);

// GET /api/equipos
router.get('/', getAll);

// GET /api/equipos/disponibles  (usado por el formulario de ventas)
router.get('/disponibles', getDisponibles);

// GET /api/equipos/:id
router.get('/:id', getById);

// POST /api/equipos
router.post('/', create);

// PUT /api/equipos/:id
router.put('/:id', update);

// DELETE /api/equipos/:id
router.delete('/:id', remove);

module.exports = router;
