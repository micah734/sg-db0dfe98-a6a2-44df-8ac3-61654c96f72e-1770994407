import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MediaPanel } from "@/components/workspace/MediaPanel";
import { AnnotationToolbar } from "@/components/workspace/AnnotationToolbar";
import { projectService } from "@/services/projectService";
import { documentService, type Document } from "@/services/documentService";
import { mediaService, type MediaFile } from "@/services/mediaService";
import { annotationService, type Annotation } from "@/services/annotationService";
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  Video, 
  Upload,
  Loader2,
  FolderOpen,
  File,
  Trash2
} from "lucide-react";
import { SEO } from "@/components/SEO";

// Dynamic import for DocumentViewer to avoid SSR issues with react-pdf
const DocumentViewer = dynamic(
  () => import("@/components/workspace/DocumentViewer").then(mod => ({ default: mod.DocumentViewer })),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }
);

export default function ProjectWorkspace() {
  const router = useRouter();
  const { id } = router.query;
  
  const [project, setProject] = useState<any>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState<"document" | "media">("document");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Annotation State
  const [currentTool, setCurrentTool] = useState<"highlight" | "drawing" | "text" | "shape" | "select" | "eraser">("select");
  const [currentColor, setCurrentColor] = useState<string>("#FFFF00");
  const [selectedAnnotation, setSelectedAnnotation] = useState<any>(null);

  useEffect(() => {
    if (id && typeof id === "string") {
      loadProjectData(id);
    }
  }, [id]);

  const loadProjectData = async (projectId: string) => {
    try {
      setLoading(true);
      const [projectData, docs, media] = await Promise.all([
        projectService.getProject(projectId),
        documentService.getDocuments(projectId),
        mediaService.getMediaFiles(projectId)
      ]);

      setProject(projectData);
      setDocuments(docs);
      setMediaFiles(media);
      
      if (docs.length > 0 && !selectedDocument) {
        setSelectedDocument(docs[0]);
      }
    } catch (error) {
      console.error("Error loading project:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    // File size validation
    const maxSize = uploadType === "document" ? 100 * 1024 * 1024 : 500 * 1024 * 1024; // 100MB for docs, 500MB for media
    if (file.size > maxSize) {
      const maxSizeMB = uploadType === "document" ? 100 : 500;
      alert(`File size exceeds the maximum allowed size of ${maxSizeMB}MB. Please choose a smaller file.`);
      event.target.value = ""; // Reset input
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      if (uploadType === "document") {
        // Upload document
        const document = await documentService.uploadDocument(
          id as string,
          file,
          null // no folder for now
        );
        setDocuments(prev => [...prev, document]);
        setSelectedDocument(document);
      } else {
        // Upload media
        const mediaFile = await mediaService.uploadMediaFile(
          id as string,
          file,
          null // no folder for now
        );
        setMediaFiles(prev => [...prev, mediaFile]);
      }

      setUploadDialogOpen(false);
      setUploadProgress(100);
      alert("File uploaded successfully!");
    } catch (error: any) {
      console.error("Error uploading file:", error);
      
      // Better error messages
      let errorMessage = "Failed to upload file. Please try again.";
      
      if (error.message?.includes("exceeded") || error.message?.includes("size")) {
        errorMessage = "File size exceeds storage limits. Try a smaller file or compress the video.";
      } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message?.includes("quota")) {
        errorMessage = "Storage quota exceeded. Please free up space or upgrade your plan.";
      }
      
      alert(errorMessage);
      event.target.value = ""; // Reset input
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    try {
      await documentService.deleteDocument(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      if (selectedDocument?.id === docId) {
        setSelectedDocument(documents[0] || null);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete document.");
    }
  };

  const handleLinkTimestamp = async () => {
    if (!selectedAnnotation || !selectedMedia) return;
    
    // Get current timestamp from media player (this would need to be exposed via context or ref)
    // For now, we'll use a placeholder or need to implement a media context
    const timestamp = 0; // TODO: Get actual timestamp
    
    try {
      await annotationService.linkToTimestamp(selectedAnnotation.id, selectedMedia.id, timestamp);
      // Refresh annotation to show link status
      setSelectedAnnotation(prev => prev ? { ...prev, media_file_id: selectedMedia.id, media_timestamp: timestamp } : null);
    } catch (error) {
      console.error("Error linking timestamp:", error);
    }
  };

  const handleUnlinkTimestamp = async () => {
    if (!selectedAnnotation) return;
    
    try {
      await annotationService.unlinkFromTimestamp(selectedAnnotation.id);
      setSelectedAnnotation(prev => prev ? { ...prev, media_file_id: null, media_timestamp: null } : null);
    } catch (error) {
      console.error("Error unlinking timestamp:", error);
    }
  };

  const handleDeleteAnnotation = async () => {
    if (!selectedAnnotation) return;
    
    if (confirm("Delete this annotation?")) {
      try {
        await annotationService.deleteAnnotation(selectedAnnotation.id);
        setSelectedAnnotation(null);
        // DocumentViewer will need to reload annotations
      } catch (error) {
        console.error("Error deleting annotation:", error);
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="h-full flex items-center justify-center">
          <p>Project not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <SEO 
        title={`${project.name} - Synapse Notes`}
        description={`Working on ${project.name}`}
      />
      
      <div className="h-full flex flex-col">
        {/* Project Header */}
        <div className="border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-slate-600 mt-1">{project.description}</p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setUploadType("document");
                  setUploadDialogOpen(true);
                }}
                variant="outline"
                size="sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
              <Button
                onClick={() => {
                  setUploadType("media");
                  setUploadDialogOpen(true);
                }}
                variant="outline"
                size="sm"
              >
                <Video className="w-4 h-4 mr-2" />
                Upload Media
              </Button>
            </div>
          </div>
        </div>

        {/* Workspace */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left Sidebar - Files */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full border-r border-slate-200 bg-slate-50">
              <Tabs defaultValue="documents" className="h-full flex flex-col">
                <TabsList className="w-full justify-start rounded-none border-b border-slate-200 bg-white">
                  <TabsTrigger value="documents" className="flex-1">
                    <FileText className="w-4 h-4 mr-2" />
                    Documents
                  </TabsTrigger>
                  <TabsTrigger value="media" className="flex-1">
                    <Video className="w-4 h-4 mr-2" />
                    Media
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="documents" className="flex-1 mt-0">
                  <ScrollArea className="h-full">
                    <div className="p-3 space-y-2">
                      {documents.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">No documents yet</p>
                          <Button
                            onClick={() => {
                              setUploadType("document");
                              setUploadDialogOpen(true);
                            }}
                            variant="link"
                            size="sm"
                            className="mt-2"
                          >
                            Upload your first document
                          </Button>
                        </div>
                      ) : (
                        documents.map((doc) => (
                          <div
                            key={doc.id}
                            className={`group relative flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedDocument?.id === doc.id
                                ? "bg-primary/10 border-primary shadow-sm"
                                : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                            }`}
                            onClick={() => setSelectedDocument(doc)}
                          >
                            <File className={`w-5 h-5 flex-shrink-0 ${
                              selectedDocument?.id === doc.id ? "text-primary" : "text-slate-400"
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${
                                selectedDocument?.id === doc.id ? "text-primary" : "text-slate-700"
                              }`}>
                                {doc.name}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {doc.file_type.toUpperCase()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDocument(doc.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="media" className="flex-1 mt-0">
                  <ScrollArea className="h-full">
                    <div className="p-3 space-y-2">
                      {mediaFiles.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-sm">No media files yet</p>
                          <Button
                            onClick={() => {
                              setUploadType("media");
                              setUploadDialogOpen(true);
                            }}
                            variant="link"
                            size="sm"
                            className="mt-2"
                          >
                            Upload your first media file
                          </Button>
                        </div>
                      ) : (
                        mediaFiles.map((media) => (
                          <button
                            key={media.id}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                              selectedMedia?.id === media.id
                                ? "bg-primary/10 border-primary"
                                : "bg-white border-slate-200 hover:border-slate-300"
                            }`}
                            onClick={() => setSelectedMedia(media)}
                          >
                            <Video className="w-5 h-5 flex-shrink-0 text-slate-400" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-700 truncate">
                                {media.name}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {media.file_type.toUpperCase()}
                                {media.duration_seconds && 
                                  ` • ${Math.floor(media.duration_seconds / 60)}:${String(media.duration_seconds % 60).padStart(2, "0")}`
                                }
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Center - Document Viewer */}
          <ResizablePanel defaultSize={55} minSize={40}>
            <div className="h-full flex flex-col">
              <AnnotationToolbar 
                currentTool={currentTool}
                onToolChange={setCurrentTool}
                currentColor={currentColor}
                onColorChange={setCurrentColor}
                hasSelectedAnnotation={!!selectedAnnotation}
                isLinked={!!selectedAnnotation?.media_timestamp}
                onLinkTimestamp={handleLinkTimestamp}
                onUnlinkTimestamp={handleUnlinkTimestamp}
                onDeleteAnnotation={handleDeleteAnnotation}
              />
              <DocumentViewer 
                document={selectedDocument}
                documentUrl={selectedDocument ? documentService.getDocumentUrl(selectedDocument.storage_path) : undefined}
                onAnnotationCreate={(annotation) => {
                  console.log("Annotation created:", annotation);
                }}
                currentTool={currentTool}
                currentColor={currentColor}
                onAnnotationSelect={setSelectedAnnotation}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Media */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
            <MediaPanel media={selectedMedia} />
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Upload {uploadType === "document" ? "Document" : "Media File"}
              </DialogTitle>
              <DialogDescription>
                {uploadType === "document" 
                  ? "Upload a PDF or DOCX file to your project"
                  : "Upload an audio or video file to your project"
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">
                  Select File
                </Label>
                <Input
                  id="file"
                  type="file"
                  accept={uploadType === "document" 
                    ? ".pdf,.docx" 
                    : "audio/*,video/*"
                  }
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <p className="text-xs text-slate-500">
                  Maximum file size: {uploadType === "document" ? "100MB" : "500MB"}
                </p>
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}