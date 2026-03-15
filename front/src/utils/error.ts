/**
 * Extracts a readable message from an unknown error, with fallback.
 * @param {unknown} error
 * @param {string} fallback
 * @returns {string}
 */
export function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}
