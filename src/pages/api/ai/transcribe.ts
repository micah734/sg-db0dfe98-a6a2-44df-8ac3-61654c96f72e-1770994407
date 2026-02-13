import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { mediaFileId } = req.body;

    // TODO: Implement OpenAI Whisper API integration
    // 1. Fetch media file from Supabase Storage
    // 2. Send to OpenAI Whisper API
    // 3. Process response and save transcript
    // 4. Return transcript data

    // Placeholder response
    return res.status(200).json({
      text: "Transcription will be implemented with OpenAI Whisper API",
      segments: []
    });
  } catch (error) {
    console.error("Transcription error:", error);
    return res.status(500).json({ error: "Failed to transcribe media" });
  }
}