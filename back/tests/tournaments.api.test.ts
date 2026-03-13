import request from "supertest";
import app from "../src/app";
import {
    getAdminToken,
    getTestTeamId,
    cleanupTestData,
    closeDatabase,
} from "./setup";
import { sequelize } from "../src/config/database";
import "../src/models";

const BASE = "/v1/tournaments";

const validDates = {
    startDate: "2025-06-01",
    endDate: "2025-06-30",
};

describe("Tournaments API", () => {
    let token: string;
    let createdTournamentId: number;
    let testTeamId: number;

    beforeAll(async () => {
        await sequelize.authenticate();
        await sequelize.sync();
        token = await getAdminToken();
        testTeamId = await getTestTeamId();
    });

    afterAll(async () => {
        await cleanupTestData({
            tournamentNames: [
                "Tournament for teams test",
                "Tournament for matches test",
                "Tournament for add team test",
                "Tournament for remove team test",
            ],
        });
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
    });

    describe("GET /", () => {
        it("should return 200 and array of tournaments", async () => {
            const res = await request(app)
                .get(BASE)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe("POST /", () => {
        it("should return 400 when name is missing", async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    startDate: validDates.startDate,
                    endDate: validDates.endDate,
                });
            expect(res.status).toBe(400);
            expect(res.body.error).toBeDefined();
        });

        it("should return 400 when startDate is missing", async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Test Tournament",
                    endDate: validDates.endDate,
                });
            expect(res.status).toBe(400);
        });

        it("should return 400 when endDate is before startDate", async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Test Tournament",
                    startDate: "2025-06-30",
                    endDate: "2025-06-01",
                });
            expect(res.status).toBe(400);
            expect(res.body.error).toBeDefined();
        });

        it("should create a tournament and return 201", async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Test Tournament CRUD",
                    description: "A test tournament",
                    ...validDates,
                });
            expect(res.status).toBe(201);
            expect(res.body).toMatchObject({
                id: expect.any(Number),
                name: "Test Tournament CRUD",
                description: "A test tournament",
            });
            createdTournamentId = res.body.id;
        });
    });

    describe("GET /:id", () => {
        it("should return 404 for non-existent tournament", async () => {
            const res = await request(app)
                .get(`${BASE}/999999`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(404);
            expect(res.body.error).toContain("not found");
        });

        it("should return 200 and tournament", async () => {
            const res = await request(app)
                .get(`${BASE}/${createdTournamentId}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                id: createdTournamentId,
                name: "Test Tournament CRUD",
                description: "A test tournament",
            });
        });
    });

    describe("PUT /:id", () => {
        it("should return 404 for non-existent tournament", async () => {
            const res = await request(app)
                .put(`${BASE}/999999`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Updated",
                    ...validDates,
                });
            expect(res.status).toBe(404);
        });

        it("should update tournament and return 200", async () => {
            const res = await request(app)
                .put(`${BASE}/${createdTournamentId}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Test Tournament Updated",
                    ...validDates,
                });
            expect(res.status).toBe(200);
            expect(res.body.name).toBe("Test Tournament Updated");
        });
    });

    describe("DELETE /:id", () => {
        it("should return 404 for non-existent tournament", async () => {
            const res = await request(app)
                .delete(`${BASE}/999999`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(404);
        });

        it("should delete tournament and return 204", async () => {
            const res = await request(app)
                .delete(`${BASE}/${createdTournamentId}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(204);
        });

        it("should return 404 after deletion", async () => {
            const res = await request(app)
                .get(`${BASE}/${createdTournamentId}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(404);
        });
    });

    describe("GET /:id/teams", () => {
        let tournamentForTeamsId: number;

        beforeAll(async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Tournament for teams test",
                    ...validDates,
                });
            tournamentForTeamsId = res.body.id;
        });

        it("should return 404 when tournament does not exist", async () => {
            const res = await request(app)
                .get(`${BASE}/999999/teams`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(404);
            expect(res.body.error).toContain("not found");
        });

        it("should return 200 and empty array when no teams", async () => {
            const res = await request(app)
                .get(`${BASE}/${tournamentForTeamsId}/teams`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(0);
        });
    });

    describe("GET /:id/matches", () => {
        let tournamentForMatchesId: number;

        beforeAll(async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Tournament for matches test",
                    ...validDates,
                });
            tournamentForMatchesId = res.body.id;
        });

        it("should return 404 when tournament does not exist", async () => {
            const res = await request(app)
                .get(`${BASE}/999999/matches`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(404);
            expect(res.body.error).toContain("not found");
        });

        it("should return 200 and array of matches (possibly empty)", async () => {
            const res = await request(app)
                .get(`${BASE}/${tournamentForMatchesId}/matches`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe("POST /:id/teams", () => {
        let tournamentForTeamsId: number;

        beforeAll(async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Tournament for add team test",
                    ...validDates,
                });
            tournamentForTeamsId = res.body.id;
        });

        it("should return 404 when tournament does not exist", async () => {
            const res = await request(app)
                .post(`${BASE}/999999/teams`)
                .set("Authorization", `Bearer ${token}`)
                .send({ tournamentId: 999999, teamId: testTeamId });
            expect(res.status).toBe(404);
            expect(res.body.error).toContain("not found");
        });

        it("should return 400 when team does not exist", async () => {
            const res = await request(app)
                .post(`${BASE}/${tournamentForTeamsId}/teams`)
                .set("Authorization", `Bearer ${token}`)
                .send({ tournamentId: tournamentForTeamsId, teamId: 999999 });
            expect(res.status).toBe(400);
            expect(res.body.error).toBeDefined();
        });

        it("should add team to tournament and return 201", async () => {
            const res = await request(app)
                .post(`${BASE}/${tournamentForTeamsId}/teams`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    tournamentId: tournamentForTeamsId,
                    teamId: testTeamId,
                });
            expect(res.status).toBe(201);
        });

        it("should include team in tournament after add", async () => {
            const res = await request(app)
                .get(`${BASE}/${tournamentForTeamsId}/teams`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            const teamInTournament = res.body.find(
                (t: { id: number }) => t.id === testTeamId
            );
            expect(teamInTournament).toBeDefined();
        });
    });

    describe("DELETE /:id/teams/:teamId", () => {
        let tournamentForTeamsId: number;

        beforeAll(async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Tournament for remove team test",
                    ...validDates,
                });
            tournamentForTeamsId = res.body.id;
            await request(app)
                .post(`${BASE}/${tournamentForTeamsId}/teams`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    tournamentId: tournamentForTeamsId,
                    teamId: testTeamId,
                });
        });

        it("should return 404 when team not in tournament", async () => {
            const otherTeamId = 999999;
            const res = await request(app)
                .delete(`${BASE}/${tournamentForTeamsId}/teams/${otherTeamId}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    tournamentId: tournamentForTeamsId,
                    teamId: otherTeamId,
                });
            expect(res.status).toBe(404);
            expect(res.body.error).toContain("not found");
        });

        it("should remove team from tournament and return 204", async () => {
            const res = await request(app)
                .delete(`${BASE}/${tournamentForTeamsId}/teams/${testTeamId}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    tournamentId: tournamentForTeamsId,
                    teamId: testTeamId,
                });
            expect(res.status).toBe(204);
        });

        it("should not include team in tournament after removal", async () => {
            const res = await request(app)
                .get(`${BASE}/${tournamentForTeamsId}/teams`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            const teamInTournament = res.body.find(
                (t: { id: number }) => t.id === testTeamId
            );
            expect(teamInTournament).toBeUndefined();
        });
    });
});
