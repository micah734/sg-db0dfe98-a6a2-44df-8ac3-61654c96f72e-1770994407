import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { projectId, query } = req.body;

    // TODO: Implement semantic search
    // 1. Generate embedding for query using OpenAI
    // 2. Search embeddings table using pgvector
    // 3. Return relevant results

    // Placeholder response
    return res.status(200).json([]);
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({ error: "Failed to perform search" });
  }
}