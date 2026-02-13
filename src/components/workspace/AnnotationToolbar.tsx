import { Button } from "@/components/ui/button";
import { 
  Highlighter, 
  Pencil, 
  Type, 
  Square, 
  Circle,
  Eraser,
  Undo2,
  Redo2
} from "lucide-react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

export function AnnotationToolbar() {
  return (
    <div className="flex items-center gap-2">
      <ToggleGroup type="single" defaultValue="select">
        <ToggleGroupItem value="highlight" aria-label="Highlight" size="sm">
          <Highlighter className="w-4 h-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="draw" aria-label="Draw" size="sm">
          <Pencil className="w-4 h-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="text" aria-label="Text" size="sm">
          <Type className="w-4 h-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="rectangle" aria-label="Rectangle" size="sm">
          <Square className="w-4 h-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="circle" aria-label="Circle" size="sm">
          <Circle className="w-4 h-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="eraser" aria-label="Eraser" size="sm">
          <Eraser className="w-4 h-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="h-4 w-px bg-slate-200 mx-1" />

      <Button variant="ghost" size="sm">
        <Undo2 className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm">
        <Redo2 className="w-4 h-4" />
      </Button>

      <div className="h-4 w-px bg-slate-200 mx-1" />

      {/* Color picker */}
      <div className="flex gap-1">
        {["#fef08a", "#86efac", "#7dd3fc", "#c4b5fd", "#fda4af"].map((color) => (
          <button
            key={color}
            className="w-6 h-6 rounded border-2 border-slate-200 hover:border-slate-400 transition-colors"
            style={{ backgroundColor: color }}
            aria-label={`Color ${color}`}
          />
        ))}
      </div>
    </div>
  );
}