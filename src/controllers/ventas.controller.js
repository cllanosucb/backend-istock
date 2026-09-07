const pool = require('../config/db');

const SELECT_VENTA_CON_EQUIPO = `
    SELECT
        v.id, v.fecha_venta, v.cliente, v.precio_final, v.metodo_pago, v.garantia, v.created_at,
        e.id AS equipo_id, e.modelo, e.capacidad, e.imei
    FROM ventas v
    JOIN equipos e ON e.id = v.equipo_id
`;

async function getAll(req, res, next) {
    try {
        const { rows } = await pool.query(`${SELECT_VENTA_CON_EQUIPO} ORDER BY v.fecha_venta DESC, v.id DESC`);
        res.json(rows);
    } catch (err) {
        next(err);
    }
}

async function getById(req, res, next) {
    try {
        const { rows } = await pool.query(`${SELECT_VENTA_CON_EQUIPO} WHERE v.id = $1`, [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }
        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
}

async function create(req, res, next) {
    const { equipo_id, fecha_venta, cliente, precio_final, metodo_pago, garantia } = req.body;

    if (!equipo_id || !fecha_venta || !cliente || !precio_final || !metodo_pago) {
        return res.status(400).json({
            error: 'equipo_id, fecha_venta, cliente, precio_final y metodo_pago son requeridos',
        });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const equipoResult = await client.query(
            `SELECT * FROM equipos WHERE id = $1 FOR UPDATE`,
            [equipo_id]
        );
        const equipo = equipoResult.rows[0];

        if (!equipo) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'El equipo seleccionado no existe' });
        }
        if (equipo.estado !== 'disponible') {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'El equipo ya no esta disponible para la venta' });
        }

        const ventaResult = await client.query(
            `INSERT INTO ventas (equipo_id, fecha_venta, cliente, precio_final, metodo_pago, garantia)
            VALUES ($1,$2,$3,$4,$5, COALESCE($6, 'sin_garantia'))
            RETURNING *`,
            [equipo_id, fecha_venta, cliente, precio_final, metodo_pago, garantia]
        );

        await client.query(`UPDATE equipos SET estado = 'vendido' WHERE id = $1`, [equipo_id]);

        await client.query('COMMIT');
        res.status(201).json(ventaResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
}

async function update(req, res, next) {
    const ventaId = req.params.id;
    const { equipo_id, fecha_venta, cliente, precio_final, metodo_pago, garantia } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const ventaActualResult = await client.query('SELECT * FROM ventas WHERE id = $1 FOR UPDATE', [ventaId]);
        const ventaActual = ventaActualResult.rows[0];

        if (!ventaActual) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        // Si se cambia el equipo vendido: liberar el anterior y marcar el nuevo como vendido
        if (equipo_id && Number(equipo_id) !== ventaActual.equipo_id) {
            const nuevoEquipoResult = await client.query('SELECT * FROM equipos WHERE id = $1 FOR UPDATE', [equipo_id]);
            const nuevoEquipo = nuevoEquipoResult.rows[0];

            if (!nuevoEquipo) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'El nuevo equipo seleccionado no existe' });
            }
            if (nuevoEquipo.estado !== 'disponible') {
                await client.query('ROLLBACK');
                return res.status(409).json({ error: 'El nuevo equipo seleccionado no esta disponible' });
            }

            await client.query(`UPDATE equipos SET estado = 'disponible' WHERE id = $1`, [ventaActual.equipo_id]);
            await client.query(`UPDATE equipos SET estado = 'vendido' WHERE id = $1`, [equipo_id]);
        }

        const { rows } = await client.query(
            `UPDATE ventas SET
                equipo_id = COALESCE($1, equipo_id),
                fecha_venta = COALESCE($2, fecha_venta),
                cliente = COALESCE($3, cliente),
                precio_final = COALESCE($4, precio_final),
                metodo_pago = COALESCE($5, metodo_pago),
                garantia = COALESCE($6, garantia)
            WHERE id = $7
            RETURNING *`,
            [equipo_id, fecha_venta, cliente, precio_final, metodo_pago, garantia, ventaId]
        );

        await client.query('COMMIT');
        res.json(rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
}

async function remove(req, res, next) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const ventaResult = await client.query('SELECT * FROM ventas WHERE id = $1 FOR UPDATE', [req.params.id]);
        const venta = ventaResult.rows[0];

        if (!venta) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Venta no encontrada' });
        }

        await client.query('DELETE FROM ventas WHERE id = $1', [req.params.id]);
        // Al eliminar la venta, el equipo vuelve a quedar disponible
        await client.query(`UPDATE equipos SET estado = 'disponible' WHERE id = $1`, [venta.equipo_id]);

        await client.query('COMMIT');
        res.status(204).send();
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
}

module.exports = { getAll, getById, create, update, remove };
