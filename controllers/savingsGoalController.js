import SavingsGoal from "../models/SavingsGoal.js";

export const getSavingsGoals = async (req, res) => {
  try {
    const goals = await SavingsGoal.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(goals.map((goal) => ({
      ...goal.toObject(),
      id: goal._id.toString(),
      _id: goal._id.toString(),
    })));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch savings goals", error: error.message });
  }
};

export const createSavingsGoal = async (req, res) => {
  try {
    const { name, targetAmount, currentAmount, targetDate } = req.body;

    if (!name || !targetAmount || !targetDate) {
      return res.status(400).json({ message: "Name, target amount and target date are required" });
    }

    const goal = await SavingsGoal.create({
      user: req.user._id,
      name,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount || 0),
      targetDate: new Date(targetDate),
    });

    res.status(201).json({
      ...goal.toObject(),
      id: goal._id.toString(),
      _id: goal._id.toString(),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create savings goal", error: error.message });
  }
};

export const deleteSavingsGoal = async (req, res) => {
  try {
    const goal = await SavingsGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: "Savings goal not found" });
    }

    if (goal.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this savings goal" });
    }

    await SavingsGoal.findByIdAndDelete(req.params.id);
    res.json({ message: "Savings goal deleted" });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Savings goal not found" });
    }
    res.status(500).json({ message: "Failed to delete savings goal", error: error.message });
  }
};

export const addSavingsProgress = async (req, res) => {
  try {
    const { amount } = req.body;
    const goal = await SavingsGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: "Savings goal not found" });
    }

    if (goal.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this savings goal" });
    }

    goal.currentAmount = Number(goal.currentAmount || 0) + Number(amount || 0);
    await goal.save();

    res.json({
      ...goal.toObject(),
      id: goal._id.toString(),
      _id: goal._id.toString(),
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Savings goal not found" });
    }
    res.status(500).json({ message: "Failed to add progress", error: error.message });
  }
};
