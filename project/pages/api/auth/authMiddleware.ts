// lib/authMiddleware.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { verifyAccessToken } from "@/lib/jwt";

export function withAuth(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];

    try {
      const payload = verifyAccessToken(token);
      (req as any).user = payload; // attach user info to request
      return handler(req, res);
    } catch (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
  };
}
