import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";

const normalizeTransaction = (transaction) => ({
  ...transaction.toObject(),
  id: transaction._id.toString(),
  _id: transaction._id.toString(),
  note: transaction.note || "",
  account: transaction.account || "Cash",
});

// ✅ Add Transaction
export const addTransaction = async (req, res) => {
  const { amount, category, type, note = "", account = "Cash" } = req.body;

  if (amount == null || category == null || type == null) {
    return res.status(400).json({ message: "Please provide amount, category and type" });
  }

  const numericAmount = Number(amount);

  if (Number.isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ message: "Amount must be greater than 0" });
  }

  if (!["income", "expense"].includes(type)) {
    return res.status(400).json({ message: "Type must be 'income' or 'expense'" });
  }

  try {
    const transaction = await Transaction.create({
      user: req.user._id,
      amount: numericAmount,
      category,
      type,
      note,
      account,
    });
    res.status(201).json(normalizeTransaction(transaction));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Transactions (with filtering + pagination)
export const getTransactions = async (req, res) => {
  try {
    const {
      category,
      type,
      startDate,
      endDate,
      search,
      account,
      page = 1,
      limit = 10,
    } = req.query;

    const query = { user: req.user._id };

    if (category) query.category = category;
    if (type) query.type = type;
    if (account) query.account = account;
    if (search) {
      query.$or = [
        { category: { $regex: search, $options: "i" } },
        { note: { $regex: search, $options: "i" } },
      ];
    }
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions: transactions.map(normalizeTransaction),
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching transactions", error: error.message });
  }
};

// ✅ Get Single Transaction by ID
export const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to access this transaction" });
    }

    res.json(normalizeTransaction(transaction));
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.status(500).json({ message: "Error fetching transaction", error: error.message });
  }
};

// ✅ Update Transaction
export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, category, type, note, account, date, isRecurring, recurringFrequency } = req.body;

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this transaction" });
    }

    if (amount != null) transaction.amount = Number(amount);
    if (category) transaction.category = category;
    if (type) transaction.type = type;
    if (note !== undefined) transaction.note = note;
    if (account) transaction.account = account;
    if (date) transaction.date = new Date(date);
    if (isRecurring !== undefined) transaction.isRecurring = isRecurring;
    if (recurringFrequency) transaction.recurringFrequency = recurringFrequency;

    await transaction.save();
    res.json(normalizeTransaction(transaction));
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.status(500).json({ message: "Error updating transaction", error: error.message });
  }
};

// ✅ Delete Transaction
export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this transaction" });
    }

    await Transaction.findByIdAndDelete(id);
    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.status(500).json({ message: "Error deleting transaction", error: error.message });
  }
};

export const getSummary = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id });
    const budgetDoc = await Budget.findOne({ user: req.user._id }).sort({ createdAt: -1 });

    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + t.amount, 0);

    const totalExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0);

    const totalBalance = totalIncome - totalExpenses;
    const monthlyBudget = budgetDoc ? Number(budgetDoc.amount || 0) : 0;

    res.json({
      totalIncome,
      totalExpenses,
      totalBalance,
      monthlyIncome: totalIncome,
      monthlyExpenses: totalExpenses,
      monthlyBudget,
    });
  } catch (error) {
    res.status(500).json({ message: "Error calculating summary", error: error.message });
  }
};

// ✅ Analytics Route (income, expense, balance)
export const getAnalytics = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id });

    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + t.amount, 0);

    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0);

    const balance = income - expense;

    res.json({ income, expense, balance });
  } catch (error) {
    res.status(500).json({ message: "Error calculating analytics", error: error.message });
  }
};

export const getCategoryBreakdown = async (req, res) => {
  try {
    const { timeRange = "month" } = req.query;
    const transactions = await Transaction.find({ user: req.user._id });

    const filtered = transactions.filter((t) => t.type === "expense");
    const totals = filtered.reduce((acc, t) => {
      const key = t.category || "Other";
      acc[key] = (acc[key] || 0) + Number(t.amount || 0);
      return acc;
    }, {});

    const totalSpent = Object.values(totals).reduce((sum, value) => sum + Number(value || 0), 0);
    const breakdown = Object.entries(totals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalSpent > 0 ? Number(((amount / totalSpent) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    res.json({ timeRange, breakdown });
  } catch (error) {
    res.status(500).json({ message: "Error fetching category breakdown", error: error.message });
  }
};

export const getSpendingTrends = async (req, res) => {
  try {
    const { timeRange = "month" } = req.query;
    const transactions = await Transaction.find({ user: req.user._id }).sort({ date: 1 });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trendMap = new Map();

    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const date = new Date(t.date);
        const label = timeRange === "year"
          ? monthNames[date.getMonth()]
          : date.toISOString().slice(0, 10);

        trendMap.set(label, (trendMap.get(label) || 0) + Number(t.amount || 0));
      });

    const trends = Array.from(trendMap.entries()).map(([label, amount]) => ({
      label,
      amount,
    }));

    res.json({ timeRange, trends });
  } catch (error) {
    res.status(500).json({ message: "Error fetching spending trends", error: error.message });
  }
};