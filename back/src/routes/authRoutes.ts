import { Router } from "express";
import authController from "../controllers/authController";
import { validate } from "../middlewares/validate";
import { loginSchema } from "../validators/authValidators";

const router = Router();

router.post(
    "/login",
    validate(loginSchema),
    authController.login.bind(authController)
);

export default router;
