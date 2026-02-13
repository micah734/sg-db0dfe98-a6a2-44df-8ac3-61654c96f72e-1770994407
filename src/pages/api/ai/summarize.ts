import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { content, type } = req.body;

    // TODO: Implement OpenAI GPT API for summarization
    // Use appropriate prompts based on type (document/media/project)

    // Placeholder response
    return res.status(200).json({
      summary: "AI summarization will be implemented with OpenAI GPT API"
    });
  } catch (error) {
    console.error("Summarization error:", error);
    return res.status(500).json({ error: "Failed to generate summary" });
  }
}