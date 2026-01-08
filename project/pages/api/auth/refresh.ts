// pages/api/auth/refresh.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { verifyRefreshToken, generateAccessToken } from "@/lib/jwt";
import cookie from "cookie";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
    const refreshToken = cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken) as any;
    } catch (err) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
    });

    return res.status(200).json({ accessToken });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}
