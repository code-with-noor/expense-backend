import express from "express";
import {
  createSavingsGoal,
  deleteSavingsGoal,
  getSavingsGoals,
  addSavingsProgress,
} from "../controllers/savingsGoalController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getSavingsGoals);
router.post("/", protect, createSavingsGoal);
router.delete("/:id", protect, deleteSavingsGoal);
router.post("/:id/progress", protect, addSavingsProgress);

export default router;
