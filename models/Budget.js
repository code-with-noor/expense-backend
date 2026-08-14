import mongoose from "mongoose";

const categoryBudgetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    budget: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
  },
  { _id: true }
);

const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, default: 0 },
    categories: [categoryBudgetSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Budget", budgetSchema);
