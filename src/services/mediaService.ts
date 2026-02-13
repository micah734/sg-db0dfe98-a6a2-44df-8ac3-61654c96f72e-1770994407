import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type MediaFile = Tables<"media_files">;
export type Transcript = Tables<"transcripts">;

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
    
    // Use resumable upload for files larger than 6MB
    const useResumable = file.size > 6 * 1024 * 1024;
    
    let uploadData;
    let uploadError;

    if (useResumable) {
      // Resumable upload for large files
      const { data, error } = await supabase.storage
        .from("media")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
          duplex: "half"
        });
      
      uploadData = data;
      uploadError = error;
    } else {
      // Standard upload for smaller files
      const { data, error } = await supabase.storage
        .from("media")
        .upload(fileName, file);
      
      uploadData = data;
      uploadError = error;
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
        storage_path: uploadData.path,
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