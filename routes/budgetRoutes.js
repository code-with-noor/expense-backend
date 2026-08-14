import express from "express";
import { getMonthlyBudget, getCategoryBudgets, updateMonthlyBudget } from "../controllers/budgetController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/monthly", protect, getMonthlyBudget);
router.get("/category", protect, getCategoryBudgets);
router.put("/monthly", protect, updateMonthlyBudget);

export default router;
