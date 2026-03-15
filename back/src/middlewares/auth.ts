import { Request, Response, NextFunction } from "express";
import { User } from "../models/userModel";
import { verifyToken } from "../utils/jwt";

export interface AuthRequest extends Request {
    user?: User & { roleNames: string[] };
}

/**
 * Middleware to authenticate the user
 * @param {AuthRequest} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {void}
 */
export function auth(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

    if (!token) {
        res.status(401).json({ error: "Missing token" });
        return;
    }

    try {
        const payload = verifyToken(token);

        User.findByPk(payload.sub)
            .then(async user => {
                if (!user) {
                    res.status(401).json({ error: "User not found" });
                    return;
                }

                const roles = await user.getRoles();
                const roleNames = roles.map(r => r.roleName);

                req.user = { ...user.get(), roleNames } as AuthRequest["user"];
                next();
            })
            .catch(next);
    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
}

/**
 * Middleware to check if the user has specific roles
 * @param {string[]} allowedRoles
 * @returns {Function}
 */
export function requireRole(...allowedRoles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const hasRole = req.user.roleNames?.some(r => allowedRoles.includes(r));

        if (!hasRole) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }

        next();
    };
}
