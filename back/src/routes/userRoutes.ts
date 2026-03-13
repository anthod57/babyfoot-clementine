import { Router } from "express";
import userController from "../controllers/userController";
import { validate } from "../middlewares/validate";
import { auth, requireRole } from "../middlewares/auth";
import { idParamSchema, createUserSchema } from "../validators";

const router = Router();

router.get("/", auth, requireRole("admin"), userController.getAllUsers.bind(userController));
router.get(
    "/:id",
    auth,
    validate(idParamSchema, "params"),
    userController.getUserById.bind(userController)
);
router.post(
    "/",
    validate(createUserSchema),
    userController.createUser.bind(userController)
);

export default router;
