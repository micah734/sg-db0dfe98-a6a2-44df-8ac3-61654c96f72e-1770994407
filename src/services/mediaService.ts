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
    onProgress?: (progress: number, stage?: string) => void
  ): Promise<MediaFile> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("User not authenticated");

    // Determine file type
    const fileType = file.type.startsWith("audio/") ? "audio" : "video";
    
    // Upload file to Supabase Storage
    const fileName = `${Date.now()}_${file.name}`;
    const fileNameWithPath = `${user.id}/${projectId}/${fileName}`;
    
    let uploadError;

    // For files larger than 50MB, use chunked upload with client-side merging
    if (file.size > 50 * 1024 * 1024) {
      const chunks = Math.ceil(file.size / CHUNK_SIZE);
      const uploadedChunkPaths: string[] = [];

      // Step 1: Upload all chunks
      if (onProgress) onProgress(0, "Uploading chunks...");
      
      for (let i = 0; i < chunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        
        // Create a proper Blob with the original MIME type
        const chunkBlob = new Blob([file.slice(start, end)], { type: file.type });
        
        const chunkFileName = `${fileNameWithPath}.part${i}`;
        
        // Retry logic for chunk upload
        let retries = 0;
        let chunkError = null;

        while (retries < MAX_RETRIES) {
          const { error } = await supabase.storage
            .from("media")
            .upload(chunkFileName, chunkBlob, {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type
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

        uploadedChunkPaths.push(chunkFileName);
        
        if (onProgress) {
          const progress = Math.round(((i + 1) / chunks) * 50); // First 50% for upload
          onProgress(progress, "Uploading chunks...");
        }
      }

      if (!uploadError && uploadedChunkPaths.length > 0) {
        console.log(`Uploaded ${uploadedChunkPaths.length} chunks. Starting client-side merge...`);
        
        try {
          // Step 2: Download and merge chunks client-side
          if (onProgress) onProgress(50, "Merging chunks...");
          
          const chunkBlobs: Blob[] = [];
          
          for (let i = 0; i < uploadedChunkPaths.length; i++) {
            const chunkPath = uploadedChunkPaths[i];
            
            // Download chunk
            const { data: chunkData, error: downloadError } = await supabase.storage
              .from("media")
              .download(chunkPath);
            
            if (downloadError) {
              console.error(`Error downloading chunk ${i}:`, downloadError);
              throw new Error(`Failed to download chunk ${i}: ${downloadError.message}`);
            }
            
            chunkBlobs.push(chunkData);
            
            if (onProgress) {
              const progress = 50 + Math.round(((i + 1) / uploadedChunkPaths.length) * 25); // 50-75% for download
              onProgress(progress, "Downloading chunks...");
            }
          }
          
          // Step 3: Merge blobs into single file
          if (onProgress) onProgress(75, "Merging file...");
          
          const mergedBlob = new Blob(chunkBlobs, { type: file.type });
          console.log(`Merged ${chunkBlobs.length} chunks into single file of ${mergedBlob.size} bytes`);
          
          // Step 4: Upload merged file
          if (onProgress) onProgress(80, "Uploading merged file...");
          
          const { error: mergedUploadError } = await supabase.storage
            .from("media")
            .upload(fileNameWithPath, mergedBlob, {
              cacheControl: "3600",
              upsert: true,
              contentType: file.type
            });
          
          if (mergedUploadError) {
            console.error("Error uploading merged file:", mergedUploadError);
            throw new Error(`Failed to upload merged file: ${mergedUploadError.message}`);
          }
          
          console.log("Merged file uploaded successfully");
          
          // Step 5: Clean up chunk files
          if (onProgress) onProgress(90, "Cleaning up...");
          
          const { error: deleteError } = await supabase.storage
            .from("media")
            .remove(uploadedChunkPaths);
          
          if (deleteError) {
            console.warn("Error cleaning up chunks (non-fatal):", deleteError);
          } else {
            console.log("Chunk cleanup completed");
          }
          
          if (onProgress) onProgress(95, "Finalizing...");
          
        } catch (mergeErr) {
          console.error("Client-side merge failed:", mergeErr);
          throw new Error(`Merge operation failed: ${mergeErr instanceof Error ? mergeErr.message : 'Unknown error'}`);
        }
      }
    } else {
      // Standard upload for smaller files with retry logic
      if (onProgress) onProgress(0, "Uploading...");
      
      let retries = 0;
      
      while (retries < MAX_RETRIES) {
        const { error } = await supabase.storage
          .from("media")
          .upload(fileNameWithPath, file, {
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
        onProgress(95, "Finalizing...");
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
        storage_path: fileNameWithPath,
        file_size: file.size
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating media file record:", error);
      throw error;
    }

    if (onProgress) {
      onProgress(100, "Complete!");
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