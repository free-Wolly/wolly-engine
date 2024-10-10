import express from "express";
import * as customerController from "../../controllers/customerController";
const router = express.Router();

router.post("/register", customerController.register);
router.post("/login", customerController.login);

export default router;
