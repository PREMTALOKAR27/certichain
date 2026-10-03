import { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";

export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({ error: error.message });
    return;
  }
  if (error?.code === 11000) {
    res.status(409).json({ error: "A record with that value already exists" });
    return;
  }
  if (error?.statusCode) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
};
