import express, { Express } from 'express';
import path from 'path';
import morgan from 'morgan';

import { runMigration } from './src/database/migration';
import { runSeeders } from './src/database/seeders';
import vagasController from './src/controllers/vagasController';
import profileController from './src/controllers/profileController';
import notificationController from './src/controllers/notificationController';

const app: Express = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

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
