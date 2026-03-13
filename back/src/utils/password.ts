import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

/**
 * Hash a password
 * @param {string} plain
 * @returns {Promise<string>}
 */
export async function hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * Compare a raw password with a hashed password
 * @param {string} plain
 * @param {string} hashed
 * @returns {Promise<boolean>}
 */
export function comparePassword(
    plain: string,
    hashed: string
): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
}
