import { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { parseCookies } from '../utils/cookies';

interface ValidatedRequestParts {
  body?: unknown;
  params?: unknown;
  query?: unknown;
}

export function validate(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers,
      cookies: parseCookies(req.headers.cookie),
    });

    if (!result.success) return next(result.error);

    const validated = result.data as ValidatedRequestParts;
    if (Object.prototype.hasOwnProperty.call(validated, 'body')) {
      req.body = validated.body;
    }
    if (validated.params) {
      req.params = validated.params as Request['params'];
    }
    if (Object.prototype.hasOwnProperty.call(validated, 'query')) {
      Object.defineProperty(req, 'query', {
        configurable: true,
        enumerable: true,
        value: validated.query,
      });
    }

    next();
  };
}