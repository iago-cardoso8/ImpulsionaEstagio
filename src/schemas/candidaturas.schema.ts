import { z } from 'zod';
import { emptyParamsSchema, emptyQuerySchema } from './request.schema';

const answerText = (field: string) => z.string()
  .trim()
  .min(10, `Responda com pelo menos 10 caracteres: ${field}`)
  .max(2000, `A resposta de ${field} deve ter no máximo 2000 caracteres`);

export const createCandidaturaSchema = z.object({
  body: z.object({
    vagaId: z.number().int().positive('ID da vaga deve ser um inteiro positivo'),
    coverLetter: z.string().trim().max(3000, 'A carta de apresentação deve ter no máximo 3000 caracteres').optional(),
    answers: z.object({
      skills: answerText('habilidades'),
      experience: z.string().trim().max(2000, 'A resposta sobre experiência deve ter no máximo 2000 caracteres'),
      motivation: answerText('motivação'),
      availability: z.enum(['Imediata', 'Em até 15 dias', 'Em até 30 dias', 'A combinar']),
    }).strict(),
  }).strict(),
  params: emptyParamsSchema,
  query: emptyQuerySchema,
});
