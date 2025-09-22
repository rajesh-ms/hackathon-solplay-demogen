import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../middleware/error-handler';

export const validationMiddleware = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error: validationError, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (validationError) {
      const details = validationError.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      const error = new AppError('Validation failed', 400);
      (error as any).details = details;
      return next(error);
    }

    // Replace req.body with the validated and sanitized value
    req.body = value;
    next();
  };
};