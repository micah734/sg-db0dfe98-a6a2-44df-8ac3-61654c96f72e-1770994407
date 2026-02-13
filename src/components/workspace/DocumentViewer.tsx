import { useState, useRef, useEffect } from "react";
import { Document as PDFDocument, Page as PDFPage, pdfjs } from "react-pdf";
import { Document, type Document as DocumentType } from "@/services/documentService";
import { FileText, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Configure PDF.js worker with more reliable CDN
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocumentViewerProps {
  document: DocumentType | null;
  documentUrl?: string;
  onAnnotationCreate?: (annotation: any) => void;
}

export function DocumentViewer({ document, documentUrl, onAnnotationCreate }: DocumentViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load PDF URL when document changes
  useEffect(() => {
    if (document && documentUrl) {
      setLoading(true);
      setError(null);
      setPdfUrl(documentUrl);
      setPageNumber(1);
    } else {
      setPdfUrl(null);
    }
  }, [document, documentUrl]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error("Error loading PDF:", error);
    setError("Failed to load PDF. Please try again.");
    setLoading(false);
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      return Math.max(1, Math.min(newPageNumber, numPages));
    });
  };

  const changeScale = (delta: number) => {
    setScale(prevScale => {
      const newScale = prevScale + delta;
      return Math.max(0.5, Math.min(newScale, 2.5));
    });
  };

  if (!document) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
        <FileText className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">No document selected</p>
        <p className="text-sm mt-1">Upload or select a document to view</p>
      </div>
    );
  }

  // Check if file is PDF
  const isPDF = document.file_type === "pdf";

  if (!isPDF) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-slate-600">
        <FileText className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">{document.name}</p>
        <p className="text-sm mt-2">DOCX preview coming soon</p>
        <div className="mt-4 text-xs text-slate-500 max-w-md text-center">
          <p>To implement DOCX rendering, install:</p>
          <code className="bg-slate-200 px-2 py-1 rounded mt-2 inline-block">
            npm install mammoth docx-preview
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-100" ref={containerRef}>
      {/* Document Controls */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-600 min-w-[6rem] text-center font-medium">
            Page {pageNumber} of {numPages || "?"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => changeScale(-0.25)}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-600 min-w-[4rem] text-center font-medium">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => changeScale(0.25)}
            disabled={scale >= 2.5}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto bg-slate-100 p-4">
        <div className="max-w-5xl mx-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-800">
              <p className="font-medium">Error loading document</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {loading && !error && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-slate-600">Loading PDF...</span>
            </div>
          )}

          <div className="relative">
            <PDFDocument
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              }
            >
              <PDFPage
                pageNumber={pageNumber}
                scale={scale}
                className="shadow-lg rounded-lg overflow-hidden"
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </PDFDocument>

            {/* Canvas overlay for annotations */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top left"
              }}
            />
          </div>

          {/* Document Info */}
          {!loading && !error && (
            <div className="mt-4 bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-slate-900">{document.name}</span>
                  <span className="text-slate-500 ml-2">
                    • {document.file_type.toUpperCase()}
                  </span>
                </div>
                <div className="text-slate-500">
                  Uploaded {new Date(document.created_at || "").toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}