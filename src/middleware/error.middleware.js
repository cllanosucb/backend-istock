function manejadorErrores(err, req, res, next) {
    console.error(err);

    if (err.code === '23505') {
        // violacion de unique (IMEI o email repetido)
        return res.status(409).json({ error: 'El registro ya existe (valor duplicado)' });
    }

    if (err.code === '23503') {
        // violacion de foreign key
        return res.status(409).json({ error: 'No se puede completar la operacion: registro relacionado' });
    }

    if (err.code === '23514') {
        // violacion de check constraint
        return res.status(400).json({ error: 'Uno de los valores enviados no es valido' });
    }

    res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
}

module.exports = manejadorErrores;
