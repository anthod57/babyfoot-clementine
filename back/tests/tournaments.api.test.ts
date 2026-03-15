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

/** Extract tournaments array from paginated GET / response */
function getTournaments(res: { body: { data?: unknown[] } }) {
    return Array.isArray(res.body?.data) ? res.body.data : res.body;
}

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
        // GET / is a public route — no token required
        it("GET / should return 200 without token", async () => {
            const res = await request(app).get(BASE);
            expect(res.status).toBe(200);
            expect(Array.isArray(getTournaments(res))).toBe(true);
        });

        it("GET / should return 200 with an invalid token (public route)", async () => {
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
        it("should return 200 and array of tournaments", async () => {
            const res = await request(app)
                .get(BASE)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(getTournaments(res))).toBe(true);
        });
    });

    describe("GET / - date filter", () => {
        // T_IN  : 2030-01-10 → 2030-01-20  (active on 2030-01-15)
        // T_OUT : 2030-02-01 → 2030-02-28  (NOT active on 2030-01-15)
        const DATE_INSIDE  = "2030-01-15";
        const DATE_OUTSIDE = "2030-12-31"; // no tournament active this day
        let tournamentInId: number;
        let tournamentOutId: number;

        beforeAll(async () => {
            const resIn = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${token}`)
                .send({ name: "T_IN date filter test",  startDate: "2030-01-10", endDate: "2030-01-20" });
            tournamentInId = resIn.body.id;

            const resOut = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${token}`)
                .send({ name: "T_OUT date filter test", startDate: "2030-02-01", endDate: "2030-02-28" });
            tournamentOutId = resOut.body.id;
        });

        afterAll(async () => {
            await request(app).delete(`${BASE}/${tournamentInId}`) .set("Authorization", `Bearer ${token}`);
            await request(app).delete(`${BASE}/${tournamentOutId}`).set("Authorization", `Bearer ${token}`);
        });

        it("should return 400 for an invalid date format", async () => {
            const res = await request(app)
                .get(`${BASE}?date=15-01-2030`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(400);
        });

        it("should return only tournaments active on DATE_INSIDE", async () => {
            const res = await request(app)
                .get(`${BASE}?date=${DATE_INSIDE}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            const tournaments = getTournaments(res) as Array<{ id: number }>;
            const ids = tournaments.map(t => t.id);
            expect(ids).toContain(tournamentInId);
            expect(ids).not.toContain(tournamentOutId);
        });

        it("should not return T_IN when filtering on T_OUT start date", async () => {
            const res = await request(app)
                .get(`${BASE}?date=2030-02-15`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            const tournaments = getTournaments(res) as Array<{ id: number }>;
            const ids = tournaments.map(t => t.id);
            expect(ids).toContain(tournamentOutId);
            expect(ids).not.toContain(tournamentInId);
        });

        it("should return empty array when no tournament is active on the given date", async () => {
            const res = await request(app)
                .get(`${BASE}?date=${DATE_OUTSIDE}`)
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(getTournaments(res)).toEqual([]);
        });

        it("should include tournaments whose range covers the boundary start date", async () => {
            const res = await request(app)
                .get(`${BASE}?date=2030-01-10`)
                .set("Authorization", `Bearer ${token}`);
            const tournaments = getTournaments(res) as Array<{ id: number }>;
            const ids = tournaments.map(t => t.id);
            expect(ids).toContain(tournamentInId);
        });

        it("should include tournaments whose range covers the boundary end date", async () => {
            const res = await request(app)
                .get(`${BASE}?date=2030-01-20`)
                .set("Authorization", `Bearer ${token}`);
            const tournaments = getTournaments(res) as Array<{ id: number }>;
            const ids = tournaments.map(t => t.id);
            expect(ids).toContain(tournamentInId);
        });

        it("should return results ordered by startDate ASC", async () => {
            // Create a second tournament that starts earlier within the same window
            const resEarly = await request(app)
                .post(BASE)
                .set("Authorization", `Bearer ${token}`)
                .send({ name: "T_EARLY date filter test", startDate: "2030-01-10", endDate: "2030-01-18" });
            const earlyId = resEarly.body.id;

            const res = await request(app)
                .get(`${BASE}?date=${DATE_INSIDE}`)
                .set("Authorization", `Bearer ${token}`);
            const tournaments = getTournaments(res) as Array<{ id: number; startDate: string }>;

            // Verify ascending order
            for (let i = 1; i < tournaments.length; i++) {
                expect(tournaments[i]!.startDate >= tournaments[i - 1]!.startDate).toBe(true);
            }

            await request(app).delete(`${BASE}/${earlyId}`).set("Authorization", `Bearer ${token}`);
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
