import express from "express";
import {
  addTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getAnalytics,
  getSummary,
  getCategoryBreakdown,
  getSpendingTrends,
} from "../controllers/transactionController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Analytics routes (must come before :id routes to avoid conflicts)
router.get("/analytics", protect, getAnalytics);
router.get("/analytics/summary", protect, getSummary);
router.get("/analytics/category-breakdown", protect, getCategoryBreakdown);
router.get("/analytics/spending-trends", protect, getSpendingTrends);

// ✅ Transaction CRUD routes
router.post("/", protect, addTransaction);
router.get("/", protect, getTransactions);
router.get("/:id", protect, getTransactionById);
router.put("/:id", protect, updateTransaction);
router.delete("/:id", protect, deleteTransaction);

export default router;