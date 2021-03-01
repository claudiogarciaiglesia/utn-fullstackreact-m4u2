const jwt = require('jsonwebtoken');
const dotenv = require('dotenv').config();

exports.auth = function (req, res, next) {
    try {
        let token = req.headers['authorization'];

        if (!token) {
            throw new Error('You are not logged in');
        };

        //Se hace para quitar esa palabra que se coloca automaticamente
        token = token.replace('Bearer ', '');

        jwt.verify(token, process.env.SESSION_SECRET, (err, user) => {
            if (err) {
                throw new Error('Invalid token');
            }
            next();
        });
    } catch (e) {
        res.status(403).send({ message: e.message });
    }
};