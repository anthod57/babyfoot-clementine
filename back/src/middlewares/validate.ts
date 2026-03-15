import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ValidationError } from "./errorHandler";

type ValidationSource = "body" | "params" | "query";

function formatZodError(err: ZodError): string {
    return err.issues.map(e => `${e.path.join(".")}: ${e.message}`).join("; ");
}

export function validate<T>(
    schema: ZodSchema<T>,
    source: ValidationSource = "body"
) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const data = req[source];
        const result = schema.safeParse(data);

        if (result.success) {
            const r = req as Request & { validated?: Record<string, unknown> };
            r.validated = result.data as Record<string, unknown>;

            // override cause it's a getter in express
            Object.defineProperty(req, source, {
                value: result.data,
                writable: true,
                configurable: true,
            });
            next();
        } else {
            const issues = result.error.issues.map(e => ({
                path: e.path.join(".") || "root",
                message: e.message,
            }));
            const message = formatZodError(result.error);
            next(new ValidationError(message, issues));
        }
    };
}
