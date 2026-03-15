import "dotenv/config";
import { faker } from "@faker-js/faker";
import { sequelize } from "../config/database";
import {
    Role,
    User,
    UserRole,
    Team,
    Tournament,
    TeamTournamentParticipation,
    TeamHasUser,
    Match,
} from "../models";
import { hashPassword } from "../utils/password";
import { MatchResult } from "../models/matchModel";

const DEFAULT_PASSWORD = "Password123!";
const ADMIN_CREDENTIALS = {
    email: "admin@babyfoot.local",
    password: DEFAULT_PASSWORD,
    username: "admin",
    name: "Admin",
    surname: "Clementine",
};

const NB_USERS = 100;
const NB_TEAMS = 100;
const NB_TOURNAMENTS = 100;
const USERS_PER_TEAM = 4;
const TEAMS_PER_TOURNAMENT = 16;

async function seed(): Promise<void> {
    try {
        await sequelize.authenticate();
        console.log("Database connected.");
        await sequelize.sync();

        // Roles
        const [adminRole] = await Role.findOrCreate({
            where: { roleName: "admin" },
            defaults: { roleName: "admin" },
        });
        const [userRole] = await Role.findOrCreate({
            where: { roleName: "user" },
            defaults: { roleName: "user" },
        });
        console.log("Roles ready.");

        // Admin user
        let admin = await User.findOne({
            where: { email: ADMIN_CREDENTIALS.email },
        });
        if (!admin) {
            admin = await User.create({
                ...ADMIN_CREDENTIALS,
                password: await hashPassword(ADMIN_CREDENTIALS.password),
            });
            await UserRole.create({ userId: admin.id, roleId: adminRole.id });
            console.log(
                `Admin created: ${ADMIN_CREDENTIALS.email} / ${ADMIN_CREDENTIALS.password}`
            );
        } else {
            console.log("Admin already exists.");
        }

        // Regular users
        const users: User[] = [];
        const usedEmails = new Set<string>([ADMIN_CREDENTIALS.email]);
        const usedUsernames = new Set<string>([ADMIN_CREDENTIALS.username]);

        for (let i = 0; i < NB_USERS; i++) {
            let email = faker.internet.email().toLowerCase();
            let username = faker.internet
                .userName()
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, "_");
            while (usedEmails.has(email)) {
                email = faker.internet.email().toLowerCase();
            }
            while (usedUsernames.has(username)) {
                username = faker.internet
                    .userName()
                    .toLowerCase()
                    .replace(/[^a-z0-9_]/g, "_");
            }
            usedEmails.add(email);
            usedUsernames.add(username);

            const user = await User.create({
                username,
                name: faker.person.firstName(),
                surname: faker.person.lastName(),
                email,
                password: await hashPassword(DEFAULT_PASSWORD),
            });
            await UserRole.create({ userId: user.id, roleId: userRole.id });
            users.push(user);
        }
        console.log(`${users.length} users created.`);

        // Teams
        const teamNames = [
            "Les Aigles",
            "Les Champions",
            "Foot Magique",
            "Équipe Alpha",
            "Baby Masters",
            "Table Ronde",
            "Les Foudres",
            "Balles Rapides",
        ];
        const teams: Team[] = [];
        for (let i = 0; i < NB_TEAMS; i++) {
            const name =
                teamNames[i] ?? `Équipe ${faker.word.adjective()} ${i + 1}`;
            const [team] = await Team.findOrCreate({
                where: { name },
                defaults: { name },
            });
            teams.push(team);
        }
        console.log(`${teams.length} teams created.`);

        // Assign users to teams
        let assignments = 0;
        for (const team of teams) {
            const count = Math.min(USERS_PER_TEAM, users.length);
            const shuffled = [...users].sort(() => Math.random() - 0.5);
            for (let j = 0; j < count; j++) {
                const user = shuffled[j];
                if (user) {
                    const exists = await TeamHasUser.findOne({
                        where: { teamId: team.id, userId: user.id },
                    });
                    if (!exists) {
                        await TeamHasUser.create({
                            teamId: team.id,
                            userId: user.id,
                        });
                        assignments++;
                    }
                }
            }
        }
        console.log(`${assignments} user-team assignments created.`);

        // Tournaments — spread across past (-90d), present, and future (+90d) for a
        // realistic dataset: some tournaments already have results, others are ongoing
        // or upcoming.
        const now = new Date();
        const tournaments: Tournament[] = [];
        for (let i = 0; i < NB_TOURNAMENTS; i++) {
            // refDate ranges from 90 days ago to 60 days from now
            const refDate = faker.date.between({
                from: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
                to:   new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
            });
            const startDate = faker.date.soon({ days: 5, refDate });
            const endDate   = faker.date.soon({ days: 30, refDate: startDate });
            const name        = `Tournoi ${faker.word.adjective()} ${i + 1}`;
            const description = faker.lorem.sentence();
            const [tournament] = await Tournament.findOrCreate({
                where: { name },
                defaults: { name, description, startDate, endDate },
            });
            tournaments.push(tournament);
        }
        console.log(`${tournaments.length} tournaments created.`);

        // Assign teams to tournaments
        let participations = 0;
        for (const tournament of tournaments) {
            const selected = [...teams]
                .sort(() => Math.random() - 0.5)
                .slice(0, TEAMS_PER_TOURNAMENT);
            for (const team of selected) {
                const exists = await TeamTournamentParticipation.findOne({
                    where: { tournamentId: tournament.id, teamId: team.id },
                });
                if (!exists) {
                    await TeamTournamentParticipation.create({
                        tournamentId: tournament.id,
                        teamId: team.id,
                    });
                    participations++;
                }
            }
        }
        console.log(`${participations} team-tournament participations created.`);

        // Matches — max 4 per day, scheduled at clean hours (10h, 12h, 14h, 16h).
        // We walk through each day of the tournament and consume team pairs one by one
        // until we run out of unique pairs or reach the end date. Past matches get a
        // random result and realistic scores; future matches stay PENDING with score 0-0.
        const MATCH_SLOTS   = [10, 12, 14, 16]; // hours — max 4 matches/day
        const MAX_PER_DAY   = MATCH_SLOTS.length;

        function pickScores(result: MatchResult): { homeScore: number; awayScore: number } {
            if (result === MatchResult.PENDING) return { homeScore: 0, awayScore: 0 };
            const winner = faker.number.int({ min: 1, max: 10 });
            const loser  = faker.number.int({ min: 0, max: winner - 1 });
            if (result === MatchResult.DRAW) return { homeScore: winner, awayScore: winner };
            return result === MatchResult.HOME_TEAM_WIN
                ? { homeScore: winner, awayScore: loser }
                : { homeScore: loser,  awayScore: winner };
        }

        let totalMatches = 0;
        for (const tournament of tournaments) {
            const participatingTeams = await TeamTournamentParticipation.findAll({
                where: { tournamentId: tournament.id },
            });
            const teamIds = participatingTeams.map((p) => p.teamId);
            if (teamIds.length < 2) continue;

            // Build every unique pair once, then shuffle for variety
            const pairs: [number, number][] = [];
            for (let i = 0; i < teamIds.length; i++) {
                for (let j = i + 1; j < teamIds.length; j++) {
                    pairs.push([teamIds[i]!, teamIds[j]!]);
                }
            }
            pairs.sort(() => Math.random() - 0.5);

            // Walk day by day and assign up to MAX_PER_DAY pairs per day
            const day = new Date(tournament.startDate);
            day.setHours(0, 0, 0, 0);
            const end = new Date(tournament.endDate);
            end.setHours(0, 0, 0, 0);

            let pairIdx = 0;
            while (day <= end && pairIdx < pairs.length) {
                const count = Math.min(MAX_PER_DAY, pairs.length - pairIdx);
                for (let s = 0; s < count; s++) {
                    const [homeTeamId, awayTeamId] = pairs[pairIdx++]!;
                    const matchDate = new Date(day);
                    matchDate.setHours(MATCH_SLOTS[s]!, 0, 0, 0);

                    const isPast  = matchDate < now;
                    const result  = isPast
                        ? faker.helpers.arrayElement([
                            MatchResult.HOME_TEAM_WIN,
                            MatchResult.AWAY_TEAM_WIN,
                            MatchResult.DRAW,
                          ])
                        : MatchResult.PENDING;
                    const { homeScore, awayScore } = pickScores(result);

                    await Match.create({
                        tournamentId: tournament.id,
                        date: matchDate,
                        homeTeamId,
                        awayTeamId,
                        homeScore,
                        awayScore,
                        result,
                    });
                    totalMatches++;
                }
                day.setDate(day.getDate() + 1);
            }
        }
        console.log(`${totalMatches} matches created.`);

        console.log("\nSeed completed.");
    } catch (err) {
        console.error("Seed failed:", err);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

seed();
