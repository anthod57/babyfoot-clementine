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
        it("GET / should return 200 without token", async () => {
            const res = await request(app).get(BASE);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it("GET / should return 200 with an invalid token", async () => {
            const res = await request(app)
                .get(BASE)
                .set("Authorization", "Bearer invalid-token");
            expect(res.status).toBe(200);
        });

        it("POST / should return 401 without token", async () => {
            const res = await request(app).post(BASE).send({});
            expect(res.status).toBe(401);
        });

        it("POST / should return 401 with invalid token", async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", "Bearer invalid-token")
                .send({});
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
                homeScore: 0,
                awayScore: 0,
                result: MatchResult.PENDING,
            });
            expect(res.body.homeTeam).toBeDefined();
            expect(res.body.awayTeam).toBeDefined();
            createdMatchId = res.body.id;
        });
    });

    describe("GET / - date filter", () => {
        const DATE_A = "2025-07-15"; // same date as createdMatch (created in POST block)
        const DATE_B = "2025-09-10"; // different day — must return nothing when filtering on DATE_A
        let matchOnDateBId: number;

        beforeAll(async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    tournamentId,
                    date: `${DATE_B}T10:00:00.000Z`,
                    homeTeamId,
                    awayTeamId,
                });
            matchOnDateBId = res.body.id;
        });

        afterAll(async () => {
            await request(app)
                .delete(`${BASE}/${matchOnDateBId}`)
                .set("Authorization", `Bearer ${token}`);
        });

        it("should return 400 for an invalid date format", async () => {
            const res = await request(app)
                .get(`${BASE}?date=15-07-2025`) // DD-MM-YYYY is not valid
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(400);
        });

        it("should return only matches on DATE_A when filtering by DATE_A", async () => {
            const res = await request(app)
                .get(`${BASE}?date=${DATE_A}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);

            // Every returned match must fall on DATE_A
            for (const match of res.body as Array<{ date: string }>) {
                expect(match.date.slice(0, 10)).toBe(DATE_A);
            }
        });

        it("should not include the DATE_B match when filtering by DATE_A", async () => {
            const res = await request(app)
                .get(`${BASE}?date=${DATE_A}`)
                .set("Authorization", `Bearer ${token}`);

            const ids = (res.body as Array<{ id: number }>).map(m => m.id);
            expect(ids).not.toContain(matchOnDateBId);
        });

        it("should return only the DATE_B match when filtering by DATE_B", async () => {
            const res = await request(app)
                .get(`${BASE}?date=${DATE_B}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            const ids = (res.body as Array<{ id: number }>).map(m => m.id);
            expect(ids).toContain(matchOnDateBId);
            expect(ids).not.toContain(createdMatchId);
        });

        it("should return an empty array when no match exists on the given date", async () => {
            const res = await request(app)
                .get(`${BASE}?date=2099-12-31`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });
    });

    describe("GET / - result filter", () => {
        // createdMatch (from POST block) has result = PENDING (0)
        // We create a second match and update it to HOME_TEAM_WIN (1) to test filtering
        let finishedMatchId: number;

        beforeAll(async () => {
            const res = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    tournamentId,
                    date: "2025-07-15T12:00:00.000Z",
                    homeTeamId,
                    awayTeamId,
                });
            finishedMatchId = res.body.id;

            await request(app)
                .put(`${BASE}/${finishedMatchId}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ result: MatchResult.HOME_TEAM_WIN, homeScore: 3, awayScore: 1 });
        });

        afterAll(async () => {
            await request(app)
                .delete(`${BASE}/${finishedMatchId}`)
                .set("Authorization", `Bearer ${token}`);
        });

        it("should return 400 for an invalid result value", async () => {
            const res = await request(app)
                .get(`${BASE}?result=99`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(400);
        });

        it("should return only PENDING matches when result=0", async () => {
            const res = await request(app)
                .get(`${BASE}?result=0`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            for (const match of res.body as Array<{ result: number }>) {
                expect(match.result).toBe(MatchResult.PENDING);
            }
            const ids = (res.body as Array<{ id: number }>).map(m => m.id);
            expect(ids).not.toContain(finishedMatchId);
        });

        it("should return only HOME_WIN matches when result=1", async () => {
            const res = await request(app)
                .get(`${BASE}?result=1`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            for (const match of res.body as Array<{ result: number }>) {
                expect(match.result).toBe(MatchResult.HOME_TEAM_WIN);
            }
            const ids = (res.body as Array<{ id: number }>).map(m => m.id);
            expect(ids).toContain(finishedMatchId);
        });

        it("should combine date and result filters", async () => {
            const res = await request(app)
                .get(`${BASE}?date=2025-07-15&result=0`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            for (const match of res.body as Array<{ result: number }>) {
                expect(match.result).toBe(MatchResult.PENDING);
            }
            const ids = (res.body as Array<{ id: number }>).map(m => m.id);
            expect(ids).not.toContain(finishedMatchId);
        });

        it("should return results ordered by date ASC", async () => {
            const res = await request(app)
                .get(BASE)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            const dates = (res.body as Array<{ date: string }>).map(m => m.date);
            for (let i = 1; i < dates.length; i++) {
                expect(dates[i]! >= dates[i - 1]!).toBe(true);
            }
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

        it("should update homeScore and awayScore and return 200", async () => {
            const res = await request(app)
                .put(`${BASE}/${createdMatchId}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ homeScore: 10, awayScore: 7 });
            expect(res.status).toBe(200);
            expect(res.body.homeScore).toBe(10);
            expect(res.body.awayScore).toBe(7);
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
