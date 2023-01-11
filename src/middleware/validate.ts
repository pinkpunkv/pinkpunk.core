import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export default function validate (schema: AnyZodObject) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
        schema.parse({
            params: req.params,
            query: req.query,
            body: req.body,
        });

        next();
        } catch (error) {
        if (error instanceof ZodError) {
            return res.status(417).json({
            status: 'fail',
            errors: error.errors,
            });
        }
        next(error);
        }
    };
}
