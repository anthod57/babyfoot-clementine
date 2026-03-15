const LOCALE = "fr-FR";

/**
 * Formats a date for display (e.g. "15 mars 2026").
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
 * Short date format (e.g. "15 mars 2026").
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
 * Time portion only (e.g. "14:30").
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
 * Full date and time (e.g. "15 mars 2026, 14:30").
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
 * Converts a date to a full ISO string.
 * @param {Date | string} date
 * @returns {string}
 */
export function toISOString(date: Date | string): string {
    return new Date(date).toISOString();
}

/**
 * Returns today's date as YYYY-MM-DD for date inputs.
 * @returns {string}
 */
export function getTodayISO(): string {
    return new Date().toISOString().slice(0, 10);
}
