const LOCALE = "fr-FR";

/**
 * Format a date to a human readable date
 * @param {Date | string} date
 * @returns {string}
 */
export function formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString(LOCALE, {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

/**
 * Format a date to a human readable short date
 * @param {Date | string} date
 * @returns {string}
 */
export function formatDateShort(date: Date | string): string {
    return new Date(date).toLocaleDateString(LOCALE, {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

/**
 * Format a date to a human readable time
 * @param {Date | string} date
 * @returns {string}
 */
export function formatTime(date: Date | string): string {
    return new Date(date).toLocaleTimeString(LOCALE, {
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Format a date to a human readable date and time
 * @param {Date | string} date
 * @returns {string}
 */
export function formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleString(LOCALE, {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Convert a date to an ISO string
 * @param {Date | string} date
 * @returns {string}
 */
export function toISOString(date: Date | string): string {
    return new Date(date).toISOString();
}
