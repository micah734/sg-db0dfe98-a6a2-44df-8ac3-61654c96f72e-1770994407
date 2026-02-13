import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, FolderOpen, Clock } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import type { Project } from "@/services/projectService";

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  return (
    <Link href={`/dashboard/project/${project.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group h-full flex flex-col">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Rename</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={() => onDelete(project.id)}>
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <CardTitle className="text-lg font-semibold text-slate-900 mb-2 truncate">
            {project.name}
          </CardTitle>
          <p className="text-sm text-slate-500 line-clamp-2">
            {project.description || "No description"}
          </p>
        </CardContent>
        <CardFooter className="pt-2 text-xs text-slate-400 border-t border-slate-100 mt-auto flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>Updated {formatDistanceToNow(new Date(project.updated_at || project.created_at || new Date()), { addSuffix: true })}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}