import User from "../models/User.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Please fill all fields" });
  }

  const cleanEmail = email.trim().toLowerCase();
  const userExists = await User.findOne({ email: { $regex: `^${cleanEmail}$`, $options: "i" } });
  if (userExists) return res.status(400).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name: name.trim(), email: cleanEmail, password: hashedPassword });

  const safeUser = { _id: user._id, name: user.name, email: user.email };

  res.status(201).json({
    token: generateToken(user._id),
    user: safeUser,
  });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Please enter email and password" });
  }

  const cleanEmail = email.trim().toLowerCase();
  let user = await User.findOne({ email: { $regex: `^${cleanEmail}$`, $options: "i" } });

  if (!user) {
    // Seamless registration for fresh user
    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultName = cleanEmail.split("@")[0] || "User";
    user = await User.create({
      name: defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
      email: cleanEmail,
      password: hashedPassword,
    });
  } else {
    // Verify password for existing account
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password for this email." });
    }
  }

  const safeUser = { _id: user._id, name: user.name, email: user.email };
  res.json({
    token: generateToken(user._id),
    user: safeUser,
  });
};

export const getProfile = async (req, res) => {
  res.json({
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    },
  });
};