import { z } from 'zod';
import { emptyBodySchema, emptyParamsSchema, emptyQuerySchema, emptyRequestSchema } from './request.schema';

const profileBody = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
  email: z.string().trim().email('E-mail em formato inválido'),
  course: z.string().trim().min(1, 'Curso é obrigatório'),
  campus: z.string().trim().min(1, 'Campus é obrigatório'),
  status: z.string().trim().optional(),
  availability: z.string().trim().optional(),
}).strict();

const profileId = z.object({
  id: z.string().regex(/^[1-9]\d*$/, 'ID deve ser um inteiro positivo'),
}).strict();

const partialProfileBody = profileBody.partial().refine(
  (body) => Object.keys(body).length > 0,
  'Informe ao menos um campo para atualizar'
);

export const createProfileSchema = z.object({ body: profileBody, params: emptyParamsSchema, query: emptyQuerySchema });
export const updateProfileSchema = z.object({ body: profileBody, params: emptyParamsSchema, query: emptyQuerySchema });
export const updateProfileByIdSchema = z.object({ params: profileId, body: partialProfileBody, query: emptyQuerySchema });
export const profileIdSchema = z.object({ params: profileId, body: emptyBodySchema, query: emptyQuerySchema });
export const readProfileSchema = emptyRequestSchema;