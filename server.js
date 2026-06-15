const express = require('express');
const path = require('path');
const morgan = require('morgan');

const { runMigration } = require('./src/database/migration');
const { runSeeders }   = require('./src/database/seeders');
const vagasController  = require('./src/controllers/vagasController');
const profileController = require('./src/controllers/profileController');
const notificationController = require('./src/controllers/notificationController');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Banco de dados ──────────────────────────────────────────────
runMigration();
runSeeders();

// ── Middlewares ─────────────────────────────────────────────────
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// ── Rotas ───────────────────────────────────────────────────────
app.use('/api/vagas', vagasController);
app.use('/api/perfil', profileController);
app.use('/api/notificacoes', notificationController);

// Rota principal - entrega o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ───────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
