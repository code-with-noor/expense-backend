import express from "express";
import {
  getSummary,
  getAnalytics,
  getCategoryBreakdown,
  getSpendingTrends,
} from "../controllers/transactionController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/summary", protect, getSummary);
router.get("/monthly", protect, getAnalytics);
router.get("/category-breakdown", protect, getCategoryBreakdown);
router.get("/spending-trends", protect, getSpendingTrends);

export default router;
