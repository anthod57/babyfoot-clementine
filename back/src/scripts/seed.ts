import "dotenv/config";
import { sequelize } from "../config/database";
import { Role } from "../models";

const DEFAULT_ROLES = ["admin", "user"];

/**
 * Seed the database with the default data
 * @returns {Promise<void>}
 */
async function seed(): Promise<void> {
    try {
        await sequelize.authenticate();
        console.log("Database connected.");

        await sequelize.sync();

        for (const roleName of DEFAULT_ROLES) {
            const [role] = await Role.findOrCreate({
                where: { roleName },
                defaults: { roleName },
            });
            console.log(
                `Role "${role.roleName}" ${
                    role.createdAt ? "created" : "exists"
                }.`
            );
        }

        console.log("Seed completed.");
    } catch (err) {
        console.error("Seed failed:", err);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

seed();
