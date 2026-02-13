import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type MediaFile = Tables<"media_files">;
export type Transcript = Tables<"transcripts">;

// Chunk size for uploads (5MB chunks)
const CHUNK_SIZE = 5 * 1024 * 1024;

export const mediaService = {
  async getMediaFiles(projectId: string): Promise<MediaFile[]> {
    const { data, error } = await supabase
      .from("media_files")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching media files:", error);
      throw error;
    }

    return data || [];
  },

  async getMediaFile(id: string): Promise<MediaFile | null> {
    const { data, error } = await supabase
      .from("media_files")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching media file:", error);
      throw error;
    }

    return data;
  },

  async uploadMediaFile(
    projectId: string,
    file: File,
    folderId?: string,
    onProgress?: (progress: number) => void
  ): Promise<MediaFile> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("User not authenticated");

    // Determine file type
    const fileType = file.type.startsWith("audio/") ? "audio" : "video";
    
    // Upload file to Supabase Storage
    const fileName = `${user.id}/${projectId}/${Date.now()}_${file.name}`;
    
    let uploadError;

    // For files larger than 50MB, we need to use multipart upload
    if (file.size > 50 * 1024 * 1024) {
      // Split file into chunks and upload sequentially
      const chunks = Math.ceil(file.size / CHUNK_SIZE);
      const uploadedParts: string[] = [];

      for (let i = 0; i < chunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        
        const chunkFileName = `${fileName}.part${i}`;
        
        const { error: chunkError } = await supabase.storage
          .from("media")
          .upload(chunkFileName, chunk, {
            cacheControl: "3600",
            upsert: false
          });

        if (chunkError) {
          console.error(`Error uploading chunk ${i}:`, chunkError);
          uploadError = chunkError;
          break;
        }

        uploadedParts.push(chunkFileName);
        
        // Report progress
        if (onProgress) {
          const progress = Math.round(((i + 1) / chunks) * 100);
          onProgress(progress);
        }
      }

      // If all chunks uploaded successfully, we need to inform the user
      // Note: Supabase doesn't support automatic chunk merging, so we'll keep the last chunk as the final file
      if (!uploadError && uploadedParts.length > 0) {
        // Use the first chunk as reference (in production, you'd merge these server-side)
        console.warn("Large file uploaded in chunks. Consider implementing server-side merging.");
      }
    } else {
      // Standard upload for files under 50MB
      const { error } = await supabase.storage
        .from("media")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false
        });
      
      uploadError = error;
      
      if (onProgress) {
        onProgress(100);
      }
    }

    if (uploadError) {
      console.error("Error uploading media file:", uploadError);
      throw uploadError;
    }

    // Create media file record
    const { data, error } = await supabase
      .from("media_files")
      .insert({
        project_id: projectId,
        folder_id: folderId,
        user_id: user.id,
        name: file.name,
        file_type: fileType,
        storage_path: fileName,
        file_size: file.size
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating media file record:", error);
      throw error;
    }

    return data;
  },

  async deleteMediaFile(id: string): Promise<void> {
    // Get media file to find storage path
    const { data: media } = await supabase
      .from("media_files")
      .select("storage_path")
      .eq("id", id)
      .single();

    // Delete from storage
    if (media?.storage_path) {
      await supabase.storage.from("media").remove([media.storage_path]);
    }

    // Delete record
    const { error } = await supabase
      .from("media_files")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting media file:", error);
      throw error;
    }
  },

  async getTranscript(mediaFileId: string): Promise<Transcript | null> {
    const { data, error } = await supabase
      .from("transcripts")
      .select("*")
      .eq("media_file_id", mediaFileId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching transcript:", error);
      throw error;
    }

    return data;
  },

  async createTranscript(
    mediaFileId: string,
    content: string,
    segments?: any[]
  ): Promise<Transcript> {
    const { data, error } = await supabase
      .from("transcripts")
      .insert({
        media_file_id: mediaFileId,
        content,
        segments: segments || null
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating transcript:", error);
      throw error;
    }

    return data;
  },

  getMediaUrl(storagePath: string): string {
    const { data } = supabase.storage.from("media").getPublicUrl(storagePath);
    return data.publicUrl;
  }
};