import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Transcript = Tables<"transcripts">;

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export const transcriptService = {
  /**
   * Get transcript for a media file
   */
  getTranscriptByMediaFile: async (mediaFileId: string): Promise<Transcript | null> => {
    try {
      const { data, error } = await supabase
        .from("transcripts")
        .select("*")
        .eq("media_file_id", mediaFileId)
        .maybeSingle();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Error fetching transcript:", error);
      throw error;
    }
  },

  /**
   * Get all transcripts for a project
   */
  getProjectTranscripts: async (projectId: string): Promise<Transcript[]> => {
    try {
      const { data, error } = await supabase
        .from("transcripts")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Error fetching project transcripts:", error);
      throw error;
    }
  },

  /**
   * Create a new transcript (pending status)
   */
  createTranscript: async (
    mediaFileId: string,
    projectId: string
  ): Promise<Transcript> => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error("User must be authenticated");
      }

      const { data, error } = await supabase
        .from("transcripts")
        .insert({
          media_file_id: mediaFileId,
          project_id: projectId,
          user_id: session.user.id,
          full_text: "",
          segments: [] as any,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Error creating transcript:", error);
      throw error;
    }
  },

  /**
   * Update transcript with completed data
   */
  updateTranscript: async (
    transcriptId: string,
    fullText: string,
    segments: TranscriptSegment[],
    language?: string
  ): Promise<Transcript> => {
    try {
      const { data, error } = await supabase
        .from("transcripts")
        .update({
          full_text: fullText,
          segments: segments as any,
          language,
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", transcriptId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Error updating transcript:", error);
      throw error;
    }
  },

  /**
   * Update transcript status
   */
  updateTranscriptStatus: async (
    transcriptId: string,
    status: "pending" | "processing" | "completed" | "failed",
    errorMessage?: string
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from("transcripts")
        .update({
          status,
          error_message: errorMessage || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", transcriptId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating transcript status:", error);
      throw error;
    }
  },

  /**
   * Delete a transcript
   */
  deleteTranscript: async (transcriptId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from("transcripts")
        .delete()
        .eq("id", transcriptId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting transcript:", error);
      throw error;
    }
  },

  /**
   * Search transcripts by text
   */
  searchTranscripts: async (projectId: string, query: string): Promise<Transcript[]> => {
    try {
      const { data, error } = await supabase
        .from("transcripts")
        .select("*")
        .eq("project_id", projectId)
        .ilike("full_text", `%${query}%`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Error searching transcripts:", error);
      throw error;
    }
  },
};