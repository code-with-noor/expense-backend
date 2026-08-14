import mongoose from "mongoose";

const transactionSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    note: { type: String, default: "" },
    account: { type: String, default: "Cash" },
    date: { type: Date, default: Date.now },
    isRecurring: { type: Boolean, default: false },
    recurringFrequency: { type: String, enum: ["daily", "weekly", "monthly", "yearly"], default: "monthly" }
}, { timestamps: true });

export default mongoose.model("Transaction", transactionSchema);