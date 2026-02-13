import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Document = Tables<"documents">;
export type Annotation = Tables<"annotations">;

export const documentService = {
  async getDocuments(projectId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
      throw error;
    }

    return data || [];
  },

  async getDocument(id: string): Promise<Document | null> {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching document:", error);
      throw error;
    }

    return data;
  },

  async uploadDocument(
    projectId: string,
    file: File,
    folderId?: string
  ): Promise<Document> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("User not authenticated");

    // Upload file to Supabase Storage
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const fileName = `${user.id}/${projectId}/${Date.now()}_${file.name}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      throw uploadError;
    }

    // Create document record
    const { data, error } = await supabase
      .from("documents")
      .insert({
        project_id: projectId,
        folder_id: folderId,
        user_id: user.id,
        name: file.name,
        file_type: fileExt === "pdf" ? "pdf" : "docx",
        storage_path: uploadData.path
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating document record:", error);
      throw error;
    }

    return data;
  },

  async deleteDocument(id: string): Promise<void> {
    // Get document to find storage path
    const { data: doc } = await supabase
      .from("documents")
      .select("storage_path")
      .eq("id", id)
      .single();

    // Delete from storage
    if (doc?.storage_path) {
      await supabase.storage.from("documents").remove([doc.storage_path]);
    }

    // Delete record
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  },

  async getAnnotations(documentId: string): Promise<Annotation[]> {
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

  async createAnnotation(annotation: Omit<Annotation, "id" | "created_at" | "updated_at">): Promise<Annotation> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("annotations")
      .insert({ ...annotation, user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error("Error creating annotation:", error);
      throw error;
    }

    return data;
  },

  async updateAnnotation(id: string, updates: Partial<Annotation>): Promise<Annotation> {
    const { data, error } = await supabase
      .from("annotations")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating annotation:", error);
      throw error;
    }

    return data;
  },

  async deleteAnnotation(id: string): Promise<void> {
    const { error } = await supabase
      .from("annotations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting annotation:", error);
      throw error;
    }
  }
};