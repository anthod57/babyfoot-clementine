import {
    generateRoundRobinMatchPairs,
    RoundRobinMatch,
} from "../src/utils/roundRobinGenerator";

describe("roundRobinGenerator", () => {
    const tournamentId = 42;

    describe("generateRoundRobinMatchPairs", () => {
        it("should return empty array for empty team list", () => {
            expect(generateRoundRobinMatchPairs([], tournamentId)).toEqual([]);
        });

        it("should return empty array for single team", () => {
            expect(generateRoundRobinMatchPairs([1], tournamentId)).toEqual([]);
        });

        it("should return 1 match for 2 teams", () => {
            const result = generateRoundRobinMatchPairs([1, 2], tournamentId);
            expect(result).toHaveLength(1);
            expect(result).toContainEqual({
                tournamentId,
                homeTeamId: 1,
                awayTeamId: 2,
            });
        });

        it("should return 3 matches for 3 teams", () => {
            const result = generateRoundRobinMatchPairs([10, 20, 30], tournamentId);
            expect(result).toHaveLength(3);
            expect(result).toContainEqual({
                tournamentId,
                homeTeamId: 10,
                awayTeamId: 20,
            });
            expect(result).toContainEqual({
                tournamentId,
                homeTeamId: 10,
                awayTeamId: 30,
            });
            expect(result).toContainEqual({
                tournamentId,
                homeTeamId: 20,
                awayTeamId: 30,
            });
        });

        it("should return 6 matches for 4 teams", () => {
            const result = generateRoundRobinMatchPairs([1, 2, 3, 4], tournamentId);
            expect(result).toHaveLength(6);
            const expected: RoundRobinMatch[] = [
                { tournamentId, homeTeamId: 1, awayTeamId: 2 },
                { tournamentId, homeTeamId: 1, awayTeamId: 3 },
                { tournamentId, homeTeamId: 1, awayTeamId: 4 },
                { tournamentId, homeTeamId: 2, awayTeamId: 3 },
                { tournamentId, homeTeamId: 2, awayTeamId: 4 },
                { tournamentId, homeTeamId: 3, awayTeamId: 4 },
            ];
            expect(result).toEqual(expect.arrayContaining(expected));
            expect(result).toHaveLength(expected.length);
        });

        it("should ensure each pair appears exactly once (no duplicates)", () => {
            const result = generateRoundRobinMatchPairs([1, 2, 3, 4], tournamentId);
            const pairs = result.map(
                (m) => `${Math.min(m.homeTeamId, m.awayTeamId)}-${Math.max(m.homeTeamId, m.awayTeamId)}`
            );
            const unique = new Set(pairs);
            expect(unique.size).toBe(pairs.length);
        });

        it("should not mutate the input array", () => {
            const input = [1, 2, 3];
            const copy = [...input];
            generateRoundRobinMatchPairs(input, tournamentId);
            expect(input).toEqual(copy);
        });

        it("should produce n*(n-1)/2 matches for n teams", () => {
            for (const n of [2, 5, 8, 10]) {
                const teamIds = Array.from({ length: n }, (_, i) => i + 1);
                const result = generateRoundRobinMatchPairs(teamIds, tournamentId);
                expect(result).toHaveLength((n * (n - 1)) / 2);
            }
        });
    });
});
