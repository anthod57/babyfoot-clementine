import request from "supertest";
import app from "../src/app";
import {
    getAdminToken,
    getTestUserId,
    cleanupTestData,
    closeDatabase,
} from "./setup";
import { sequelize } from "../src/config/database";
import "../src/models";

const BASE = "/v1/teams";

describe("Teams API", () => {
    let token: string;
    let createdTeamId: number;
    let testUserId: number;

    beforeAll(async () => {
        await sequelize.authenticate();
        await sequelize.sync();
        token = await getAdminToken();
        testUserId = await getTestUserId();
    });

    afterAll(async () => {
        await cleanupTestData({
            teamNames: [
                "Team for users test",
                "Team for remove user test",
            ],
        });
        await closeDatabase();
    });

    describe("Authentication", () => {
        // GET / is a public route — no token required
        it("GET / should return 200 without token", async () => {
            const res = await request(app).get(BASE);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("data");
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it("GET / should return 200 with invalid token (public route)", async () => {
            const res = await request(app)
                .get(BASE)
                .set("Authorization", "Bearer invalid-token");
            expect(res.status).toBe(200);
        });
    });

    describe("GET /", () => {
        it("should return 200 and array of teams", async () => {
            const res = await request(app)
                .get(BASE)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("data");
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe("POST /", () => {
        it("should return 400 when name is missing", async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${token}`)
                .send({});
            expect(res.status).toBe(400);
            expect(res.body.error).toBeDefined();
        });

        it("should return 400 when name is empty", async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${token}`)
                .send({ name: "" });
            expect(res.status).toBe(400);
        });

        it("should create a team and return 201", async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${token}`)
                .send({ name: "Test Team CRUD" });
            expect(res.status).toBe(201);
            expect(res.body).toMatchObject({
                id: expect.any(Number),
                name: "Test Team CRUD",
                users: expect.any(Array),
            });
            createdTeamId = res.body.id;
        });
    });

    describe("GET /:id", () => {
        it("should return 404 for non-existent team", async () => {
            const res = await request(app)
                .get(`${BASE}/999999`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(404);
            expect(res.body.error).toContain("not found");
        });

        it("should return 200 and team with users", async () => {
            const res = await request(app)
                .get(`${BASE}/${createdTeamId}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                id: createdTeamId,
                name: "Test Team CRUD",
                users: expect.any(Array),
            });
            expect(Array.isArray(res.body.users)).toBe(true);
            res.body.users.forEach((u: { id: number; fullName: string }) => {
                expect(u).toHaveProperty("id");
                expect(u).toHaveProperty("fullName");
            });
        });
    });

    describe("PUT /:id", () => {
        it("should return 404 for non-existent team", async () => {
            const res = await request(app)
                .put(`${BASE}/999999`)
                .set("Authorization", `Bearer ${token}`)
                .send({ name: "Updated" });
            expect(res.status).toBe(404);
        });

        it("should update team and return 200", async () => {
            const res = await request(app)
                .put(`${BASE}/${createdTeamId}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ name: "Test Team Updated" });
            expect(res.status).toBe(200);
            expect(res.body.name).toBe("Test Team Updated");
            expect(res.body.users).toBeDefined();
        });
    });

    describe("DELETE /:id", () => {
        it("should return 404 for non-existent team", async () => {
            const res = await request(app)
                .delete(`${BASE}/999999`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(404);
        });

        it("should delete team and return 204", async () => {
            const res = await request(app)
                .delete(`${BASE}/${createdTeamId}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(204);
        });

        it("should return 404 after deletion", async () => {
            const res = await request(app)
                .get(`${BASE}/${createdTeamId}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(404);
        });
    });

    describe("POST /:id/users", () => {
        let teamForUsersId: number;

        beforeAll(async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${token}`)
                .send({ name: "Team for users test" });
            teamForUsersId = res.body.id;
        });

        it("should return 404 when team does not exist", async () => {
            const res = await request(app)
                .post(`${BASE}/999999/users`)
                .set("Authorization", `Bearer ${token}`)
                .send({ userId: testUserId });
            expect(res.status).toBe(404);
            expect(res.body.error).toContain("not found");
        });

        it("should return 404 when user does not exist", async () => {
            const res = await request(app)
                .post(`${BASE}/${teamForUsersId}/users`)
                .set("Authorization", `Bearer ${token}`)
                .send({ userId: 999999 });
            expect(res.status).toBe(404);
            expect(res.body.error).toContain("not found");
        });

        it("should return 400 when userId is missing", async () => {
            const res = await request(app)
                .post(`${BASE}/${teamForUsersId}/users`)
                .set("Authorization", `Bearer ${token}`)
                .send({});
            expect(res.status).toBe(400);
        });

        it("should add user to team and return 201", async () => {
            const res = await request(app)
                .post(`${BASE}/${teamForUsersId}/users`)
                .set("Authorization", `Bearer ${token}`)
                .send({ userId: testUserId });
            expect(res.status).toBe(201);
        });

        it("should include user in team after add", async () => {
            const res = await request(app)
                .get(`${BASE}/${teamForUsersId}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            const userInTeam = res.body.users.find(
                (u: { id: number }) => u.id === testUserId
            );
            expect(userInTeam).toBeDefined();
            expect(userInTeam.fullName).toBe("Test User");
        });
    });

    describe("DELETE /:id/users/:userId", () => {
        let teamForUsersId: number;

        beforeAll(async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${token}`)
                .send({ name: "Team for remove user test" });
            teamForUsersId = res.body.id;
            await request(app)
                .post(`${BASE}/${teamForUsersId}/users`)
                .set("Authorization", `Bearer ${token}`)
                .send({ userId: testUserId });
        });

        it("should return 404 when user not in team", async () => {
            const otherUserId = 999999;
            const res = await request(app)
                .delete(`${BASE}/${teamForUsersId}/users/${otherUserId}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(404);
            expect(res.body.error).toContain("not found");
        });

        it("should remove user from team and return 204", async () => {
            const res = await request(app)
                .delete(`${BASE}/${teamForUsersId}/users/${testUserId}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(204);
        });

        it("should not include user in team after removal", async () => {
            const res = await request(app)
                .get(`${BASE}/${teamForUsersId}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            const userInTeam = res.body.users.find(
                (u: { id: number }) => u.id === testUserId
            );
            expect(userInTeam).toBeUndefined();
        });
    });
});
