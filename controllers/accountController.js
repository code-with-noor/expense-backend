import Account from "../models/Account.js";

export const getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(accounts.map((account) => ({
      ...account.toObject(),
      id: account._id.toString(),
      _id: account._id.toString(),
    })));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch accounts", error: error.message });
  }
};

export const createAccount = async (req, res) => {
  try {
    const { name, type, balance } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: "Name and type are required" });
    }

    const account = await Account.create({
      user: req.user._id,
      name,
      type,
      balance: Number(balance || 0),
    });

    res.status(201).json({
      ...account.toObject(),
      id: account._id.toString(),
      _id: account._id.toString(),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create account", error: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (account.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this account" });
    }

    await Account.findByIdAndDelete(req.params.id);
    res.json({ message: "Account deleted" });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Account not found" });
    }
    res.status(500).json({ message: "Failed to delete account", error: error.message });
  }
};
