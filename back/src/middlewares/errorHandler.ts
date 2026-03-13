import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export interface AppError extends Error {
    statusCode?: number;
}

export function errorHandler(
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void {
    const statusCode = err.statusCode ?? 500;
    const isDev = env.NODE_ENV === "development";

    if (isDev) {
        console.error(err);
    }

    res.status(statusCode).json({
        error: err.message ?? "Internal Server Error",
        ...(isDev && { stack: err.stack }),
    });
}
