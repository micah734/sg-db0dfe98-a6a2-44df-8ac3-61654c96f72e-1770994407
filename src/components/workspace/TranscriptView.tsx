import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, PlayCircle, Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { transcriptService, type Transcript, type TranscriptSegment } from "@/services/transcriptService";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TranscriptViewProps {
  mediaFileId: string;
  projectId: string;
  currentTime: number;
  onSeek: (time: number) => void;
}

export function TranscriptView({ mediaFileId, projectId, currentTime, onSeek }: TranscriptViewProps) {
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadTranscript();
    
    // Poll for status updates if processing
    let pollInterval: NodeJS.Timeout;
    
    if (transcript?.status === "processing" || transcript?.status === "pending") {
      pollInterval = setInterval(loadTranscript, 5000);
    }
    
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [mediaFileId, transcript?.status]);

  const loadTranscript = async () => {
    try {
      const data = await transcriptService.getTranscriptByMediaFile(mediaFileId);
      setTranscript(data);
    } catch (error) {
      console.error("Error loading transcript:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscribe = async () => {
    try {
      setIsTranscribing(true);
      
      // Create initial transcript record
      const newTranscript = await transcriptService.createTranscript(mediaFileId, projectId);
      setTranscript(newTranscript);

      // Call API to start transcription
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaFileId,
          transcriptId: newTranscript.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start transcription");
      }

      toast({
        title: "Transcription started",
        description: "This may take a few minutes depending on the file size.",
      });
    } catch (error) {
      console.error("Transcription error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start transcription. Please try again.",
      });
      setTranscript(null);
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Safe cast for segments
  const segments = (transcript?.segments as unknown as TranscriptSegment[]) || [];
  
  // Filter segments based on search
  const filteredSegments = segments.filter(seg => 
    seg.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Find active segment
  const activeSegmentIndex = segments.findIndex(
    (seg) => currentTime >= seg.start && currentTime <= seg.end
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading transcript...</p>
      </div>
    );
  }

  if (!transcript) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
        <div className="bg-primary/10 p-4 rounded-full">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">No Transcript Available</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-xs">
            Generate a transcript to search content and navigate the video by text.
          </p>
          <Button onClick={handleTranscribe} disabled={isTranscribing}>
            {isTranscribing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Generate Transcript
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (transcript.status === "processing" || transcript.status === "pending") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <div>
          <h3 className="font-semibold">Transcribing Media...</h3>
          <p className="text-sm text-muted-foreground mt-2">
            This usually takes about 15-20% of the video duration.
            <br />
            You can continue working while this processes.
          </p>
        </div>
      </div>
    );
  }

  if (transcript.status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
        <div className="bg-destructive/10 p-4 rounded-full">
          <FileText className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h3 className="font-semibold text-destructive">Transcription Failed</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {transcript.error_message || "An unknown error occurred."}
          </p>
          <Button variant="outline" onClick={handleTranscribe}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b space-y-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {filteredSegments.length > 0 ? (
            filteredSegments.map((segment, index) => {
              const isActive = segments.indexOf(segment) === activeSegmentIndex;
              return (
                <div
                  key={index}
                  className={cn(
                    "group flex gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
                    isActive && "bg-primary/10 hover:bg-primary/20"
                  )}
                  onClick={() => onSeek(segment.start)}
                >
                  <span className={cn(
                    "text-xs font-mono mt-1 text-muted-foreground shrink-0",
                    isActive && "text-primary font-medium"
                  )}>
                    {formatTime(segment.start)}
                  </span>
                  <p className={cn(
                    "text-sm leading-relaxed",
                    isActive && "text-foreground font-medium"
                  )}>
                    {segment.text}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No results found for "{searchQuery}"
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}