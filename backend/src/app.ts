import cors from "cors";
import express from "express";
import { config } from "./config/env";
import { errorHandler } from "./middleware/errors";
import authRoutes from "./routes/auth";
import certificateRoutes, { publicVerifyHandler } from "./routes/certificates";
import adminRoutes from "./routes/admin";

const app = express();

app.use(cors({ origin: config.frontendOrigin }));
app.use(express.json({ limit: "1mb" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.get("/api/verify/:certificateId", publicVerifyHandler);
app.use("/api/certificates", certificateRoutes);
app.use("/api", adminRoutes);
app.use(errorHandler);

export default app;
