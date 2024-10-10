import express from "express";
import {
  createAddress,
  getAddresses,
  updateAddress,
} from "../../controllers/addressController";
import { authenticate } from "../../middleware/auth";

const router = express.Router();

router.use(authenticate);

// Create a new address for the authenticated customer
router.post("/:customerId", createAddress);

// Get all addresses for the authenticated customer
router.get("/:customerId", getAddresses);

// Create a new address for the authenticated customer
router.put("/:customerId/:addressId", updateAddress);

export default router;
