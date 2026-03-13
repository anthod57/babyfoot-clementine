import { Role } from "../models/roleModel";
import { User } from "../models/userModel";
import { UserRole } from "../models/userRoleModel";
import { hashPassword } from "../utils/password";
import AbstractService from "./abstractService";

export type CreateUserData = {
    username: string;
    name: string;
    surname: string;
    email: string;
    password: string;
};

export default class UserService extends AbstractService {
    private static readonly PUBLIC_ATTRIBUTES = [
        "id",
        "username",
        "name",
        "surname",
        "email",
        "createdAt",
        "updatedAt",
    ] as const;

    /**
     * Get all users
     * @returns {Promise<User[]>}
     */
    public async getAllUsers(): Promise<User[]> {
        return this.findAll(User, {
            attributes: [...UserService.PUBLIC_ATTRIBUTES],
            include: [
                {
                    model: Role,
                    attributes: ["roleName"],
                    through: { attributes: [] },
                },
            ],
        });
    }

    /**
     * Get an user by its id
     * @param {number} id
     * @returns {Promise<User | null>}
     */
    public async getUserById(id: number): Promise<User | null> {
        return this.findById(User, id, {
            attributes: [...UserService.PUBLIC_ATTRIBUTES],
            include: [
                {
                    model: Role,
                    attributes: ["roleName"],
                    through: { attributes: [] },
                },
            ],
        });
    }

    /**
     * Find user by email with password (for auth)
     */
    public async findByEmailForAuth(
        email: string
    ): Promise<(User & { roles?: Role[] }) | null> {
        const user = await this.findOne(User, {
            where: { email },
            attributes: { include: ["password"] },
            include: [Role],
        });
        return user as (User & { roles?: Role[] }) | null;
    }

    /**
     * Create a new user
     * @param {CreateUserData} data
     * @returns {Promise<User>}
     */
    public async createUser(data: CreateUserData): Promise<User> {
        const hashedPassword = await hashPassword(data.password);

        const user = await this.create(User, {
            ...data,
            password: hashedPassword,
        });

        // Add the default "user" role (id 2 from the seeding command)
        await UserRole.create({ userId: user.id, roleId: 2 });

        const created = await this.findById(User, user.id, {
            attributes: [...UserService.PUBLIC_ATTRIBUTES],
            include: [
                {
                    model: Role,
                    attributes: ["roleName"],
                    through: { attributes: [] },
                },
            ],
        });

        return created ?? user;
    }

    /**
     * Update an user
     * @param {number} id
     * @param {User} user
     * @returns {Promise<User>}
     */
    public async updateUser(id: number, user: User): Promise<User> {
        await this.update(User, user, { id });

        const updatedUser = await this.findById(User, id);

        if (!updatedUser) {
            throw new Error("User not found");
        }

        return updatedUser;
    }

    /**
     * Delete an user
     * @param {number} id
     * @returns {Promise<number>}
     */
    public async deleteUser(id: number): Promise<number> {
        return this.delete(User, { id });
    }

    /**
     * Get the roles of an user
     * @param {number} id
     * @returns {Promise<Role[]>}
     */
    public async getUserRoles(id: number): Promise<Role[]> {
        const user = await this.findById(User, id);

        if (!user) {
            throw new Error("User not found");
        }

        const roles = await user.getRoles();

        if (!roles) {
            return [];
        }

        return roles;
    }

    /**
     * Update the roles of an user
     * @param {number} id
     * @param {Role[]} roles
     * @returns {Promise<User>}
     */
    public async updateUserRoles(id: number, roles: Role[]): Promise<User> {
        // Delete all roles then add the new ones
        await UserRole.destroy({ where: { userId: id } });
        await UserRole.bulkCreate(
            roles.map(role => ({ userId: id, roleId: role.id }))
        );

        const updatedUser = await this.findById(User, id);

        if (!updatedUser) {
            throw new Error("User not found");
        }

        return updatedUser;
    }
}
