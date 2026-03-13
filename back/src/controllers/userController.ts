import AbstractController from "./abstractController";

/**
 * User controller class
 * Handles user-related requests
 */
class UserController extends AbstractController {
    /**
     * Get all users
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async getAllUsers(req: Request, res: Response): Promise<Response> {
        throw new Error("Not implemented");
    }

    /**
     * Get a user by its id
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async getUserById(req: Request, res: Response): Promise<Response> {
        throw new Error("Not implemented");
    }

    /**
     * Create a new user
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async createUser(req: Request, res: Response): Promise<Response> {
        throw new Error("Not implemented");
    }

    /**
     * Update an user
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async updateUser(req: Request, res: Response): Promise<Response> {
        throw new Error("Not implemented");
    }

    /**
     * Delete an user
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async deleteUser(req: Request, res: Response): Promise<Response> {
        throw new Error("Not implemented");
    }

    /**
     * Update the roles of an user
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async updateUserRoles(
        req: Request,
        res: Response
    ): Promise<Response> {
        throw new Error("Not implemented");
    }

    /**
     * Get the roles of an user
     * @param {Request} req
     * @param {Response} res
     * @returns {Promise<Response>}
     */
    public async getUserRoles(req: Request, res: Response): Promise<Response> {
        throw new Error("Not implemented");
    }
}

export default new UserController();
