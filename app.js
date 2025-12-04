require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;

const apiRoutes = require('./routes/api');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

app.use('/api', apiRoutes);

app.listen(port, () => {
    console.log(`Servidor a correr: http://localhost:${port}`);
});