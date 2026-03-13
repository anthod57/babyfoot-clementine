import dotenv from "dotenv";

dotenv.config();

export const env = {
    NODE_ENV: process.env.NODE_ENV ?? "development",
    PORT: parseInt(process.env.PORT ?? "3000", 10),
    DB_HOST: process.env.DB_HOST ?? "localhost",
    DB_PORT: parseInt(process.env.DB_PORT ?? "3306", 10),
    DB_USER: process.env.DB_USER ?? "root",
    DB_PASSWORD: process.env.DB_PASSWORD ?? "",
    DB_NAME: process.env.DB_NAME ?? "babyfoot_clementine",
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",
} as const;
