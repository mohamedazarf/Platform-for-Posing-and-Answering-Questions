import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

interface Answer {
  author: string;
  content: string;
  likes?: string[];
  createdAt: string;
}

interface Question {
  _id?: string;
  title: string;
  username: string;
  tags?: string[];
  likes?: string[];
  answers?: Answer[];
  createdAt: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB;

    if (!dbName) {
      throw new Error(
        "Please define the MONGODB_DB environment variable inside .env.local"
      );
    }

    const db = client.db(dbName);
    // Only allow GET requests
    if (req.method === "GET") {
      // Fetch all questions, newest first
      const questions: Question[] = await db
        .collection("questions")
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json(questions);
    }
    if (req.method === "POST") {
      const { title, tags, username, userId } = req.body;

      if (!title || !username || !userId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const newQuestion: Question = {
        title,
        username,
        userId,
        tags: tags || [],
        likes: [],
        answers: [],
        createdAt: new Date().toISOString(),
      };

      const result = await db.collection("questions").insertOne(newQuestion);
      return res
        .status(201)
        .json({ message: "Question created", id: result.insertedId });
    }
    return res.status(405).json({ message: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}
