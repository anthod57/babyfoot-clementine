import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export interface ValidationIssue {
    path: string;
    message: string;
}

export class ValidationError extends Error {
    readonly statusCode = 400;
    readonly issues: ValidationIssue[];

    constructor(message: string, issues: ValidationIssue[] = []) {
        super(message);
        this.name = "ValidationError";
        Object.setPrototypeOf(this, ValidationError.prototype);
        this.issues = issues;
    }
}

interface ErrorPayload {
    error: string;
    errors?: ValidationIssue[];
    stack?: string;
}

const PROD_MESSAGE_CLIENT = "Invalid input";
const PROD_MESSAGE_SERVER = "Internal server error";

const SEQUELIZE_CLIENT_ERRORS = [
    "SequelizeValidationError",
    "SequelizeUniqueConstraintError",
    "SequelizeForeignKeyConstraintError",
];

function getStatusAndMessage(
    err: Error,
    isDev: boolean,
): { status: number; message: string } {
    const hasStatus = "statusCode" in err && typeof (err as { statusCode?: number }).statusCode === "number";
    const status = hasStatus ? (err as { statusCode: number }).statusCode : 500;

    const isClient =
        err instanceof ValidationError ||
        SEQUELIZE_CLIENT_ERRORS.includes(err.name);

    const message = isDev || !isClient
        ? (err.message || PROD_MESSAGE_SERVER)
        : isClient
          ? PROD_MESSAGE_CLIENT
          : PROD_MESSAGE_SERVER;

    return {
        status: isClient && !hasStatus ? 400 : status,
        message,
    };
}

function getErrors(err: Error, isDev: boolean): ValidationIssue[] | undefined {
    if (err instanceof ValidationError && err.issues.length > 0) {
        return err.issues;
    }
    if (
        isDev &&
        "errors" in err &&
        Array.isArray((err as { errors: unknown[] }).errors)
    ) {
        const sequelizeErrors = (err as { errors: { path?: string; message?: string }[] }).errors;
        return sequelizeErrors.map((e) => ({
            path: e.path ?? "unknown",
            message: e.message ?? "",
        }));
    }
    return undefined;
}

export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void {
    const isDev = env.NODE_ENV === "development";

    if (isDev) {
        console.error(err);
    }

    const { status, message } = getStatusAndMessage(err, isDev);
    const errors = getErrors(err, isDev);

    const payload: ErrorPayload = { error: message };
    if (errors?.length) payload.errors = errors;
    if (isDev && err.stack) payload.stack = err.stack;

    res.status(status).json(payload);
}
