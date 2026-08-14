import express from "express";
import { createAccount, deleteAccount, getAccounts } from "../controllers/accountController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getAccounts);
router.post("/", protect, createAccount);
router.delete("/:id", protect, deleteAccount);

export default router;
