import { useState, useRef, useEffect } from "react";
import { mediaService, type MediaFile } from "@/services/mediaService";
import { Play, Pause, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TranscriptView } from "@/components/workspace/TranscriptView";

interface MediaPanelProps {
  media: MediaFile | null;
  projectId: string;
}

export function MediaPanel({ media, projectId }: MediaPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [transcriptText, setTranscriptText] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (media) {
      loadMedia(media);
    } else {
      cleanupBlobUrl();
      setMediaUrl(null);
      setTranscriptText(null);
    }

    return () => {
      cleanupBlobUrl();
    };
  }, [media]);

  // Load transcript when media file changes
  useEffect(() => {
    if (media) {
      // Transcript is now handled by TranscriptView component
    }
  }, [media]);

  function cleanupBlobUrl() {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }

  async function loadMedia(mediaFile: MediaFile) {
    setIsLoadingMedia(true);
    setLoadingProgress(0);
    cleanupBlobUrl();

    try {
      if (mediaFile.is_chunked && mediaFile.total_chunks) {
        // Chunked file - fetch and concatenate chunks
        const chunkUrls = await mediaService.getChunkedMediaUrls(mediaFile);
        const chunks: Blob[] = [];

        for (let i = 0; i < chunkUrls.length; i++) {
          const response = await fetch(chunkUrls[i]);
          if (!response.ok) {
            throw new Error(`Failed to fetch chunk ${i}`);
          }
          const blob = await response.blob();
          chunks.push(blob);
          setLoadingProgress(Math.round(((i + 1) / chunkUrls.length) * 100));
        }

        // Concatenate all chunks into a single Blob
        const mergedBlob = new Blob(chunks, { type: mediaFile.file_type });
        const blobUrl = URL.createObjectURL(mergedBlob);
        blobUrlRef.current = blobUrl;
        setMediaUrl(blobUrl);
      } else {
        // Regular file - use direct URL
        const url = mediaService.getMediaUrl(mediaFile.storage_path);
        setMediaUrl(url);
      }
    } catch (error) {
      console.error("Failed to load media", error);
      setMediaUrl(null);
    } finally {
      setIsLoadingMedia(false);
      setLoadingProgress(0);
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
        {isLoadingMedia ? (
          <div className="aspect-video bg-slate-800 rounded-lg flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
            <div className="text-white text-sm">
              Loading chunks... {loadingProgress}%
            </div>
            <div className="w-48 h-1 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
        ) : mediaUrl ? (
          <>
            {isVideo ? (
              <video
                ref={mediaRef as React.RefObject<HTMLVideoElement>}
                src={mediaUrl}
                className="w-full rounded-lg"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                controls
              />
            ) : (
              <div className="aspect-video bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Volume2 className="w-16 h-16 text-white opacity-50" />
              </div>
            )}

            {!isVideo && (
              <audio
                ref={mediaRef as React.RefObject<HTMLAudioElement>}
                src={mediaUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                className="hidden"
              />
            )}

            {/* Controls for Audio (Video has native controls) */}
            {!isVideo && (
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
            )}
          </>
        ) : (
          <div className="aspect-video bg-slate-800 rounded-lg flex items-center justify-center">
            <p className="text-slate-400 text-sm">Failed to load media</p>
          </div>
        )}

        {media.is_chunked && !isLoadingMedia && (
          <div className="mt-2 text-xs text-slate-400 text-center">
            Chunked file ({media.total_chunks} parts)
          </div>
        )}
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

        <TabsContent value="transcript" className="flex-1 min-h-0 m-0">
          {media ? (
            <TranscriptView 
              mediaFileId={media.id}
              projectId={projectId}
              currentTime={currentTime}
              onSeek={jumpToTime}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground p-8 text-center">
              <p>Select a media file to view its transcript</p>
            </div>
          )}
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