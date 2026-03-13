import { comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import UserService from "./userService";

export type AuthResult = {
    token: string;
    user: {
        id: number;
        username: string;
        name: string;
        surname: string;
        email: string;
        roles: string[];
    };
};

export default class AuthService {
    private userService = new UserService();

    /**
     * Login an user
     * @param {string} email
     * @param {string} password
     * @returns {Promise<AuthResult>}
     */
    async login(email: string, password: string): Promise<AuthResult> {
        const user = await this.userService.findByEmailForAuth(email);

        if (!user) {
            throw new Error("Invalid credentials");
        }

        const valid = await comparePassword(password, user.password);

        if (!valid) {
            throw new Error("Invalid credentials");
        }

        const token = signToken({
            sub: user.id,
            email: user.email,
        });

        const roles = await user.getRoles();
        const roleNames = roles.map(r => r.roleName);

        const {
            password: _p,
            Roles: _R,
            roles: _r,
            ...safeUser
        } = user.get({
            plain: true,
        }) as Record<string, unknown>;
        return {
            token,
            user: { ...safeUser, roles: roleNames } as AuthResult["user"],
        };
    }
}
