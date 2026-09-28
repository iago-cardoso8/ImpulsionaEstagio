import express, { Router, Request, Response } from 'express';
import * as VagasService from '../models/vagasModel.prisma';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createVagaSchema, readVagasSchema, updateVagaSchema, vagaIdSchema, vagaTargetSchema } from '../schemas/vagas.schema';

const router: Router = express.Router();
router.use((req, res, next): void => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    void requireAuth(req, res, next);
    return;
  }
  next();
});

// ────────────────────────────────────────────────────────────
// VALIDAÇÕES
// ────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────
// ROTAS - READ (GET)
// ────────────────────────────────────────────────────────────

/**
 * GET /api/vagas
 * Lista todas as vagas
 */
router.get('/', validate(readVagasSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const target = typeof req.query.target === 'string' ? req.query.target : undefined;
    const vagas = target ? await VagasService.findByTarget(target) : await VagasService.findAll();
    res.status(200).json({
      sucesso: true,
      quantidade: vagas.length,
      dados: vagas,
    });
  } catch (erro: any) {
    console.error('Erro ao listar vagas:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor ao listar vagas',
    });
  }
});

/**
 * GET /api/vagas/:id
 * Busca uma vaga específica por ID
 */
/**
 * GET /api/vagas/target/:target
 * Busca vagas por target (área)
 */
router.get('/target/:target', validate(vagaTargetSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const vagas = await VagasService.findByTarget(String(req.params.target));
    res.status(200).json({
      sucesso: true,
      quantidade: vagas.length,
      dados: vagas,
    });
  } catch (erro: any) {
    console.error('Erro ao buscar vagas por target:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar vagas por target',
    });
  }
});

router.get('/:id', validate(vagaIdSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const vaga = await VagasService.findById(id);

    if (!vaga) {
      res.status(404).json({ sucesso: false, erro: 'Vaga não encontrada', id });
      return;
    }

    res.status(200).json({ sucesso: true, dados: vaga });
  } catch (erro: any) {
    console.error('Erro ao buscar vaga:', erro.message);
    res.status(500).json({ sucesso: false, erro: 'Erro interno do servidor ao buscar vaga' });
  }
});

// ────────────────────────────────────────────────────────────
// ROTAS - CREATE (POST)
// ────────────────────────────────────────────────────────────

/**
 * POST /api/vagas
 * Cria uma nova vaga
 */
router.post('/', validate(createVagaSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    // Only companies can create vagas
    if (req.user?.role !== 'company') {
      res.status(403).json({ sucesso: false, erro: 'Apenas empresas podem cadastrar vagas' });
      return;
    }
    // Force company field to the authenticated user's name and attach usuarioId to establish ownership
    if (req.user?.name) req.body.company = req.user.name;
    if (req.user?.id) req.body.usuarioId = req.user.id;
    const novaVaga = await VagasService.create(req.body);

    if (!novaVaga) {
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao criar vaga',
      });
      return;
    }

    res.status(201).json({
      sucesso: true,
      mensagem: 'Vaga criada com sucesso',
      dados: novaVaga,
    });
  } catch (erro: any) {
    console.error('Erro ao criar vaga:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor ao criar vaga',
    });
  }
});

// ────────────────────────────────────────────────────────────
// ROTAS - UPDATE (PUT)
// ────────────────────────────────────────────────────────────

/**
 * PUT /api/vagas/:id
 * Atualiza uma vaga
 */
router.put('/:id', validate(updateVagaSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const vagaExistente = await VagasService.findById(id);

    if (!vagaExistente) {
      res.status(404).json({
        sucesso: false,
        erro: 'Vaga não encontrada',
        id: id,
      });
      return;
    }

    // Only the company that created the vaga can update it
    if (req.user?.role !== 'company') {
      res.status(403).json({ sucesso: false, erro: 'Permissão negada para atualizar esta vaga' });
      return;
    }

    if (vagaExistente.usuarioId !== req.user.id) {
      res.status(404).json({ sucesso: false, erro: 'Vaga não encontrada' });
      return;
    }

    const vagaAtualizada = await VagasService.update(id, { ...req.body, company: req.user.name });

    res.status(200).json({
      sucesso: true,
      mensagem: 'Vaga atualizada com sucesso',
      dados: vagaAtualizada,
    });
  } catch (erro: any) {
    console.error('Erro ao atualizar vaga:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor ao atualizar vaga',
    });
  }
});

// ────────────────────────────────────────────────────────────
// ROTAS - DELETE
// ────────────────────────────────────────────────────────────

/**
 * DELETE /api/vagas/:id
 * Deleta uma vaga
 */
router.delete('/:id', validate(vagaIdSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (req.user?.role !== 'company') {
      res.status(403).json({ sucesso: false, erro: 'Permissão negada para remover esta vaga' });
      return;
    }

    const vagaExistente = await VagasService.findById(id);
    if (!vagaExistente || vagaExistente.usuarioId !== req.user.id) {
      res.status(404).json({ sucesso: false, erro: 'Vaga não encontrada', id });
      return;
    }

    // Only the company that created the vaga can delete it
    const vagaRemovida = await VagasService.remove(id);

    if (!vagaRemovida) {
      res.status(404).json({
        sucesso: false,
        erro: 'Vaga não encontrada',
        id: id,
      });
      return;
    }

    res.status(200).json({
      sucesso: true,
      mensagem: 'Vaga removida com sucesso',
      dados: vagaRemovida,
    });
  } catch (erro: any) {
    console.error('Erro ao remover vaga:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor ao remover vaga',
    });
  }
});

export default router;
