import express, { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCandidaturaSchema } from '../schemas/candidaturas.schema';

const router: Router = express.Router();
const prisma = new PrismaClient();

router.use(requireAuth);
router.use((req: Request, res: Response, next): void => {
  if (req.user?.role !== 'student') {
    res.status(403).json({ sucesso: false, erro: 'Apenas estudantes podem se candidatar a vagas' });
    return;
  }
  next();
});

router.get('/minhas', async (req: Request, res: Response): Promise<void> => {
  try {
    const candidato = await prisma.candidato.findUnique({
      where: { email: req.user!.email },
    });
    const candidaturas = candidato
      ? await prisma.candidatura.findMany({
        where: { candidatoId: candidato.id },
        select: { vagaId: true },
      })
      : [];

    res.status(200).json({ sucesso: true, dados: candidaturas });
  } catch (error) {
    console.error('Erro ao listar candidaturas do estudante:', error);
    res.status(500).json({ sucesso: false, erro: 'Erro interno ao listar candidaturas' });
  }
});

router.post('/', validate(createCandidaturaSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const vaga = await prisma.vaga.findUnique({
      where: { id: req.body.vagaId },
      select: { id: true },
    });
    if (!vaga) {
      res.status(404).json({ sucesso: false, erro: 'Vaga não encontrada' });
      return;
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user!.id },
      include: { perfil: true },
    });
    if (!usuario || usuario.role !== 'student') {
      res.status(403).json({ sucesso: false, erro: 'Apenas estudantes podem se candidatar a vagas' });
      return;
    }

    const candidatura = await prisma.$transaction(async (transaction) => {
      const candidato = await transaction.candidato.upsert({
        where: { email: usuario.email },
        create: {
          name: usuario.perfil?.name || usuario.name,
          email: usuario.email,
          phone: '',
          location: usuario.perfil?.campus || '',
        },
        update: {
          name: usuario.perfil?.name || usuario.name,
        },
      });

      return transaction.candidatura.create({
        data: {
          vagaId: vaga.id,
          candidatoId: candidato.id,
          coverLetter: req.body.coverLetter || '',
          applicationAnswers: JSON.stringify(req.body.answers),
        },
        select: {
          id: true,
          vagaId: true,
          status: true,
          appliedAt: true,
        },
      });
    });

    res.status(201).json({
      sucesso: true,
      mensagem: 'Candidatura enviada com sucesso',
      dados: candidatura,
    });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      res.status(409).json({ sucesso: false, erro: 'Você já se candidatou a esta vaga' });
      return;
    }
    console.error('Erro ao criar candidatura:', error);
    res.status(500).json({ sucesso: false, erro: 'Erro interno ao enviar candidatura' });
  }
});

export default router;
