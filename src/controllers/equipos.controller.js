const pool = require('../config/db');

async function getAll(req, res, next) {
    try {
        const { rows } = await pool.query('SELECT * FROM equipos ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        next(err);
    }
}

async function getDisponibles(req, res, next) {
    try {
        const { rows } = await pool.query(
            `SELECT * FROM equipos WHERE estado = 'disponible' ORDER BY modelo`
        );
        res.json(rows);
    } catch (err) {
        next(err);
    }
}

async function getById(req, res, next) {
    try {
        const { rows } = await pool.query('SELECT * FROM equipos WHERE id = $1', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Equipo no encontrado' });
        }
        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
}

async function create(req, res, next) {
    try {
        const {
            imei, modelo, capacidad, color,
            salud_bateria, precio_compra, precio_venta_sugerido, estado,
        } = req.body;

        if (!imei || !modelo || !capacidad) {
            return res.status(400).json({ error: 'imei, modelo y capacidad son requeridos' });
        }

        const { rows } = await pool.query(
            `INSERT INTO equipos
                (imei, modelo, capacidad, color, salud_bateria, precio_compra, precio_venta_sugerido, estado)
            VALUES ($1,$2,$3,$4,$5,$6,$7, COALESCE($8, 'disponible'))
            RETURNING *`,
            [imei, modelo, capacidad, color, salud_bateria, precio_compra, precio_venta_sugerido, estado]
        );

        res.status(201).json(rows[0]);
    } catch (err) {
        next(err);
    }
}

async function update(req, res, next) {
    try {
        const {
            imei, modelo, capacidad, color,
            salud_bateria, precio_compra, precio_venta_sugerido, estado,
        } = req.body;

        const { rows } = await pool.query(
            `UPDATE equipos SET
                imei = COALESCE($1, imei),
                modelo = COALESCE($2, modelo),
                capacidad = COALESCE($3, capacidad),
                color = COALESCE($4, color),
                salud_bateria = COALESCE($5, salud_bateria),
                precio_compra = COALESCE($6, precio_compra),
                precio_venta_sugerido = COALESCE($7, precio_venta_sugerido),
                estado = COALESCE($8, estado)
            WHERE id = $9
            RETURNING *`,
            [imei, modelo, capacidad, color, salud_bateria, precio_compra, precio_venta_sugerido, estado, req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Equipo no encontrado' });
        }

        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
}

async function remove(req, res, next) {
    try {
        const { rows } = await pool.query('DELETE FROM equipos WHERE id = $1 RETURNING id', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Equipo no encontrado' });
        }
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

module.exports = { getAll, getDisponibles, getById, create, update, remove };
