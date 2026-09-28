import { z } from 'zod';
import { emptyBodySchema, emptyParamsSchema, emptyQuerySchema } from './request.schema';

const nonEmptyText = z.string().trim().min(1, 'Este campo é obrigatório');
function isPositiveSalary(value: string): boolean {
  if (value.toLowerCase() === 'a combinar') return true;

  const amount = value
    .replace(/^r\$\s*/i, '')
    .replace(/\s/g, '');
  const normalized = amount.includes(',')
    ? amount.replace(/\./g, '').replace(',', '.')
    : /^\d{1,3}(?:\.\d{3})+$/.test(amount)
      ? amount.replace(/\./g, '')
      : amount;

  return /^\d+(?:\.\d{1,2})?$/.test(normalized) && Number(normalized) > 0;
}

const salary = z.string().trim().refine((value) => {
  return isPositiveSalary(value);
}, 'Salário deve ser um valor numérico maior que zero ou "A combinar"');
const textList = z.array(z.string().trim().min(1)).optional();

const vagaBody = z.object({
  title: nonEmptyText,
  company: nonEmptyText,
  location: nonEmptyText,
  email: z.string().trim().email('E-mail em formato inválido'),
  time: z.string().trim().optional(),
  type: z.string().trim().optional(),
  salary,
  target: nonEmptyText,
  desc: z.string().trim().optional(),
  requirements: textList,
  benefits: textList,
}).strict();

const vagaId = z.object({
  id: z.string().regex(/^[1-9]\d*$/, 'ID deve ser um inteiro positivo'),
}).strict();

export const createVagaSchema = z.object({ body: vagaBody, query: emptyQuerySchema, params: emptyParamsSchema });
export const readVagasSchema = z.object({
  body: emptyBodySchema,
  params: emptyParamsSchema,
  query: z.object({
    target: nonEmptyText.optional(),
  }).strict(),
});
export const updateVagaSchema = z.object({
  params: vagaId,
  body: vagaBody.partial().refine((body) => Object.keys(body).length > 0, 'Informe ao menos um campo para atualizar'),
  query: emptyQuerySchema,
});
export const vagaIdSchema = z.object({ params: vagaId, body: emptyBodySchema, query: emptyQuerySchema });
export const vagaTargetSchema = z.object({
  params: z.object({ target: nonEmptyText }).strict(),
  body: emptyBodySchema,
  query: emptyQuerySchema,
});