import User from "../models/User.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword });

  const safeUser = { _id: user._id, name: user.name, email: user.email };

  res.status(201).json({
    token: generateToken(user._id),
    user: safeUser,
  });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    const safeUser = { _id: user._id, name: user.name, email: user.email };
    res.json({
      token: generateToken(user._id),
      user: safeUser,
    });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
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