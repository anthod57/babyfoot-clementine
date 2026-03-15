import request from "supertest";
import app from "../src/app";
import {
    getAdminToken,
    getTestUserId,
    getTestUserToken,
    closeDatabase,
} from "./setup";
import { sequelize } from "../src/config/database";
import "../src/models";

const BASE = "/v1/users";

describe("Users API", () => {
    let adminToken: string;
    let testUserToken: string;
    let testUserId: number;
    let createdUserId: number;

    beforeAll(async () => {
        await sequelize.authenticate();
        await sequelize.sync();
        adminToken = await getAdminToken();
        testUserToken = await getTestUserToken();
        testUserId = await getTestUserId();
    });

    afterAll(async () => {
        await closeDatabase();
    });

    describe("Authentication", () => {
        it("GET / should return 401 without token", async () => {
            const res = await request(app).get(BASE);
            expect(res.status).toBe(401);
        });

        it("GET / should return 401 with invalid token", async () => {
            const res = await request(app)
                .get(BASE)
                .set("Authorization", "Bearer invalid-token");
            expect(res.status).toBe(401);
        });

        it("GET / should return 403 for non-admin user", async () => {
            const res = await request(app)
                .get(BASE)
                .set("Authorization", `Bearer ${testUserToken}`);
            expect(res.status).toBe(403);
        });
    });

    describe("GET /", () => {
        it("should return 200 and array of users (admin)", async () => {
            const res = await request(app)
                .get(BASE)
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe("GET /:id", () => {
        it("should return 401 without token", async () => {
            const res = await request(app).get(`${BASE}/${testUserId}`);
            expect(res.status).toBe(401);
        });

        it("should return 404 for non-existent user", async () => {
            const res = await request(app)
                .get(`${BASE}/999999`)
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(404);
            expect(res.body.error).toContain("not found");
        });

        it("should return 200 and user by id", async () => {
            const res = await request(app)
                .get(`${BASE}/${testUserId}`)
                .set("Authorization", `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                id: testUserId,
                username: "test_user",
                name: "Test",
                surname: "User",
                email: "testuser@test.com",
            });
            expect(res.body.password).toBeUndefined();
        });
    });

    describe("POST /", () => {
        const uniqueSuffix = Date.now();

        it("should return 400 when username is missing", async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    name: "New",
                    surname: "User",
                    email: `newuser${uniqueSuffix}@test.com`,
                    password: "Password123!",
                });
            expect(res.status).toBe(400);
            expect(res.body.error).toBeDefined();
        });

        it("should return 400 when email is invalid", async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    username: `newuser_${uniqueSuffix}`,
                    name: "New",
                    surname: "User",
                    email: "invalid-email",
                    password: "Password123!",
                });
            expect(res.status).toBe(400);
        });

        it("should return 400 when password is too short", async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    username: `newuser_${uniqueSuffix}`,
                    name: "New",
                    surname: "User",
                    email: `newuser${uniqueSuffix}@test.com`,
                    password: "short",
                });
            expect(res.status).toBe(400);
        });

        it("should create a user and return 201", async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    username: `newuser_${uniqueSuffix}`,
                    name: "New",
                    surname: "User",
                    email: `newuser${uniqueSuffix}@test.com`,
                    password: "Password123!",
                });
            expect(res.status).toBe(201);
            expect(res.body).toMatchObject({
                id: expect.any(Number),
                username: `newuser_${uniqueSuffix}`,
                name: "New",
                surname: "User",
                email: `newuser${uniqueSuffix}@test.com`,
            });
            expect(res.body.password).toBeUndefined();
            createdUserId = res.body.id;
        });

        it("should return 400 when email already exists", async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    username: `other_${uniqueSuffix}`,
                    name: "Other",
                    surname: "User",
                    email: `newuser${uniqueSuffix}@test.com`,
                    password: "Password123!",
                });
            expect(res.status).toBe(400);
        });

        it("should return 400 when username already exists", async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({
                    username: `newuser_${uniqueSuffix}`,
                    name: "Other",
                    surname: "User",
                    email: `other${uniqueSuffix}@test.com`,
                    password: "Password123!",
                });
            expect(res.status).toBe(400);
        });
    });
});
