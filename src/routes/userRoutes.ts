import express from "express";
import * as userController from "../controllers/userController";
import {
  authenticate,
  authorizeAdmin,
  authorizeUserOrAdmin,
  extractUser,
} from "../middleware/auth";

const router = express.Router();

router.post("/register", extractUser, userController.createUser);
router.post("/login", userController.login);

// Protected routes
router.use(authenticate);

router.get("/", authorizeAdmin, userController.getAllUsers);
router.get("/:id", authorizeUserOrAdmin, userController.getUserById);
router.put("/:id", authorizeUserOrAdmin, userController.updateUser);
router.delete("/:id", authorizeAdmin, userController.deleteUser);

export default router;
