import express from "express";
import {
  deleteCleaningOrder,
  getAllCleaningOrders,
  getCleaningOrderById,
  updateCleaningOrder,
  createCleaningOrder,
} from "../../controllers/cleaningOrderController";
import { authenticate, authorizeAdmin } from "../../middleware/auth";
const router = express.Router();

// Role User and Admin

router.use(authenticate);
router.get("/", getAllCleaningOrders);
router.get("/:cleaningOrderId", getCleaningOrderById);

// Role Admin
router.use(authorizeAdmin);
router.post("/", createCleaningOrder);
router.put("/:cleaningOrderId", updateCleaningOrder);
router.delete("/:cleaningOrderId", deleteCleaningOrder);

export default router;
