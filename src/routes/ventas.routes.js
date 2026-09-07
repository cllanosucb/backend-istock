const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/auth.middleware');
const { getAll, getById, create, update, remove } = require('../controllers/ventas.controller');

router.use(verificarToken);

// GET /api/ventas
router.get('/', getAll);

// GET /api/ventas/:id
router.get('/:id', getById);

// POST /api/ventas
router.post('/', create);

// PUT /api/ventas/:id
router.put('/:id', update);

// DELETE /api/ventas/:id
router.delete('/:id', remove);

module.exports = router;
