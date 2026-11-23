import express, { Express } from 'express';
import path from 'path';
import morgan from 'morgan';
import 'dotenv/config';
import { ZodError } from 'zod';

// Controllers com Prisma
import vagasController from './src/controllers/vagasController.prisma';
import profileController from './src/controllers/profileController.prisma';
import notificationController from './src/controllers/notificationController.prisma';
import authController from './src/controllers/authController';
import candidaturasController from './src/controllers/candidaturasController.prisma';
import { requireAuth } from './src/middleware/auth';

const app: Express = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

function startServer(port: number): void {
    const server = app.listen(port, () => {
        console.log(`
╔═══════════════════════════════════════════╗
║  🚀 Servidor Impulsiona Estágio           ║
║  URL: http://localhost:${port}            ║
║  Environment: ${process.env.NODE_ENV || 'development'}              ║
║  Database: SQLite + Prisma ORM            ║
╚═══════════════════════════════════════════╝
        `);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
            console.warn(`Porta ${port} ocupada. Tentando ${port + 1}...`);
            server.close(() => startServer(port + 1));
            return;
        }

        console.error('Erro ao iniciar o servidor:', error);
        process.exit(1);
    });
}

// ── Middlewares ─────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// ── Rotas API ────────────────────────────────────────────────────
app.use('/api/auth', authController);
app.use('/api/candidaturas', candidaturasController);
/**
 * @route GET /api/vagas
 * @desc Listar todas as vagas
 */
app.use('/api/vagas', vagasController);

/**
 * @route GET /api/perfil
 * @desc Gerenciar perfil do usuário
 */
app.use('/api/perfil', requireAuth, profileController);

/**
 * @route GET /api/notificacoes
 * @desc Listar todas as notificações
 */
app.use('/api/notificacoes', notificationController);

// Rota principal - entrega o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        sucesso: true,
        mensagem: 'Servidor operacional',
        timestamp: new Date().toISOString()
    });
});

// ── Error Handler ────────────────────────────────────────────────
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof ZodError) {
        res.status(400).json({
            sucesso: false,
            erro: 'Dados inválidos',
            issues: err.issues.map(({ path, message }) => ({ path, message })),
        });
        return;
    }

    const parserError = err as SyntaxError & { status?: number; body?: unknown };
    if (err instanceof SyntaxError && parserError.status === 400 && 'body' in parserError) {
        console.warn(
            `JSON inválido recebido em ${req.method} ${req.originalUrl} ` +
            `(Content-Type: ${req.get('content-type') || 'ausente'}): ${err.message}`
        );
        res.status(400).json({
            sucesso: false,
            erro: 'JSON inválido',
            issues: [{ path: ['body'], message: 'O corpo da requisição não contém JSON válido' }],
        });
        return;
    }

    console.error('Erro não tratado:', err);
    res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
    });
});

// ── Start ────────────────────────────────────────────────────────
startServer(PORT);
