import { Sequelize } from "sequelize";
import { env } from "./env";

export const sequelize = new Sequelize({
    dialect: "mysql",
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    logging: env.NODE_ENV === "development" ? console.log : false,
});
