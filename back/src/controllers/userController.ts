import UserService from "../services/userService";
import AbstractController from "./abstractController";
import { Request, Response } from "express";
import { hashPassword } from "../utils/password";

/**
 * User controller class
 * Handles user-related requests
 */
class UserController extends AbstractController {
    private readonly userService = new UserService();

    /**
     * Get all users
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async getAllUsers(req: Request, res: Response): Promise<Response> {
        const users = await this.userService.getAllUsers();

        return this.ok(res, users);
    }

    /**
     * Get an user by its id
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async getUserById(req: Request, res: Response): Promise<Response> {
        const { id } = req.params as unknown as { id: number };

        const user = await this.userService.getUserById(id);

        if (!user) {
            return this.notFound(res, "User not found");
        }

        return this.ok(res, user);
    }

    /**
     * Create a new user
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async createUser(req: Request, res: Response): Promise<Response> {
        const { username, name, surname, email, password } = req.body;

        const user = await this.userService.createUser({
            username,
            name,
            surname,
            email,
            password,
        });

        return this.created(res, user);
    }

    /**
     * Update an user
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async updateUser(req: Request, res: Response): Promise<Response> {
        const id = Number(req.params.id);
        const { username, name, surname, email, password } = req.body;

        const updates: Record<string, unknown> = {};

        if (username !== undefined) updates.username = username;
        if (name !== undefined) updates.name = name;
        if (surname !== undefined) updates.surname = surname;
        if (email !== undefined) updates.email = email;
        if (password !== undefined) {
            updates.password = await hashPassword(password);
        }

        const user = await this.userService.updateUser(id, updates);

        return this.ok(res, user);
    }

    /**
     * Delete an user
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async deleteUser(req: Request, res: Response): Promise<Response> {
        const id = Number(req.params.id);
        await this.userService.deleteUser(id);
        return this.noContent(res);
    }
}

export default new UserController();
