import express from "express";
import * as userController from "../../controllers/userController";
import {
  authenticate,
  authorizeAdmin,
  authorizeSelfUserOrAdmin,
  extractUser,
} from "../../middleware/auth";

const router = express.Router();

router.post("/register", extractUser, userController.createUser);
router.post("/login", userController.login);

// Protected routes
router.use(authenticate);

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);

router.put("/:id", authorizeSelfUserOrAdmin, userController.updateUser);
router.delete("/:id", authorizeAdmin, userController.deleteUser);

export default router;
