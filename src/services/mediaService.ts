import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type MediaFile = Tables<"media_files">;
export type Transcript = Tables<"transcripts">;

// Chunk size for uploads (5MB chunks)
const CHUNK_SIZE = 5 * 1024 * 1024;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

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

    // For files larger than 50MB, split into chunks
    if (file.size > 50 * 1024 * 1024) {
      const chunks = Math.ceil(file.size / CHUNK_SIZE);
      const uploadedParts: string[] = [];

      for (let i = 0; i < chunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        
        // Create a proper Blob with the original MIME type
        const chunkBlob = new Blob([file.slice(start, end)], { type: file.type });
        
        const chunkFileName = `${fileName}.part${i}`;
        
        // Retry logic for chunk upload
        let retries = 0;
        let chunkError = null;

        while (retries < MAX_RETRIES) {
          const { error } = await supabase.storage
            .from("media")
            .upload(chunkFileName, chunkBlob, {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type // Explicitly set content type
            });

          if (!error) {
            chunkError = null;
            break;
          }

          chunkError = error;
          retries++;
          
          if (retries < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retries));
          }
        }

        if (chunkError) {
          console.error(`Error uploading chunk ${i} after ${MAX_RETRIES} retries:`, chunkError);
          uploadError = chunkError;
          break;
        }

        uploadedParts.push(chunkFileName);
        
        if (onProgress) {
          const progress = Math.round(((i + 1) / chunks) * 100);
          onProgress(progress);
        }
      }

      if (!uploadError && uploadedParts.length > 0) {
        console.log(`Large file uploaded in ${uploadedParts.length} chunks. Files stored separately.`);
      }
    } else {
      // Standard upload for smaller files with retry logic
      let retries = 0;
      
      while (retries < MAX_RETRIES) {
        const { error } = await supabase.storage
          .from("media")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type
          });
        
        if (!error) {
          uploadError = null;
          break;
        }

        uploadError = error;
        retries++;
        
        if (retries < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retries));
        }
      }
      
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