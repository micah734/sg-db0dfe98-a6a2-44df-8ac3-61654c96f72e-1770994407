import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Annotation = Tables<"annotations">;

export interface AnnotationCoordinates {
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: { x: number; y: number }[];
  path?: string;
}

export interface CreateAnnotationData {
  document_id: string;
  page_number: number;
  annotation_type: "highlight" | "drawing" | "text" | "shape";
  coordinates: AnnotationCoordinates;
  content?: string;
  color?: string;
  media_timestamp?: number;
  media_file_id?: string;
}

export interface UpdateAnnotationData {
  coordinates?: AnnotationCoordinates;
  content?: string;
  color?: string;
  media_timestamp?: number;
  media_file_id?: string;
}

export const annotationService = {
  /**
   * Get all annotations for a document
   */
  async getAnnotationsByDocument(
    documentId: string
  ): Promise<Annotation[]> {
    const { data, error } = await supabase
      .from("annotations")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching annotations:", error);
      throw error;
    }

    return data || [];
  },

  /**
   * Get annotations for a specific page
   */
  async getAnnotationsByPage(
    documentId: string,
    pageNumber: number
  ): Promise<Annotation[]> {
    const { data, error } = await supabase
      .from("annotations")
      .select("*")
      .eq("document_id", documentId)
      .eq("page_number", pageNumber)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching page annotations:", error);
      throw error;
    }

    return data || [];
  },

  /**
   * Get annotations linked to a specific media file
   */
  async getAnnotationsByMedia(
    mediaFileId: string
  ): Promise<Annotation[]> {
    const { data, error } = await supabase
      .from("annotations")
      .select("*")
      .eq("media_file_id", mediaFileId)
      .not("media_timestamp", "is", null)
      .order("media_timestamp", { ascending: true });

    if (error) {
      console.error("Error fetching media annotations:", error);
      throw error;
    }

    return data || [];
  },

  /**
   * Create a new annotation
   */
  async createAnnotation(
    annotationData: CreateAnnotationData
  ): Promise<Annotation> {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      throw new Error("Not authenticated");
    }

    const { data, error } = await supabase
      .from("annotations")
      .insert({
        ...annotationData,
        user_id: session.session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating annotation:", error);
      throw error;
    }

    return data;
  },

  /**
   * Update an annotation
   */
  async updateAnnotation(
    annotationId: string,
    updates: UpdateAnnotationData
  ): Promise<Annotation> {
    const { data, error } = await supabase
      .from("annotations")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", annotationId)
      .select()
      .single();

    if (error) {
      console.error("Error updating annotation:", error);
      throw error;
    }

    return data;
  },

  /**
   * Delete an annotation
   */
  async deleteAnnotation(annotationId: string): Promise<void> {
    const { error } = await supabase
      .from("annotations")
      .delete()
      .eq("id", annotationId);

    if (error) {
      console.error("Error deleting annotation:", error);
      throw error;
    }
  },

  /**
   * Link an annotation to a media timestamp
   */
  async linkToTimestamp(
    annotationId: string,
    mediaFileId: string,
    timestamp: number
  ): Promise<Annotation> {
    return this.updateAnnotation(annotationId, {
      media_file_id: mediaFileId,
      media_timestamp: timestamp,
    });
  },

  /**
   * Remove media timestamp link from annotation
   */
  async unlinkFromTimestamp(annotationId: string): Promise<Annotation> {
    const { data, error } = await supabase
      .from("annotations")
      .update({
        media_file_id: null,
        media_timestamp: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", annotationId)
      .select()
      .single();

    if (error) {
      console.error("Error unlinking annotation:", error);
      throw error;
    }

    return data;
  },

  /**
   * Delete all annotations for a document
   */
  async deleteDocumentAnnotations(documentId: string): Promise<void> {
    const { error } = await supabase
      .from("annotations")
      .delete()
      .eq("document_id", documentId);

    if (error) {
      console.error("Error deleting document annotations:", error);
      throw error;
    }
  },
};