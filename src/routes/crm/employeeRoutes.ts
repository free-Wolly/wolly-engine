import express from "express";
import * as employeeController from "../../controllers/employeeController";
import { authenticate, authorizeAdmin } from "../../middleware/auth";

const router = express.Router();

// All employee routes require authentication
router.use(authenticate);

// Routes accessible to both admin and regular users
router.get("/", employeeController.getAllEmployees);
router.get("/:id", employeeController.getEmployeeById);

// Routes accessible only to admins
router.post("/", authorizeAdmin, employeeController.createEmployee);
router.put("/:id", authorizeAdmin, employeeController.updateEmployee);
router.delete("/:id", authorizeAdmin, employeeController.deleteEmployee);

export default router;
