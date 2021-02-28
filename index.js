const util = require('util');

// Configuracion de express
const express = require('express');
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;


// Configuracion mysql
const mysql = require('mysql');
const conexion = mysql.createConnection({
    host: 'localhost',
    user: 'admin',
    password: 'admin',
    database: 'gestion_pagos'
});

conexion.connect((error) => {
    if (error) {
        throw error;
    }

    console.log('Connection with database established.');
});

const qy = util.promisify(conexion.query).bind(conexion); // permite uso de async await con mysql

// POST para cargar nuevos clientes

app.post('/clientes', async (req, res) => {
    try {
        if ((!req.body.nombre) || (req.body.nombre.length < 3)) {
            throw new Error('El nombre debe tener mas de 3 caracteres');
        };

        let query = 'INSERT INTO clientes (nombre) VALUES (?)';
        let queryRes = await qy(query, [req.body.nombre]);

        let newId = queryRes.insertId;
        query = 'SELECT * FROM clientes WHERE id = ?';
        queryRes = await qy(query, [newId]);

        res.status(201);
        res.send(queryRes[0]);

    } catch (e) {
        console.log(e.message);
        res.status(413).send({ "Error": e.message });
    }
});

// POST para cargar nuevos trabajos y asigarles un cliente
app.post('/trabajos', async (req, res) => {
    try {
        if ((!req.body.descripcion) || (req.body.descripcion.length < 3)) {
            throw new Error('La descripcion debe tener mas de 3 caracteres');
        };

        if (!req.body.id_clientes) {
            throw new Error('No se envio el ID del cliente asociado');
        };

        let query = 'SELECT * FROM clientes WHERE id = ?';
        let queryRes = await qy(query, [req.body.id_clientes]);

        if (queryRes.length === 0) {
            throw new Error('No se encontro el ID del cliente asociado')
        };

        query = 'INSERT INTO trabajos (descripcion, id_clientes) VALUES ( ?, ? )';
        queryRes = await qy(query, [req.body.descripcion, req.body.id_clientes]);

        let newId = queryRes.insertId;
        query = 'SELECT * FROM trabajos WHERE id = ?';
        queryRes = await qy(query, [newId]);

        res.status(201);
        res.send(queryRes[0]);

    } catch (e) {
        console.log(e.message);
        res.status(413).send({ "Error": e.message });
    }
});

// GET para mostrar lista de todos los clientes
app.get('/clientes', async (req, res) => {
    try {

        let query = `SELECT * FROM clientes`;
        let queryRes = await qy(query);

        res.send(queryRes);

    } catch (e) {
        console.log(e.message);
        res.status(413).send({ "Error": e.message });
    }
});

// GET para mostrar lista de todos los trabajos
app.get('/trabajos', async (req, res) => {
    try {

        let query = `SELECT * FROM trabajos`;
        let queryRes = await qy(query);

        res.send(queryRes);

    } catch (e) {
        console.log(e.message);
        res.status(413).send({ "Error": e.message });
    }
});


// GET para mostrar lista de trabajos filtrados por cliente, finalizado, sin finalizar, pagado e impago
app.get('/trabajos/:id_clientes?/:finalizado?/:pagado?', async (req, res) => {
    try {

        let { id_clientes, finalizado, pagado } = req.params;

        const conditions = `id_clientes = ?${!!finalizado ? " AND finalizado = " + "?" : ""}${!!pagado ? " AND pagado = " + "?" : ""} `;

        let query = `SELECT * FROM trabajos WHERE ${conditions} `;
        let queryRes = await qy(query, [id_clientes, finalizado, pagado]);

        res.send(queryRes);

    } catch (e) {
        console.log(e.message);
        res.status(413).send({ "Error": e.message });
    }
});

// PUT para modificar clientes
app.put('/clientes/:id', async (req, res) => {
    try {

        if (!req.body.nombre) {
            throw new Error('No se envio el nombre');
        };

        let query = 'UPDATE clientes SET nombre = ? WHERE id = ?';
        let queryRes = await qy(query, [req.body.nombre, req.params.id]);

        query = 'SELECT * FROM clientes WHERE id = ?';
        queryRes = await qy(query, [req.params.id]);

        res.send(queryRes[0]);

    } catch (e) {
        console.log(e.message);
        res.status(413).send({ "Error": e.message });
    }
});


// PUT para modificar descripcion de trabajos
app.put('/trabajos/:id/descripcion', async (req, res) => {
    try {

        if (!req.body.descripcion) {
            throw new Error('No se envio la descripcion');
        };

        let query = 'UPDATE trabajos SET descripcion = ? WHERE id = ?';
        let queryRes = await qy(query, [req.body.descripcion, req.params.id]);

        query = 'SELECT * FROM trabajos WHERE id = ?';
        queryRes = await qy(query, [req.params.id]);

        res.send(queryRes[0]);

    } catch (e) {
        console.log(e.message);
        res.status(413).send({ "Error": e.message });
    }
});

// PUT para modificar finalizacion de trabajos
app.put('/trabajos/:id/finalizado', async (req, res) => {
    try {

        if ((req.body.finalizado !== "0") && (req.body.finalizado !== "1")) {
            throw new Error('El estado de finalizacion debe ser 0 o 1');
        };

        let query = 'UPDATE trabajos SET finalizado = ? WHERE id = ?';
        let queryRes = await qy(query, [req.body.finalizado, req.params.id]);

        query = 'SELECT * FROM trabajos WHERE id = ?';
        queryRes = await qy(query, [req.params.id]);

        res.send(queryRes[0]);

    } catch (e) {
        console.log(e.message);
        res.status(413).send({ "Error": e.message });
    }
});

// PUT para modificar pago de trabajos
app.put('/trabajos/:id/pagado', async (req, res) => {
    try {

        if ((req.body.pagado !== "0") && (req.body.pagado !== "1")) {
            throw new Error('El estado de finalizacion debe ser 0 o 1');
        };

        let query = 'UPDATE trabajos SET pagado = ? WHERE id = ?';
        let queryRes = await qy(query, [req.body.pagado, req.params.id]);

        query = 'SELECT * FROM trabajos WHERE id = ?';
        queryRes = await qy(query, [req.params.id]);

        res.send(queryRes[0]);

    } catch (e) {
        console.log(e.message);
        res.status(413).send({ "Error": e.message });
    }
});

// DELETE para borrar clientes (tambien borra trabajos asociados)
app.delete('/clientes/:id', async (req, res) => {
    try {

        let query = 'DELETE FROM trabajos WHERE id_clientes = ?';
        let queryRes = await qy(query, [req.params.id]);

        query = 'DELETE FROM clientes WHERE id = ?';
        queryRes = await qy(query, [req.params.id]);

        res.status(204);
        res.send();

    } catch (e) {
        console.log(e.message);
        res.status(413).send({ "Error": e.message });
    };


});


// DELETE para borrar trabajos
app.delete('/trabajos/:id', async (req, res) => {
    try {

        let query = 'DELETE FROM trabajos WHERE id = ?';
        let queryRes = await qy(query, [req.params.id]);

        res.status(204);
        res.send();

    } catch (e) {
        console.log(e.message);
        res.status(413).send({ "Error": e.message });
    };

});



app.listen(PORT, () => {
    console.log(`Our app is running on port ${PORT} `);
});
