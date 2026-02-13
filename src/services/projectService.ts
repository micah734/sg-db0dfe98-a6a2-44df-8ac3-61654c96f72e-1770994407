import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Project = Tables<"projects">;
export type Folder = Tables<"folders">;

export const projectService = {
  async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }

    return data || [];
  },

  async getProject(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching project:", error);
      throw error;
    }

    return data;
  },

  async createProject(name: string, description?: string): Promise<Project> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("projects")
      .insert({ name, description, user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error("Error creating project:", error);
      throw error;
    }

    return data;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase
      .from("projects")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating project:", error);
      throw error;
    }

    return data;
  },

  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
  },

  async getFolders(projectId: string): Promise<Folder[]> {
    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .eq("project_id", projectId)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching folders:", error);
      throw error;
    }

    return data || [];
  },

  async createFolder(projectId: string, name: string, parentFolderId?: string): Promise<Folder> {
    const { data, error } = await supabase
      .from("folders")
      .insert({ project_id: projectId, name, parent_folder_id: parentFolderId })
      .select()
      .single();

    if (error) {
      console.error("Error creating folder:", error);
      throw error;
    }

    return data;
  },

  async deleteFolder(id: string): Promise<void> {
    const { error } = await supabase
      .from("folders")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting folder:", error);
      throw error;
    }
  }
};