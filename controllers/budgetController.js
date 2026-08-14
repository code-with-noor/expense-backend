import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";

const defaultCategories = [
  { name: "Food", budget: 0, spent: 0 },
  { name: "Travel", budget: 0, spent: 0 },
  { name: "Shopping", budget: 0, spent: 0 },
  { name: "Entertainment", budget: 0, spent: 0 },
  { name: "Rent", budget: 0, spent: 0 },
];

export const getMonthlyBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(budget ? { ...budget.toObject(), id: budget._id.toString() } : { amount: 0 });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch monthly budget", error: error.message });
  }
};

export const getCategoryBudgets = async (req, res) => {
  try {
    const budget = await Budget.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    const rawCategories = budget?.categories?.length
      ? budget.categories.map((c) => (c.toObject ? c.toObject() : c))
      : defaultCategories;

    const expenseTransactions = await Transaction.find({ user: req.user._id, type: "expense" });
    const spentMap = {};
    expenseTransactions.forEach((t) => {
      const catKey = (t.category || "").toLowerCase();
      spentMap[catKey] = (spentMap[catKey] || 0) + Number(t.amount || 0);
    });

    const categories = rawCategories.map((item) => ({
      ...item,
      spent: spentMap[item.name.toLowerCase()] || 0,
      id: item._id?.toString?.() || item.name,
    }));

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch category budgets", error: error.message });
  }
};

export const updateMonthlyBudget = async (req, res) => {
  try {
    const { monthlyBudget, categoryBudgets = {} } = req.body;
    const amount = Number(monthlyBudget || 0);

    const budget = await Budget.findOne({ user: req.user._id });
    const existingCategories = budget?.categories?.length ? budget.categories : defaultCategories;

    const categories = existingCategories.map((item) => ({
      ...item,
      budget: Number(categoryBudgets[item.name?.toLowerCase()] ?? item.budget ?? 0),
      spent: Number(item.spent || 0),
    }));

    const updated = budget
      ? await Budget.findByIdAndUpdate(
          budget._id,
          { amount, categories },
          { new: true }
        )
      : await Budget.create({ user: req.user._id, amount, categories });

    res.json({ ...updated.toObject(), id: updated._id.toString() });
  } catch (error) {
    res.status(500).json({ message: "Failed to update budget", error: error.message });
  }
};
