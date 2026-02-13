import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { 
  BookOpen, 
  Plus, 
  LayoutGrid, 
  Settings, 
  LogOut, 
  Folder
} from "lucide-react";
import { authService } from "@/services/authService";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const router = useRouter();

  async function handleSignOut() {
    await authService.signOut();
    router.push("/auth/login");
  }

  return (
    <div className={cn("flex flex-col h-full bg-slate-50 border-r border-slate-200", className)}>
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">Synapse</span>
        </Link>

        <Button className="w-full justify-start gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={() => {
            // Trigger create project modal (handled by parent/context usually, but simplified here)
            // Ideally dispatch an event or use a context
            const event = new CustomEvent('create-project');
            window.dispatchEvent(event);
        }}>
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-1">
          <Link href="/dashboard">
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start gap-2 text-slate-600",
                router.pathname === "/dashboard" && "bg-slate-200 text-slate-900 font-medium"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              All Projects
            </Button>
          </Link>
          
          {/* Placeholder for recent projects list */}
          <div className="pt-4 pb-2 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Recent
          </div>
          {/* Recent projects would be mapped here */}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-slate-200 space-y-1">
        <Link href="/dashboard/settings">
          <Button variant="ghost" className="w-full justify-start gap-2 text-slate-600">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </Link>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}