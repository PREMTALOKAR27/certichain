import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { User } from "../models/User";
import { asyncHandler } from "../middleware/errors";

const router = Router();
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body ?? {};
    if (typeof name !== "string" || name.trim().length < 2) {
      res
        .status(400)
        .json({ error: "Name must contain at least 2 characters" });
      return;
    }
    if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      res.status(400).json({ error: "A valid email address is required" });
      return;
    }
    if (typeof password !== "string" || !passwordPattern.test(password)) {
      res
        .status(400)
        .json({
          error:
            "Password must be at least 8 characters and include a letter and a number",
        });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) {
      res
        .status(409)
        .json({ error: "An account with that email already exists" });
      return;
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12),
      role: "STUDENT",
    });
    res.status(201).json({ user: user.toJSON() });
  }),
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = jwt.sign({ role: user.role }, config.jwtSecret, {
      subject: user.id,
      expiresIn: config.jwtExpiresIn as jwt.SignOptions["expiresIn"],
    });
    res.json({ token, user: user.toJSON() });
  }),
);

export default router;
