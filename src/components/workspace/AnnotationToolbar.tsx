import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Highlighter,
  Pen,
  Type,
  Square,
  MousePointer,
  Palette,
  Link,
  Unlink,
  Trash2,
  Eraser,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface AnnotationToolbarProps {
  currentTool: "highlight" | "drawing" | "text" | "shape" | "select" | "eraser";
  onToolChange: (tool: "highlight" | "drawing" | "text" | "shape" | "select" | "eraser") => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  selectedAnnotation?: any;
  onLinkTimestamp?: () => void;
  onUnlinkTimestamp?: () => void;
  onDeleteAnnotation?: () => void;
  hasLinkedTimestamp?: boolean;
}

const PRESET_COLORS = [
  "#FFFF00", // Yellow
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#95E1D3", // Mint
  "#FF9FF3", // Pink
  "#FFA500", // Orange
  "#98D8C8", // Green
  "#A8E6CF", // Light Green
];

export function AnnotationToolbar({
  currentTool,
  onToolChange,
  currentColor,
  onColorChange,
  onLinkTimestamp,
  onUnlinkTimestamp,
  onDeleteAnnotation,
  hasSelectedAnnotation = false,
  isLinked = false,
}: AnnotationToolbarProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-background border-b">
      {/* Drawing Tools */}
      <div className="flex items-center gap-1">
        <Button
          variant={currentTool === "select" ? "default" : "outline"}
          size="sm"
          onClick={() => onToolChange("select")}
          title="Select"
        >
          <MousePointer className="h-4 w-4" />
        </Button>

        <Button
          variant={currentTool === "eraser" ? "default" : "outline"}
          size="sm"
          onClick={() => onToolChange("eraser")}
          title="Eraser - Click annotations to delete"
        >
          <Eraser className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-8" />

        <Button
          variant={currentTool === "highlight" ? "default" : "ghost"}
          size="icon"
          onClick={() => onToolChange("highlight")}
          title="Highlight"
        >
          <Highlighter className="h-4 w-4" />
        </Button>
        
        <Button
          variant={currentTool === "drawing" ? "default" : "ghost"}
          size="icon"
          onClick={() => onToolChange("drawing")}
          title="Freehand Draw"
        >
          <Pen className="h-4 w-4" />
        </Button>
        
        <Button
          variant={currentTool === "text" ? "default" : "ghost"}
          size="icon"
          onClick={() => onToolChange("text")}
          title="Text Note"
        >
          <Type className="h-4 w-4" />
        </Button>
        
        <Button
          variant={currentTool === "shape" ? "default" : "ghost"}
          size="icon"
          onClick={() => onToolChange("shape")}
          title="Rectangle"
        >
          <Square className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-8" />

      {/* Color Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" title="Color">
            <div
              className="w-4 h-4 rounded border"
              style={{ backgroundColor: currentColor }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="grid grid-cols-4 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => onColorChange(color)}
                className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                style={{
                  backgroundColor: color,
                  borderColor: color === currentColor ? "#000" : "transparent",
                }}
                title={color}
              />
            ))}
          </div>
          <Separator className="my-2" />
          <input
            type="color"
            value={currentColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-full h-8 cursor-pointer"
          />
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="h-8" />

      {/* Timestamp Linking */}
      {hasSelectedAnnotation && (
        <>
          {!isLinked ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onLinkTimestamp}
              title="Link to Current Timestamp"
              disabled={!onLinkTimestamp}
            >
              <Link className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={onUnlinkTimestamp}
              title="Unlink from Timestamp"
              disabled={!onUnlinkTimestamp}
            >
              <Unlink className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onDeleteAnnotation}
            title="Delete Annotation"
            disabled={!onDeleteAnnotation}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </>
      )}
    </div>
  );
}