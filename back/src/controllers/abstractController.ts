import { Response } from "express";

export default abstract class AbstractController {
    /**
     * Send a success response
     * @param {Response} res
     * @param {T} data
     * @param {number} statusCode
     * @returns {Response}
     */
    protected ok<T>(res: Response, data: T, statusCode = 200): Response {
        return res.status(statusCode).json(data);
    }

    /**
     * Send a created response
     * @param {Response} res
     * @param {T} data
     * @returns {Response}
     */
    protected created<T>(res: Response, data: T): Response {
        return this.ok(res, data, 201);
    }

    /**
     * Send a no content response
     * @param {Response} res
     * @returns {Response}
     */
    protected noContent(res: Response): Response {
        return res.status(204).send();
    }

    /**
     * Send a not found response
     * @param {Response} res
     * @param {string} message
     * @returns {Response}
     */
    protected notFound(
        res: Response,
        message = "Resource not found"
    ): Response {
        return res.status(404).json({ error: message });
    }

    /**
     * Send a bad request response
     * @param {Response} res
     * @param {string} message
     * @returns {Response}
     */
    protected badRequest(res: Response, message = "Bad request"): Response {
        return res.status(400).json({ error: message });
    }

    /**
     * Send an unauthorized response (401)
     */
    protected unauthorized(res: Response, message = "Unauthorized"): Response {
        return res.status(401).json({ error: message });
    }
}
