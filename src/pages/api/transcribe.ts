import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "100mb",
    },
  },
};

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { mediaFileId, transcriptId } = req.body;

    if (!mediaFileId || !transcriptId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Update status to processing
    await supabase
      .from("transcripts")
      .update({ status: "processing" })
      .eq("id", transcriptId);

    // Get media file details
    const { data: mediaFile, error: fetchError } = await supabase
      .from("media_files")
      .select("*")
      .eq("id", mediaFileId)
      .single();

    if (fetchError || !mediaFile) {
      throw new Error("Media file not found");
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("media")
      .download(mediaFile.storage_path);

    if (downloadError || !fileData) {
      throw new Error("Failed to download media file");
    }

    // Convert Blob to File for OpenAI API
    const file = new File([fileData], mediaFile.file_name, {
      type: mediaFile.mime_type,
    });

    // Transcribe with OpenAI Whisper
    console.log("Starting transcription for:", mediaFile.file_name);
    
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    });

    console.log("Transcription completed:", transcription.text.substring(0, 100));

    // Extract segments with timestamps
    const segments: TranscriptSegment[] =
      transcription.segments?.map((seg: any) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text.trim(),
      })) || [];

    // Update transcript in database
    const { error: updateError } = await supabase
      .from("transcripts")
      .update({
        full_text: transcription.text,
        language: transcription.language,
        segments: segments as any,
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transcriptId);

    if (updateError) {
      throw updateError;
    }

    return res.status(200).json({
      success: true,
      transcript: {
        full_text: transcription.text,
        language: transcription.language,
        segments,
      },
    });
  } catch (error: any) {
    console.error("Transcription error:", error);

    // Update transcript status to failed
    if (req.body.transcriptId) {
      await supabase
        .from("transcripts")
        .update({
          status: "failed",
          error_message: error.message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", req.body.transcriptId);
    }

    return res.status(500).json({
      error: "Transcription failed",
      message: error.message,
    });
  }
}