import { Router } from "express";
import userController from "../controllers/userController";
import { validate } from "../middlewares/validate";
import { auth, requireRole } from "../middlewares/auth";
import { idParamSchema, createUserSchema, updateUserSchema } from "../validators";

const router = Router();

router.get(
    "/",
    auth,
    requireRole("admin"),
    userController.getAllUsers.bind(userController)
);

router.get(
    "/:id",
    auth,
    validate(idParamSchema, "params"),
    userController.getUserById.bind(userController)
);

router.post(
    "/",
    auth,
    requireRole("admin"),
    validate(createUserSchema),
    userController.createUser.bind(userController)
);

router.put(
    "/:id",
    auth,
    requireRole("admin"),
    validate(idParamSchema, "params"),
    validate(updateUserSchema),
    userController.updateUser.bind(userController)
);

router.delete(
    "/:id",
    auth,
    requireRole("admin"),
    validate(idParamSchema, "params"),
    userController.deleteUser.bind(userController)
);

export default router;
