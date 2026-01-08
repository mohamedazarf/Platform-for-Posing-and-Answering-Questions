import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET || "access_secret"; // your secret in .env
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  // Extract token from headers
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1]; // Bearer TOKEN
  if (!token) return res.status(401).json({ message: "Invalid token" });

  let userId: string;
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    userId = decoded.userId; // your token payload should have userId
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  if (req.method === "PUT") {
    const { title, tags } = req.body;

    try {
      const client = await clientPromise;
      const dbName = process.env.MONGODB_DB;

      if (!dbName) {
        throw new Error(
          "Please define the MONGODB_DB environment variable inside .env.local"
        );
      }

      const db = client.db(dbName);

      const question = await db
        .collection("questions")
        .findOne({ _id: new ObjectId(id as string) });
      if (!question)
        return res.status(404).json({ message: "Question not found" });

      // Check if the logged-in user is the author
      if (question.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Check if there are answers or reactions
      const hasAnswers = question.answers && question.answers.length > 0;
      const hasReactions = question.reactions && question.reactions.length > 0;
      if (hasAnswers || hasReactions) {
        return res
          .status(400)
          .json({ message: "Cannot edit question with answers or reactions" });
      }

      // Update question
      await db
        .collection("questions")
        .updateOne(
          { _id: new ObjectId(id as string) },
          { $set: { title, tags } }
        );

      res.status(200).json({ message: "Question updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
