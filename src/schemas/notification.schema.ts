import { z } from 'zod';
import { emptyBodySchema, emptyParamsSchema, emptyQuerySchema, emptyRequestSchema } from './request.schema';

const notificationBody = z.object({
  title: z.string().trim().min(1, 'Título é obrigatório'),
  message: z.string().trim().min(1, 'Mensagem é obrigatória'),
  time: z.string().trim().min(1, 'Horário é obrigatório'),
}).strict();

const notificationId = z.object({
  id: z.string().regex(/^[1-9]\d*$/, 'ID deve ser um inteiro positivo'),
}).strict();

const partialNotificationBody = notificationBody.partial().refine(
  (body) => Object.keys(body).length > 0,
  'Informe ao menos um campo para atualizar'
);

export const createNotificationSchema = z.object({ body: notificationBody, params: emptyParamsSchema, query: emptyQuerySchema });
export const updateNotificationSchema = z.object({ params: notificationId, body: partialNotificationBody, query: emptyQuerySchema });
export const notificationIdSchema = z.object({ params: notificationId, body: emptyBodySchema, query: emptyQuerySchema });
export const readNotificationsSchema = emptyRequestSchema;