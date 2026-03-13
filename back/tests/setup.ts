import "dotenv/config";
import { sequelize } from "../src/config/database";
import { User, Role, Team } from "../src/models";
import { hashPassword } from "../src/utils/password";
import { UserRole } from "../src/models/userRoleModel";

process.env.NODE_ENV = "test";

const TEST_ADMIN = {
    email: "admin@test.com",
    password: "Admin123!",
    username: "admin_test",
    name: "Admin",
    surname: "Test",
};

let adminToken: string | null = null;
let testUserId: number | null = null;
let testTeamId: number | null = null;

const TEST_USER = {
    email: "testuser@test.com",
    password: "Test123!",
    username: "test_user",
    name: "Test",
    surname: "User",
};

/**
 * Get a test user ID for adding to teams (creates user if needed)
 * @returns {Promise<number>}
 */
export async function getTestUserId(): Promise<number> {
    if (testUserId) return testUserId;

    await sequelize.authenticate();
    await sequelize.sync();

    const [userRole] = await Role.findOrCreate({
        where: { roleName: "user" },
        defaults: { roleName: "user" },
    });

    let user = await User.findOne({ where: { email: TEST_USER.email } });
    if (!user) {
        const hashed = await hashPassword(TEST_USER.password);
        user = await User.create({
            ...TEST_USER,
            password: hashed,
        });
        await UserRole.create({ userId: user.id, roleId: userRole.id });
    }
    testUserId = user.id;
    return testUserId;
}

/**
 * Get a JWT for the test user (non-admin) for testing role-based access
 * @returns {Promise<string>}
 */
export async function getTestUserToken(): Promise<string> {
    const userId = await getTestUserId();
    const user = await User.findByPk(userId);
    if (!user) throw new Error("Test user not found");
    const { signToken } = await import("../src/utils/jwt");
    return signToken({
        sub: user.id,
        email: user.email,
    });
}

/**
 * Get a test team ID for adding to tournaments (creates team if needed)
 * @returns {Promise<number>}
 */
export async function getTestTeamId(): Promise<number> {
    if (testTeamId) return testTeamId;

    await sequelize.authenticate();
    await sequelize.sync();

    const [team] = await Team.findOrCreate({
        where: { name: "Test Team for Tournaments" },
        defaults: { name: "Test Team for Tournaments" },
    });
    testTeamId = team.id;
    return testTeamId;
}

/**
 * Get an admin JWT for testing purposes
 * @returns {Promise<string>}
 */
export async function getAdminToken(): Promise<string> {
    if (adminToken) return adminToken;

    await sequelize.authenticate();
    await sequelize.sync();

    const [adminRole] = await Role.findOrCreate({
        where: { roleName: "admin" },
        defaults: { roleName: "admin" },
    });

    let admin = await User.findOne({ where: { email: TEST_ADMIN.email } });
    if (!admin) {
        const hashed = await hashPassword(TEST_ADMIN.password);
        admin = await User.create({
            ...TEST_ADMIN,
            password: hashed,
        });
        await UserRole.create({ userId: admin.id, roleId: adminRole.id });
    }

    const { signToken } = await import("../src/utils/jwt");
    adminToken = signToken({
        sub: admin.id,
        email: admin.email,
    });
    return adminToken;
}

/**
 * Close the database connection
 * @returns {Promise<void>}
 */
export async function closeDatabase(): Promise<void> {
    await sequelize.close();
}
