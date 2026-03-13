import request from "supertest";
import app from "../src/app";
import {
    getAdminToken,
    getTestTeamId,
    getSecondTestTeamId,
    getTestTournamentId,
    closeDatabase,
} from "./setup";
import { sequelize } from "../src/config/database";
import "../src/models";
import { MatchResult } from "../src/models/matchModel";

const BASE = "/v1/matches";

describe("Matches API", () => {
    let token: string;
    let tournamentId: number;
    let homeTeamId: number;
    let awayTeamId: number;
    let createdMatchId: number;

    beforeAll(async () => {
        await sequelize.authenticate();
        await sequelize.sync();
        await sequelize.query("DELETE FROM matches");
        await sequelize.sync({ alter: true });
        token = await getAdminToken();
        tournamentId = await getTestTournamentId();
        homeTeamId = await getTestTeamId();
        awayTeamId = await getSecondTestTeamId();
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
    });

    describe("GET /", () => {
        it("should return 200 and array of matches", async () => {
            const res = await request(app)
                .get(BASE)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe("POST /", () => {
        const matchDate = "2025-07-15T14:00:00.000Z";

        it("should return 400 when date is missing", async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    tournamentId,
                    homeTeamId,
                    awayTeamId,
                });
            expect(res.status).toBe(400);
            expect(res.body.error).toBeDefined();
        });

        it("should return 400 when home and away teams are the same", async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    tournamentId,
                    date: matchDate,
                    homeTeamId,
                    awayTeamId: homeTeamId,
                });
            expect(res.status).toBe(400);
            expect(res.body.error).toBeDefined();
        });

        it("should return 404 when tournament does not exist", async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    tournamentId: 999999,
                    date: matchDate,
                    homeTeamId,
                    awayTeamId,
                });
            expect(res.status).toBe(404);
            expect(res.body.error).toContain("not found");
        });

        it("should return 404 when home team does not exist", async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    tournamentId,
                    date: matchDate,
                    homeTeamId: 999999,
                    awayTeamId,
                });
            expect(res.status).toBe(404);
            expect(res.body.error).toContain("not found");
        });

        it("should return 404 when away team does not exist", async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    tournamentId,
                    date: matchDate,
                    homeTeamId,
                    awayTeamId: 999999,
                });
            expect(res.status).toBe(404);
            expect(res.body.error).toContain("not found");
        });

        it("should create a match and return 201", async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    tournamentId,
                    date: matchDate,
                    homeTeamId,
                    awayTeamId,
                });
            expect(res.status).toBe(201);
            expect(res.body).toMatchObject({
                id: expect.any(Number),
                tournamentId,
                date: expect.any(String),
                homeTeamId,
                awayTeamId,
                result: MatchResult.PENDING,
            });
            expect(res.body.homeTeam).toBeDefined();
            expect(res.body.awayTeam).toBeDefined();
            createdMatchId = res.body.id;
        });
    });

    describe("GET /:id", () => {
        it("should return 404 for non-existent match", async () => {
            const res = await request(app)
                .get(`${BASE}/999999`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(404);
            expect(res.body.error).toContain("not found");
        });

        it("should return 200 and match with teams", async () => {
            const res = await request(app)
                .get(`${BASE}/${createdMatchId}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                id: createdMatchId,
                homeTeamId,
                awayTeamId,
            });
            expect(res.body.homeTeam).toMatchObject({ id: homeTeamId });
            expect(res.body.awayTeam).toMatchObject({ id: awayTeamId });
        });
    });

    describe("PUT /:id", () => {
        it("should return 404 for non-existent match", async () => {
            const res = await request(app)
                .put(`${BASE}/999999`)
                .set("Authorization", `Bearer ${token}`)
                .send({ result: MatchResult.HOME_TEAM_WIN });
            expect(res.status).toBe(404);
        });

        it("should return 400 when updating with same home and away", async () => {
            const res = await request(app)
                .put(`${BASE}/${createdMatchId}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    homeTeamId,
                    awayTeamId: homeTeamId,
                });
            expect(res.status).toBe(400);
            expect(res.body.error).toBeDefined();
        });

        it("should update match result and return 200", async () => {
            const res = await request(app)
                .put(`${BASE}/${createdMatchId}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ result: MatchResult.HOME_TEAM_WIN });
            expect(res.status).toBe(200);
            expect(res.body.result).toBe(MatchResult.HOME_TEAM_WIN);
        });
    });

    describe("DELETE /:id", () => {
        it("should return 404 for non-existent match", async () => {
            const res = await request(app)
                .delete(`${BASE}/999999`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(404);
        });

        it("should delete match and return 204", async () => {
            const res = await request(app)
                .delete(`${BASE}/${createdMatchId}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(204);
        });

        it("should return 404 after deletion", async () => {
            const res = await request(app)
                .get(`${BASE}/${createdMatchId}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(404);
        });
    });
});
