import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DocumentViewer } from "@/components/workspace/DocumentViewer";
import { MediaPanel } from "@/components/workspace/MediaPanel";
import { AnnotationToolbar } from "@/components/workspace/AnnotationToolbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { 
  Upload, 
  FileText, 
  Video, 
  Split, 
  Sparkles,
  Plus,
  FolderOpen
} from "lucide-react";
import { projectService, type Project } from "@/services/projectService";
import { documentService, type Document } from "@/services/documentService";
import { mediaService, type MediaFile } from "@/services/mediaService";
import { useToast } from "@/hooks/use-toast";

export default function ProjectWorkspace() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [splitViewEnabled, setSplitViewEnabled] = useState(false);
  const [selectedDocument2, setSelectedDocument2] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && typeof id === "string") {
      loadProjectData(id);
    }
  }, [id]);

  async function loadProjectData(projectId: string) {
    try {
      setLoading(true);
      const [projectData, docs, media] = await Promise.all([
        projectService.getProjectById(projectId),
        documentService.getDocuments(projectId),
        mediaService.getMediaFiles(projectId)
      ]);
      setProject(projectData);
      setDocuments(docs);
      setMediaFiles(media);
      
      // Auto-select first document if available
      if (docs.length > 0 && !selectedDocument) {
        setSelectedDocument(docs[0]);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading project",
        description: "Failed to load project data"
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDocumentUpload(file: File) {
    if (!id || typeof id !== "string") return;

    try {
      const doc = await documentService.uploadDocument(id, file);
      setDocuments([...documents, doc]);
      setSelectedDocument(doc);
      toast({
        title: "Document uploaded",
        description: `${file.name} has been added to your project`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload document"
      });
    }
  }

  async function handleMediaUpload(file: File) {
    if (!id || typeof id !== "string") return;

    try {
      const media = await mediaService.uploadMedia(id, file);
      setMediaFiles([...mediaFiles, media]);
      setSelectedMedia(media);
      toast({
        title: "Media uploaded",
        description: `${file.name} has been added to your project`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Failed to upload media"
      });
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-slate-600">Loading workspace...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout title="Project Not Found">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Project not found</h2>
            <p className="text-slate-600">This project may have been deleted or you don't have access.</p>
            <Button onClick={() => router.push("/dashboard")} className="mt-4">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={project.name}>
      <div className="h-full flex flex-col bg-slate-50">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push("/dashboard")}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              {project.name}
            </Button>
            <div className="h-4 w-px bg-slate-200" />
            <AnnotationToolbar />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSplitViewEnabled(!splitViewEnabled)}
              className={splitViewEnabled ? "bg-indigo-50 text-indigo-600" : ""}
            >
              <Split className="w-4 h-4 mr-2" />
              Split View
            </Button>
            <Button variant="ghost" size="sm">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Tools
            </Button>
          </div>
        </div>

        {/* Main Workspace */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left Sidebar - Documents & Media */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full bg-white border-r border-slate-200">
              <Tabs defaultValue="documents" className="h-full flex flex-col">
                <TabsList className="w-full rounded-none border-b border-slate-200">
                  <TabsTrigger value="documents" className="flex-1">
                    <FileText className="w-4 h-4 mr-2" />
                    Documents
                  </TabsTrigger>
                  <TabsTrigger value="media" className="flex-1">
                    <Video className="w-4 h-4 mr-2" />
                    Media
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="documents" className="flex-1 overflow-auto mt-0 p-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mb-4"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = ".pdf,.docx";
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleDocumentUpload(file);
                      };
                      input.click();
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Document
                  </Button>
                  
                  <div className="space-y-2">
                    {documents.map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDocument(doc)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedDocument?.id === doc.id
                            ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{doc.name}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {doc.file_type.toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                    
                    {documents.length === 0 && (
                      <div className="text-center py-8 text-slate-400 text-sm">
                        No documents yet
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="media" className="flex-1 overflow-auto mt-0 p-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mb-4"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "audio/*,video/*";
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleMediaUpload(file);
                      };
                      input.click();
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Media
                  </Button>
                  
                  <div className="space-y-2">
                    {mediaFiles.map(media => (
                      <button
                        key={media.id}
                        onClick={() => setSelectedMedia(media)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedMedia?.id === media.id
                            ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Video className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{media.name}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {media.file_type.toUpperCase()}
                              {media.duration && ` • ${Math.floor(media.duration / 60)}m`}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                    
                    {mediaFiles.length === 0 && (
                      <div className="text-center py-8 text-slate-400 text-sm">
                        No media files yet
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Main Canvas */}
          <ResizablePanel defaultSize={selectedMedia ? 50 : 80}>
            {splitViewEnabled ? (
              <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={50}>
                  <DocumentViewer document={selectedDocument} />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50}>
                  <DocumentViewer document={selectedDocument2} />
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <DocumentViewer document={selectedDocument} />
            )}
          </ResizablePanel>

          {/* Media Panel (Optional) */}
          {selectedMedia && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
                <MediaPanel media={selectedMedia} />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </DashboardLayout>
  );
}