import { useState, useRef, useEffect } from "react";
import { Document, type Document as DocumentType } from "@/services/documentService";
import { FileText, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentViewerProps {
  document: DocumentType | null;
}

export function DocumentViewer({ document }: DocumentViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (document) {
      // In a real implementation, load PDF/DOCX and render
      // For now, show placeholder
      setCurrentPage(1);
      setTotalPages(1);
    }
  }, [document]);

  if (!document) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
        <FileText className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">No document selected</p>
        <p className="text-sm mt-1">Upload or select a document to view</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-100">
      {/* Document Controls */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.max(50, zoom - 25))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-600 min-w-[4rem] text-center">
            {zoom}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(Math.min(200, zoom + 25))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Document Canvas */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8 min-h-[11in]">
          {/* Placeholder for PDF/DOCX rendering */}
          <div className="space-y-4">
            <div className="text-2xl font-bold text-slate-900 mb-6">
              {document.name}
            </div>
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-600">
                Document viewer placeholder. In production, this would render:
              </p>
              <ul>
                <li>PDF files using PDF.js or react-pdf</li>
                <li>DOCX files using mammoth.js or docx-preview</li>
                <li>Canvas overlay for annotations (highlights, drawings, notes)</li>
                <li>Interactive annotation layer with click handlers</li>
              </ul>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-indigo-900 font-medium">
                  📄 Document: {document.name}
                </p>
                <p className="text-xs text-indigo-700 mt-1">
                  Type: {document.file_type.toUpperCase()} • 
                  Uploaded: {new Date(document.created_at || "").toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          
          {/* Canvas for annotations overlay */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none opacity-0"
            style={{ transform: `scale(${zoom / 100})` }}
          />
        </div>
      </div>
    </div>
  );
}