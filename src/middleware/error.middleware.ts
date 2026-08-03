import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/appError.js';
import logger from '../utils/logger.js';
import { env } from '../config/env.js';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  logger.error(err.stack || err.message);

  if (err instanceof ZodError) {
    res.status(400).json({
      status: 'fail',
      message: 'Validation Error',
      errors: err.issues.map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'fail',
      message: err.message,
    });
    return;
  }

  // Handle DB Constraints, Prisma Errors or other unhandled exceptions
  const response: Record<string, unknown> = {
    status: 'error',
    message: 'An unexpected error occurred.',
  };

  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.error = err;
  }

  res.status(500).json(response);
};
