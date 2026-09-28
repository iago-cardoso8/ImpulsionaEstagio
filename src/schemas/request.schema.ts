import { z } from 'zod';

export const emptyBodySchema = z.object({}).strict().optional();
export const emptyQuerySchema = z.object({}).strict();
export const emptyParamsSchema = z.object({}).strict();

export const emptyRequestSchema = z.object({
  body: emptyBodySchema,
  query: emptyQuerySchema,
  params: emptyParamsSchema,
});