import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { env } from "../config/env";

const isDev = env.NODE_ENV === "development";

export const securityMiddleware = [
    helmet(),
    cors({
        origin: env.CORS_ORIGIN,
        credentials: true,
    }),
    rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: isDev ? 500 : 100,
        standardHeaders: true,
        legacyHeaders: false,
    }),
];
