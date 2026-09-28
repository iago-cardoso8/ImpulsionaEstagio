import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const jwtSecret = process.env.JWT_SECRET || '';
if (!jwtSecret) {
  throw new Error('JWT_SECRET não configurado');
}

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authorization = req.headers.authorization;
  const match = authorization?.match(/^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i);
  const token = match?.[1];

  if (!token) {
    res.status(401).json({ sucesso: false, erro: 'Autenticação necessária' });
    return;
  }

  let payload: string | jwt.JwtPayload;
  try {
    payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
  } catch {
    res.status(401).json({ sucesso: false, erro: 'Token inválido ou expirado' });
    return;
  }

  const tokenVersion = typeof payload === 'string' ? undefined : payload.tokenVersion;
  if (
    typeof payload === 'string' ||
    !payload.sub ||
    !/^[1-9]\d*$/.test(payload.sub) ||
    typeof tokenVersion !== 'number' ||
    !Number.isSafeInteger(tokenVersion) ||
    tokenVersion < 0
  ) {
    res.status(401).json({ sucesso: false, erro: 'Token inválido ou expirado' });
    return;
  }

  try {
    const user = await prisma.usuario.findUnique({ where: { id: Number(payload.sub) } });
    if (!user) {
      res.status(401).json({ sucesso: false, erro: 'Usuário não encontrado' });
      return;
    }
    if (user.tokenVersion !== tokenVersion) {
      res.status(401).json({ sucesso: false, erro: 'Token inválido ou sessão encerrada' });
      return;
    }
    req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
    next();
  } catch (error) {
    next(error);
  }
}