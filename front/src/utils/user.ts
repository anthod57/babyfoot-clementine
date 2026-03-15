/** User-like object with optional name/surname for display. */
interface UserLike {
    name?: string;
    surname?: string;
    username?: string;
    fullName?: string;
}

/**
 * Returns a display string for a user (name + surname, or fallbacks).
 * @param {UserLike} user
 * @returns {string}
 */
export function formatUserDisplayName(user: UserLike): string {
    const name = (
        user.fullName ?? [user.name, user.surname].filter(Boolean).join(" ")
    )?.trim();

    return name || (user.username ?? "?");
}

/**
 * Returns a lowercase key for sorting users by name (locale-aware).
 * @param {UserLike} user
 * @returns {string}
 */
export function getUserSortKey(user: UserLike): string {
    return (
        [user.name, user.surname].filter(Boolean).join(" ").toLowerCase() || "?"
    );
}

/**
 * Sorts an array by user display name (French locale).
 * @param {UserLike} a
 * @param {UserLike} b
 * @returns {number}
 */
export function compareUsersByName(a: UserLike, b: UserLike): number {
    return getUserSortKey(a).localeCompare(getUserSortKey(b), "fr");
}
