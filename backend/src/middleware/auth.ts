import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { UserRole } from "../models/User";

interface TokenClaims extends jwt.JwtPayload {
  role: UserRole;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authorization = req.header("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const claims = jwt.verify(
      authorization.slice(7),
      config.jwtSecret,
    ) as TokenClaims;
    if (!claims.sub || !["ADMIN", "STUDENT"].includes(claims.role)) {
      res.status(401).json({ error: "Invalid access token" });
      return;
    }
    req.auth = { userId: claims.sub, role: claims.role };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired access token" });
  }
}

export function requireRole(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.auth?.role !== role) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}
