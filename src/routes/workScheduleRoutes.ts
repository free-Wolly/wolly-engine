import express from "express";
import * as workScheduleController from "../controllers/workScheduleController";
import { authenticate, authorizeAdmin } from "../middleware/auth";

const router = express.Router();

// All work schedule routes require authentication
router.use(authenticate);

// Routes accessible to both admin and regular users
router.get("/:id", workScheduleController.getWorkScheduleById);

// Routes accessible only to admins
router.post("/", authorizeAdmin, workScheduleController.createWorkSchedule);
router.put("/:id", authorizeAdmin, workScheduleController.updateWorkSchedule);
router.delete(
  "/:id",
  authorizeAdmin,
  workScheduleController.deleteWorkSchedule
);

export default router;
