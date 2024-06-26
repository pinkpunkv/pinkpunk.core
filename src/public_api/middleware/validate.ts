import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export function validate (schema: AnyZodObject) {
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
                    status: 417,
                    message: "validation error",
                    errors:error.issues.map(x=> JSON.parse(x.message))
                });
            }
            next(error);
        }
    };
}
