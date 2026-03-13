import app from "./app";
import { env } from "./config/env";
import { sequelize } from "./config/database";
import "./models";

const DB_RETRY_DELAY_MS = 2000;
const DB_MAX_RETRIES = 30;

async function connectWithRetry(): Promise<void> {
    for (let attempt = 1; attempt <= DB_MAX_RETRIES; attempt++) {
        try {
            await sequelize.authenticate();
            console.log("Database connection established.");
            return;
        } catch (err) {
            console.warn(
                `Database connection attempt ${attempt}/${DB_MAX_RETRIES} failed:`,
                (err as Error).message,
            );
            if (attempt === DB_MAX_RETRIES) {
                console.error("Unable to connect to the database after retries.");
                process.exit(1);
            }
            await new Promise((resolve) =>
                setTimeout(resolve, DB_RETRY_DELAY_MS),
            );
        }
    }
}

async function bootstrap(): Promise<void> {
    await connectWithRetry();
    await sequelize.sync();

    const server = app.listen(env.PORT, () => {
        console.log(`Server running on port ${env.PORT} (${env.NODE_ENV})`);
    });

    const shutdown = async (signal: string) => {
        console.log(`${signal} received. Shutting down gracefully...`);
        server.close(async () => {
            await sequelize.close();
            process.exit(0);
        });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
}

bootstrap();
