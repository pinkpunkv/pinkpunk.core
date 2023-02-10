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
            console.log("validated");
            
            next();
        } catch (error) {
        if (error instanceof ZodError) {
            console.log(error);
            
            return res.status(417).json({
            status: 417,
            code:error.issues[0].message,
            message: "validation error",
            content:error.issues
            });
        }
        next(error);
        }
    };
}
