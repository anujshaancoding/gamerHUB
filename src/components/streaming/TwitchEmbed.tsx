"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Maximize2, MessageSquare, Play, Volume2, VolumeX } from "lucide-react";
import { useTwitchEmbed } from "@/lib/hooks/useStreaming";

interface TwitchEmbedProps {
  channel: string;
  showChat?: boolean;
  className?: string;
}

export function TwitchEmbed({
  channel,
  showChat = true,
  className,
}: TwitchEmbedProps) {
  const { playerUrl, chatUrl } = useTwitchEmbed(channel);
  const [showChatPanel, setShowChatPanel] = useState(showChat);
  const [muted, setMuted] = useState(true);

  const mutedUrl = playerUrl + (muted ? "&muted=true" : "&muted=false");

  return (
    <div className={className}>
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Player */}
        <div className="flex-1">
          <Card className="overflow-hidden bg-zinc-900 border-zinc-800">
            <div className="aspect-video relative">
              <iframe
                src={mutedUrl}
                frameBorder="0"
                allowFullScreen
                scrolling="no"
                className="absolute inset-0 w-full h-full"
                title={`${channel}'s Twitch stream`}
              />
            </div>

            {/* Controls */}
            <div className="p-2 bg-zinc-900 flex items-center justify-between border-t border-zinc-800">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMuted(!muted)}
                  className="text-zinc-400 hover:text-white"
                >
                  {muted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChatPanel(!showChatPanel)}
                  className={
                    showChatPanel
                      ? "text-purple-400"
                      : "text-zinc-400 hover:text-white"
                  }
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`https://twitch.tv/${channel}`, "_blank")}
                  className="text-zinc-400 hover:text-white"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Chat */}
        {showChatPanel && (
          <Card className="w-full lg:w-[340px] overflow-hidden bg-zinc-900 border-zinc-800">
            <div className="h-[400px] lg:h-full">
              <iframe
                src={chatUrl}
                frameBorder="0"
                scrolling="yes"
                className="w-full h-full"
                title={`${channel}'s Twitch chat`}
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

interface TwitchPlayerOnlyProps {
  channel: string;
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
}

export function TwitchPlayerOnly({
  channel,
  className,
  autoplay = true,
  muted = true,
}: TwitchPlayerOnlyProps) {
  const { playerUrl } = useTwitchEmbed(channel);
  const url = `${playerUrl}&autoplay=${autoplay}&muted=${muted}`;

  return (
    <Card className={`overflow-hidden bg-zinc-900 border-zinc-800 ${className}`}>
      <div className="aspect-video relative">
        <iframe
          src={url}
          frameBorder="0"
          allowFullScreen
          scrolling="no"
          className="absolute inset-0 w-full h-full"
          title={`${channel}'s Twitch stream`}
        />
      </div>
    </Card>
  );
}
