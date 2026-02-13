import { useEffect, useRef, useState } from "react";
import { annotationService, type Annotation, type AnnotationCoordinates } from "@/services/annotationService";

interface AnnotationCanvasProps {
  documentId: string;
  pageNumber: number;
  width: number;
  height: number;
  scale?: number;
  currentTool: "highlight" | "drawing" | "text" | "shape" | "select";
  currentColor: string;
  onAnnotationClick?: (annotation: Annotation) => void;
  selectedMediaFileId?: string;
  currentTimestamp?: number;
}

export function AnnotationCanvas({
  documentId,
  pageNumber,
  width,
  height,
  scale = 1,
  currentTool,
  currentColor,
  onAnnotationClick,
  selectedMediaFileId,
  currentTimestamp,
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  // Load annotations for current page
  useEffect(() => {
    loadAnnotations();
  }, [documentId, pageNumber]);

  // Redraw canvas when annotations or dimensions change
  useEffect(() => {
    drawAnnotations();
  }, [annotations, width, height, scale]);

  const loadAnnotations = async () => {
    try {
      const data = await annotationService.getAnnotationsByPage(documentId, pageNumber);
      setAnnotations(data);
    } catch (error) {
      console.error("Failed to load annotations:", error);
    }
  };

  const drawAnnotations = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw all annotations
    annotations.forEach((annotation) => {
      const coords = annotation.coordinates as unknown as AnnotationCoordinates;
      ctx.strokeStyle = annotation.color || "#FFFF00";
      ctx.fillStyle = annotation.color || "#FFFF00";
      ctx.lineWidth = 2 * scale; // Scale line width

      // Scale coordinates
      const s = (val: number) => val * scale;
      const sx = s(coords.x);
      const sy = s(coords.y);
      const sw = s(coords.width || 0);
      const sh = s(coords.height || 0);

      switch (annotation.annotation_type) {
        case "highlight":
          ctx.globalAlpha = 0.3;
          ctx.fillRect(sx, sy, sw, sh);
          ctx.globalAlpha = 1.0;
          break;

        case "drawing":
          if (coords.points && coords.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(s(coords.points[0].x), s(coords.points[0].y));
            coords.points.forEach((point) => {
              ctx.lineTo(s(point.x), s(point.y));
            });
            ctx.stroke();
          }
          break;

        case "shape":
          ctx.strokeRect(sx, sy, sw, sh);
          break;

        case "text":
          ctx.font = `${16 * scale}px Arial`;
          ctx.fillText(annotation.content || "", sx, sy);
          
          // Draw timestamp indicator if linked
          if (annotation.media_timestamp !== null) {
            ctx.fillStyle = "#FF0000";
            ctx.beginPath();
            ctx.arc(sx - (10 * scale), sy - (10 * scale), 5 * scale, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
      }
    });
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool === "select") {
      handleAnnotationClick(e);
      return;
    }

    const coords = getCanvasCoordinates(e);
    setIsDrawing(true);
    setStartPoint(coords);
    
    if (currentTool === "drawing") {
      setCurrentPath([coords]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCanvasCoordinates(e);

    // Draw preview
    drawAnnotations(); // Redraw existing
    ctx.strokeStyle = currentColor;
    ctx.fillStyle = currentColor;
    ctx.lineWidth = 2 * scale;

    switch (currentTool) {
      case "highlight":
      case "shape":
        const width = coords.x - startPoint.x;
        const height = coords.y - startPoint.y;
        if (currentTool === "highlight") {
          ctx.globalAlpha = 0.3;
          ctx.fillRect(startPoint.x, startPoint.y, width, height);
          ctx.globalAlpha = 1.0;
        } else {
          ctx.strokeRect(startPoint.x, startPoint.y, width, height);
        }
        break;

      case "drawing":
        setCurrentPath((prev) => [...prev, coords]);
        if (currentPath.length > 0) {
          ctx.beginPath();
          ctx.moveTo(currentPath[0].x, currentPath[0].y);
          currentPath.forEach((point) => {
            ctx.lineTo(point.x, point.y);
          });
          ctx.lineTo(coords.x, coords.y);
          ctx.stroke();
        }
        break;
    }
  };

  const handleMouseUp = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;

    const coords = getCanvasCoordinates(e);
    setIsDrawing(false);

    // Helper to unscale coordinates for storage
    const u = (val: number) => val / scale;

    let annotationCoords: AnnotationCoordinates = { x: u(startPoint.x), y: u(startPoint.y) };
    let annotationType: "highlight" | "drawing" | "text" | "shape" = "drawing";

    switch (currentTool) {
      case "highlight":
        annotationType = "highlight";
        annotationCoords = {
          x: u(startPoint.x),
          y: u(startPoint.y),
          width: u(coords.x - startPoint.x),
          height: u(coords.y - startPoint.y),
        };
        break;

      case "shape":
        annotationType = "shape";
        annotationCoords = {
          x: u(startPoint.x),
          y: u(startPoint.y),
          width: u(coords.x - startPoint.x),
          height: u(coords.y - startPoint.y),
        };
        break;

      case "drawing":
        annotationType = "drawing";
        annotationCoords = {
          x: u(startPoint.x),
          y: u(startPoint.y),
          points: [...currentPath, coords].map(p => ({ x: u(p.x), y: u(p.y) })),
        };
        setCurrentPath([]);
        break;

      case "text":
        annotationType = "text";
        const textContent = prompt("Enter text:");
        if (!textContent) return;
        annotationCoords = { x: u(coords.x), y: u(coords.y) };
        
        try {
          await annotationService.createAnnotation({
            document_id: documentId,
            page_number: pageNumber,
            annotation_type: annotationType,
            coordinates: annotationCoords,
            content: textContent,
            color: currentColor,
            media_timestamp: currentTimestamp,
            media_file_id: selectedMediaFileId,
          });
          await loadAnnotations();
        } catch (error) {
          console.error("Failed to create text annotation:", error);
        }
        return;
    }

    // Save annotation
    try {
      await annotationService.createAnnotation({
        document_id: documentId,
        page_number: pageNumber,
        annotation_type: annotationType,
        coordinates: annotationCoords,
        color: currentColor,
        media_timestamp: currentTimestamp,
        media_file_id: selectedMediaFileId,
      });
      await loadAnnotations();
    } catch (error) {
      console.error("Failed to create annotation:", error);
    }

    setStartPoint(null);
  };

  const handleAnnotationClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    const u = (val: number) => val / scale;
    const clickX = u(coords.x);
    const clickY = u(coords.y);
    
    // Find clicked annotation
    const clickedAnnotation = annotations.find((ann) => {
      const c = ann.coordinates as unknown as AnnotationCoordinates;
      
      switch (ann.annotation_type) {
        case "highlight":
        case "shape":
          return (
            clickX >= c.x &&
            clickX <= c.x + (c.width || 0) &&
            clickY >= c.y &&
            clickY <= c.y + (c.height || 0)
          );
        
        case "text":
          // 20px radius around text (unscaled)
          return Math.hypot(clickX - c.x, clickY - c.y) < 20;
        
        case "drawing":
          // Check if click is near any point in the path
          if (c.points) {
            return c.points.some(
              (point) => Math.hypot(clickX - point.x, clickY - point.y) < 10
            );
          }
          return false;
        
        default:
          return false;
      }
    });

    if (clickedAnnotation && onAnnotationClick) {
      onAnnotationClick(clickedAnnotation);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="absolute top-0 left-0 cursor-crosshair"
      style={{ pointerEvents: currentTool === "select" ? "auto" : "all" }}
    />
  );
}