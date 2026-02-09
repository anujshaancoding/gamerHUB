"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Image, Play, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui";
import type { Media } from "@/types/database";

interface ProfileMediaProps {
  media: Media[];
  username: string;
}

export function ProfileMedia({ media, username }: ProfileMediaProps) {
  if (media.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Media</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Image className="h-12 w-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-muted">No media uploaded yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Media</CardTitle>
        <Link href={`/media?user=${username}`}>
          <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="h-4 w-4" />}>
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {media.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="relative aspect-video rounded-lg overflow-hidden bg-surface-light group cursor-pointer"
            >
              {item.type === "video" ? (
                <>
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.title || "Video thumbnail"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-lighter flex items-center justify-center">
                      <Play className="h-8 w-8 text-text-muted" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-10 w-10 text-white" />
                  </div>
                </>
              ) : (
                <img
                  src={item.url}
                  alt={item.title || "Image"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}

              {/* Overlay with title */}
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                {item.title && (
                  <p className="text-white text-sm truncate">{item.title}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
