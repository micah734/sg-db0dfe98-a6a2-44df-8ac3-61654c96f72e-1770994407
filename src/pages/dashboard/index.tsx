import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { CreateProjectDialog } from "@/components/dashboard/CreateProjectDialog";
import { Button } from "@/components/ui/button";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { projectService, type Project } from "@/services/projectService";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();

    // Listen for create project event from sidebar
    const handleCreateEvent = () => setIsCreateDialogOpen(true);
    window.addEventListener('create-project', handleCreateEvent);
    return () => window.removeEventListener('create-project', handleCreateEvent);
  }, []);

  async function loadProjects() {
    try {
      setLoading(true);
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading projects",
        description: "Please try again later."
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject(name: string, description: string) {
    try {
      const newProject = await projectService.createProject(name, description);
      setProjects([newProject, ...projects]);
      toast({
        title: "Project created",
        description: `"${name}" has been created successfully.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create project",
        description: "An error occurred while creating the project."
      });
      throw error; // Re-throw to keep dialog open/loading state
    }
  }

  async function handleDeleteProject(id: string) {
    try {
      await projectService.deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
      toast({
        title: "Project deleted",
        description: "The project has been permanently deleted."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to delete project",
        description: "An error occurred while deleting the project."
      });
    }
  }

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout title="Projects">
      <div className="h-full flex flex-col p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
            <p className="text-slate-500 mt-1">Manage your academic workspaces</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-8 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search projects..." 
              className="pl-10 border-none shadow-none focus-visible:ring-0 bg-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <Button variant="ghost" size="sm" className="text-slate-500">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-slate-200 rounded-xl" />
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No projects yet</h3>
            <p className="text-slate-500 max-w-sm mb-6">
              Create your first project to start organizing documents, notes, and recordings.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline">
              Create Project
            </Button>
          </div>
        )}

        <CreateProjectDialog 
          open={isCreateDialogOpen} 
          onOpenChange={setIsCreateDialogOpen}
          onSubmit={handleCreateProject}
        />
      </div>
    </DashboardLayout>
  );
}