import { z } from 'zod';
import { emptyParamsSchema, emptyQuerySchema } from './request.schema';

const email = z.string().trim().email('E-mail em formato inválido').transform((value) => value.toLowerCase());
const accountFields = {
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email,
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
};

const registerBody = z.object({
  ...accountFields,
  role: z.enum(['student', 'company']).optional(),
  course: z.string().trim().optional(),
  campus: z.string().trim().optional(),
}).strict().superRefine((body, context) => {
  if ((body.role || 'student') !== 'student') return;
  if (!body.course) context.addIssue({ code: 'custom', path: ['course'], message: 'Curso é obrigatório' });
  if (!body.campus) context.addIssue({ code: 'custom', path: ['campus'], message: 'Campus é obrigatório' });
});

export const registerSchema = z.object({
  body: registerBody,
  query: emptyQuerySchema,
  params: emptyParamsSchema,
});

export const loginSchema = z.object({
  body: z.object({
    email,
    password: z.string().min(1, 'A senha é obrigatória'),
  }).strict(),
  query: emptyQuerySchema,
  params: emptyParamsSchema,
});

export const authenticatedUserSchema = z.object({
  body: z.object({}).strict().optional(),
  query: emptyQuerySchema,
  params: emptyParamsSchema,
});