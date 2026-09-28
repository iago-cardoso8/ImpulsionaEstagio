import express, { Router, Request, Response } from 'express';
import * as NotificationService from '../models/notificationModel.prisma';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createNotificationSchema, notificationIdSchema, readNotificationsSchema, updateNotificationSchema } from '../schemas/notification.schema';

const router: Router = express.Router();
router.use((req, res, next): void => {
  if (req.method !== 'GET') {
    void requireAuth(req, res, next);
    return;
  }
  next();
});

// ────────────────────────────────────────────────────────────
// VALIDAÇÕES
// ────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────
// ROTAS
// ────────────────────────────────────────────────────────────

/**
 * GET /api/notificacoes
 * Lista todas as notificações
 */
router.get('/', validate(readNotificationsSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const notificacoes = await NotificationService.findAll();
    res.status(200).json({
      sucesso: true,
      quantidade: notificacoes.length,
      dados: notificacoes,
    });
  } catch (erro: any) {
    console.error('Erro ao buscar notificações:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao buscar notificações',
    });
  }
});

/**
 * GET /api/notificacoes/:id
 * Busca uma notificação específica
 */
router.get('/:id', validate(notificationIdSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const notificacao = await NotificationService.findById(parseInt(String(req.params.id), 10));
    if (!notificacao) {
      res.status(404).json({
        sucesso: false,
        erro: 'Notificação não encontrada',
      });
      return;
    }

    res.status(200).json({
      sucesso: true,
      dados: notificacao,
    });
  } catch (erro: any) {
    console.error('Erro ao buscar notificação:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao buscar notificação',
    });
  }
});

/**
 * POST /api/notificacoes
 * Cria uma nova notificação
 */
router.post('/', validate(createNotificationSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const novaNotificacao = await NotificationService.create(req.body);
    if (!novaNotificacao) {
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao criar notificação',
      });
      return;
    }

    res.status(201).json({
      sucesso: true,
      mensagem: 'Notificação criada com sucesso',
      dados: novaNotificacao,
    });
  } catch (erro: any) {
    console.error('Erro ao criar notificação:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao criar notificação',
    });
  }
});

/**
 * PUT /api/notificacoes/:id
 * Atualiza uma notificação
 */
router.put('/:id', validate(updateNotificationSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const notificacaoExistente = await NotificationService.findById(id);

    if (!notificacaoExistente) {
      res.status(404).json({
        sucesso: false,
        erro: 'Notificação não encontrada',
      });
      return;
    }

    const notificacaoAtualizada = await NotificationService.update(id, req.body);
    if (!notificacaoAtualizada) {
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao atualizar notificação',
      });
      return;
    }

    res.status(200).json({
      sucesso: true,
      mensagem: 'Notificação atualizada com sucesso',
      dados: notificacaoAtualizada,
    });
  } catch (erro: any) {
    console.error('Erro ao atualizar notificação:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao atualizar notificação',
    });
  }
});

/**
 * DELETE /api/notificacoes/:id
 * Deleta uma notificação
 */
router.delete('/:id', validate(notificationIdSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const notificacaoRemovida = await NotificationService.remove(id);

    if (!notificacaoRemovida) {
      res.status(404).json({
        sucesso: false,
        erro: 'Notificação não encontrada',
      });
      return;
    }

    res.status(200).json({
      sucesso: true,
      mensagem: 'Notificação removida com sucesso',
      dados: notificacaoRemovida,
    });
  } catch (erro: any) {
    console.error('Erro ao remover notificação:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao remover notificação',
    });
  }
});

export default router;
