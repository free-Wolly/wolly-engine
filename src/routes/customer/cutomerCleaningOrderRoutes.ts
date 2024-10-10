import express from "express";
import {
  customerCreateCleaningOrder,
  customerGetAllCleaningByCustomer,
  customerGetCleaningOrderById,
  customerUpdateCleaningOrder,
} from "../../controllers/cleaningOrderController";
import {
  extractCustomer,
  authenticateCustomer,
} from "../../middleware/customerAuth";

const router = express.Router();

// Guest Or Authenticated Customer Routes
router.post("/", extractCustomer, customerCreateCleaningOrder);

// Authenticated Customer Routes
router.use("/:customerId", authenticateCustomer);

router.get("/:customerId", customerGetAllCleaningByCustomer);
router.get("/:customerId/:cleaningOrderId", customerGetCleaningOrderById);
router.put("/:customerId/:cleaningOrderId", customerUpdateCleaningOrder);

export default router;
