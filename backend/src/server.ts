import { config } from "./config/env";
import app from "./app";
import { User } from "./models/User";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

async function start() {
  await mongoose.connect(config.mongoUri);

  const admin = await User.findOne({ email: config.adminEmail });
  if (!admin) {
    await User.create({
      name: config.adminName,
      email: config.adminEmail,
      passwordHash: await bcrypt.hash(config.adminPassword, 12),
      role: "ADMIN",
    });
    console.log(`Created local administrator: ${config.adminEmail}`);
  } else if (admin.role !== "ADMIN") {
    throw new Error("ADMIN_EMAIL is already registered as a student");
  }

  app.listen(config.port, () => {
    console.log(`CERTICHAIN API listening on http://localhost:${config.port}`);
  });
}

start().catch((error) => {
  console.error("Backend startup failed:", error);
  process.exitCode = 1;
});
