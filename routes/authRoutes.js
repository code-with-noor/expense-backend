import express from "express";
import { registerUser, loginUser, getProfile } from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/logout", (_req, res) => res.json({ message: "Logged out successfully" }));
router.get("/profile", protect, getProfile);

export default router;