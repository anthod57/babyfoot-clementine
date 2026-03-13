/**
 * Generates round-robin match pairs: every team plays every other team exactly once.
 * For n teams, produces n*(n-1)/2 matches.
 */

export interface RoundRobinMatch {
    tournamentId: number;
    homeTeamId: number;
    awayTeamId: number;
}

/**
 * Generate all unique match pairs for a round-robin format.
 * Each pair (A, B) appears exactly once; A is home, B is away.
 *
 * @param teamIds - Array of team IDs participating in the tournament
 * @param tournamentId - Tournament ID for the matches
 * @returns Array of match fixtures (tournamentId, homeTeamId, awayTeamId)
 */
export function generateRoundRobinMatchPairs(
    teamIds: number[],
    tournamentId: number
): RoundRobinMatch[] {
    const ids = [...teamIds];
    if (ids.length < 2) return [];

    const matches: RoundRobinMatch[] = [];
    for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
            matches.push({
                tournamentId,
                homeTeamId: ids[i],
                awayTeamId: ids[j],
            });
        }
    }
    return matches;
}
