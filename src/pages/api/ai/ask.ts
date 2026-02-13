import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { projectId, question } = req.body;

    // TODO: Implement RAG (Retrieval-Augmented Generation)
    // 1. Generate embedding for question
    // 2. Search for relevant context in embeddings
    // 3. Pass context + question to GPT
    // 4. Return answer with sources

    // Placeholder response
    return res.status(200).json({
      answer: "AI Q&A will be implemented with OpenAI GPT API and RAG",
      sources: []
    });
  } catch (error) {
    console.error("Q&A error:", error);
    return res.status(500).json({ error: "Failed to answer question" });
  }
}