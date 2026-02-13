import { useState, useRef, useEffect } from "react";
import { mediaService, type MediaFile } from "@/services/mediaService";
import { Play, Pause, Volume2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MediaPanelProps {
  media: MediaFile | null;
}

export function MediaPanel({ media }: MediaPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [transcriptText, setTranscriptText] = useState<string | null>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

  useEffect(() => {
    if (media) {
      loadTranscript(media.id);
    } else {
      setTranscriptText(null);
    }
  }, [media]);

  async function loadTranscript(mediaId: string) {
    try {
      const transcriptData = await mediaService.getTranscript(mediaId);
      setTranscriptText(transcriptData?.content || null);
    } catch (error) {
      console.error("Failed to load transcript", error);
      setTranscriptText(null);
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (!mediaRef.current) return;
    if (isPlaying) {
      mediaRef.current.pause();
    } else {
      mediaRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
    }
  };

  const jumpToTime = (seconds: number) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  if (!media) return null;

  const isVideo = media.file_type.startsWith("video");

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200">
      {/* Media Player */}
      <div className="bg-slate-900 p-4">
        {isVideo ? (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={media.storage_path}
            className="w-full rounded-lg"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
          />
        ) : (
          <div className="aspect-video bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Volume2 className="w-16 h-16 text-white opacity-50" />
          </div>
        )}

        {!isVideo && (
          <audio
            ref={mediaRef as React.RefObject<HTMLAudioElement>}
            src={media.storage_path}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            className="hidden"
          />
        )}

        {/* Controls */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlayPause}
              className="text-white hover:bg-white/10"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => jumpToTime(Number(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <span className="text-xs text-white/70 min-w-[5rem] text-right">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transcript" className="flex-1 flex flex-col">
        <TabsList className="w-full rounded-none border-b border-slate-200">
          <TabsTrigger value="transcript" className="flex-1">
            Transcript
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex-1">
            Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transcript" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {transcriptText ? (
                <div className="text-sm text-slate-700 leading-relaxed">
                  {transcriptText.split("\n").map((line, idx) => (
                    <p key={idx} className="mb-2 hover:bg-indigo-50 p-2 rounded cursor-pointer transition-colors">
                      {line}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-sm">No transcript available</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    Generate Transcript
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="notes" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <p className="text-sm text-slate-400 text-center py-8">
                Linked annotations will appear here
              </p>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}