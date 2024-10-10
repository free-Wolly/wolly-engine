import express from "express";
import { authenticateCustomer } from "../../middleware/customerAuth";
import {
  createAddress,
  getAddresses,
  updateAddress,
} from "../../controllers/addressController";

const router = express.Router();

// Create a new address for the authenticated customer
router.post("/:customerId", authenticateCustomer, createAddress);

// Get all addresses for the authenticated customer
router.get("/:customerId", authenticateCustomer, getAddresses);

router.put("/:customerId/:addressId", authenticateCustomer, updateAddress);

export default router;
