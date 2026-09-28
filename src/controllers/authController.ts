import express, { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { authenticatedUserSchema, loginSchema, registerSchema } from '../schemas/auth.schema';
import SendMail from '../services/SendMail';

const router: Router = express.Router();
const prisma = new PrismaClient();
const jwtSecret = process.env.JWT_SECRET || '';
if (!jwtSecret) {
  throw new Error('JWT_SECRET não configurado');
}

function publicUser(user: { id: number; name: string; email: string; role: string }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function issueToken(user: { id: number; name: string; email: string; tokenVersion: number }): string {
  return jwt.sign(
    { name: user.name, email: user.email, tokenVersion: user.tokenVersion },
    jwtSecret,
    { subject: String(user.id), expiresIn: '2h', algorithm: 'HS256' }
  );
}

router.post('/register', validate(registerSchema), async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role = 'student', course, campus } = req.body;

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const { user, perfil } = await prisma.$transaction(async (transaction) => {
      const user = await transaction.usuario.create({ data: { name, email, passwordHash, role } });
      const perfil = role === 'student'
        ? await transaction.perfil.create({ data: { name, email, course, campus, usuarioId: user.id } })
        : null;
      return { user, perfil };
    });
    const emailEnviado = await SendMail.createNewUser({ name: user.name, email: user.email });
    res.status(201).json({ sucesso: true, mensagem: 'Usuário cadastrado com sucesso', usuario: publicUser(user), perfil, token: issueToken(user), emailEnviado });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ sucesso: false, erro: 'Este e-mail já está cadastrado' });
      return;
    }
    res.status(500).json({ sucesso: false, erro: 'Erro interno ao cadastrar usuário' });
  }
});

router.post('/login', validate(loginSchema), async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await prisma.usuario.findUnique({ where: { email }, include: { perfil: true } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ sucesso: false, erro: 'E-mail ou senha inválidos' });
      return;
    }

    res.json({ sucesso: true, mensagem: 'Login realizado com sucesso', usuario: publicUser(user), perfil: user.perfil, token: issueToken(user) });
  } catch {
    res.status(500).json({ sucesso: false, erro: 'Erro interno ao autenticar usuário' });
  }
});

router.get('/me', validate(authenticatedUserSchema), requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.usuario.findUnique({ where: { id: req.user!.id }, include: { perfil: true } });
    res.json({ sucesso: true, usuario: user ? publicUser(user) : null, perfil: user?.perfil || null });
  } catch {
    res.status(500).json({ sucesso: false, erro: 'Erro interno ao buscar usuário' });
  }
});

router.post('/logout', validate(authenticatedUserSchema), requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.usuario.update({
      where: { id: req.user!.id },
      data: { tokenVersion: { increment: 1 } },
    });
    res.json({ sucesso: true, mensagem: 'Logout realizado. Todos os tokens ativos foram invalidados.' });
  } catch {
    res.status(500).json({ sucesso: false, erro: 'Erro interno ao encerrar sessão' });
  }
});

export default router;