"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ExternalLink,
  Check,
  X,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { CommunityEvent, EventRSVPStatus, EventType } from "@/types/community";

interface EventCardProps {
  event: CommunityEvent;
  onRsvp?: (status: EventRSVPStatus) => void;
  isRsvping?: boolean;
  variant?: "default" | "compact" | "featured";
}

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  tournament: "Tournament",
  viewing_party: "Watch Party",
  meetup: "Meetup",
  stream: "Stream",
  practice: "Practice",
  workshop: "Workshop",
  other: "Event",
};

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  tournament: "bg-purple-500/10 text-purple-500",
  viewing_party: "bg-blue-500/10 text-blue-500",
  meetup: "bg-green-500/10 text-green-500",
  stream: "bg-red-500/10 text-red-500",
  practice: "bg-yellow-500/10 text-yellow-500",
  workshop: "bg-orange-500/10 text-orange-500",
  other: "bg-gray-500/10 text-gray-500",
};

export function EventCard({
  event,
  onRsvp,
  isRsvping,
  variant = "default",
}: EventCardProps) {
  const startDate = new Date(event.starts_at);
  const isUpcoming = startDate > new Date();
  const isFull = event.max_attendees && event.rsvp_count >= event.max_attendees;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getRsvpButton = (status: EventRSVPStatus) => {
    const isActive = event.user_rsvp === status;
    const configs = {
      going: {
        icon: Check,
        label: "Going",
        activeClass: "bg-green-500 text-white",
      },
      maybe: {
        icon: HelpCircle,
        label: "Maybe",
        activeClass: "bg-yellow-500 text-white",
      },
      not_going: {
        icon: X,
        label: "Can't Go",
        activeClass: "bg-gray-500 text-white",
      },
    };

    const config = configs[status];
    const Icon = config.icon;

    return (
      <Button
        key={status}
        variant={isActive ? "default" : "outline"}
        size="sm"
        onClick={() => onRsvp?.(status)}
        disabled={isRsvping || (status === "going" && isFull && !isActive)}
        className={isActive ? config.activeClass : ""}
      >
        {isRsvping ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Icon className="h-4 w-4 mr-1" />
            {config.label}
          </>
        )}
      </Button>
    );
  };

  if (variant === "compact") {
    return (
      <Link href={`/events/${event.slug}`}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
        >
          {/* Date Box */}
          <div className="w-12 h-14 rounded-lg bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
            <span className="text-xs text-primary uppercase">
              {startDate.toLocaleDateString("en-US", { month: "short" })}
            </span>
            <span className="text-xl font-bold text-primary">
              {startDate.getDate()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{event.title}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatTime(startDate)}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {event.rsvp_count}
                {event.max_attendees && ` / ${event.max_attendees}`}
              </span>
            </div>
          </div>

          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              EVENT_TYPE_COLORS[event.event_type]
            }`}
          >
            {EVENT_TYPE_LABELS[event.event_type]}
          </span>
        </motion.div>
      </Link>
    );
  }

  // Default and featured variants
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border border-border bg-card overflow-hidden ${
        variant === "featured" ? "md:flex" : ""
      }`}
    >
      {/* Cover Image */}
      {event.cover_image_url && (
        <div
          className={`relative ${
            variant === "featured" ? "md:w-64 flex-shrink-0" : "h-40"
          }`}
        >
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/banners/gaming-2.svg'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Type Badge */}
          <span
            className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
              EVENT_TYPE_COLORS[event.event_type]
            }`}
          >
            {EVENT_TYPE_LABELS[event.event_type]}
          </span>

          {event.is_featured && (
            <span className="absolute top-3 right-3 px-2 py-1 rounded-full bg-yellow-500/90 text-xs font-medium text-black">
              Featured
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex-1 space-y-3">
        {!event.cover_image_url && (
          <span
            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
              EVENT_TYPE_COLORS[event.event_type]
            }`}
          >
            {EVENT_TYPE_LABELS[event.event_type]}
          </span>
        )}

        <div>
          <Link
            href={`/events/${event.slug}`}
            className="hover:text-primary transition-colors"
          >
            <h3 className="font-semibold text-lg">{event.title}</h3>
          </Link>
          {event.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {event.description}
            </p>
          )}
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(startDate)}</span>
            <span>•</span>
            <Clock className="h-4 w-4" />
            <span>{formatTime(startDate)}</span>
          </div>

          {event.location_details && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{event.location_details}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {event.rsvp_count} going
              {event.max_attendees && (
                <>
                  {" "}
                  / {event.max_attendees} spots
                  {isFull && (
                    <span className="text-yellow-500 ml-1">(Full)</span>
                  )}
                </>
              )}
            </span>
          </div>
        </div>

        {/* External Link */}
        {event.external_link && (
          <a
            href={event.external_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            Event Link
          </a>
        )}

        {/* RSVP Buttons */}
        {isUpcoming && onRsvp && (
          <div className="flex gap-2 pt-2">
            {getRsvpButton("going")}
            {getRsvpButton("maybe")}
            {getRsvpButton("not_going")}
          </div>
        )}

        {/* Organizer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            {event.organizer?.avatar_url ? (
              <img
                src={event.organizer.avatar_url}
                alt={event.organizer.username}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-muted" />
            )}
            <span className="text-sm text-muted-foreground">
              by {event.organizer?.username}
            </span>
          </div>
          {event.game && (
            <span className="text-xs text-muted-foreground">
              {event.game.name}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
