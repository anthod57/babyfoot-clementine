import { Request, Response } from "express";
import AbstractController from "./abstractController";
import AuthService from "../services/authService";

class AuthController extends AbstractController {
    private authService = new AuthService();

    /**
     * Login an user
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    async login(req: Request, res: Response): Promise<Response> {
        const { email, password } = req.body;

        try {
            const result = await this.authService.login(email, password);
            return this.ok(res, result);
        } catch (err: unknown) {
            if (err instanceof Error) {
                return this.unauthorized(res, err.message);
            }

            return this.unauthorized(res, "An unknown error occurred");
        }
    }
}

export default new AuthController();
