"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Globe2,
  Users,
  Calendar,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScheduling, useLocalePreferences } from "@/lib/hooks/useTranslation";
import {
  REGIONS,
  type Region,
  type ScheduleSlot,
  getTimezoneOffset,
  formatTimeForTimezone,
} from "@/types/localization";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface TimeZoneSchedulerProps {
  onScheduleChange?: (slots: ScheduleSlot[]) => void;
}

export function TimeZoneScheduler({ onScheduleChange }: TimeZoneSchedulerProps) {
  const { preferences, updatePreferences, isUpdating } = useScheduling();
  const { timezone: userTimezone, timeFormat } = useLocalePreferences();

  const [selectedSlots, setSelectedSlots] = useState<ScheduleSlot[]>(
    (preferences?.available_times as ScheduleSlot[]) || []
  );
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ day: number; hour: number } | null>(null);

  // Check if a slot is selected
  const isSlotSelected = (day: number, hour: number) => {
    return selectedSlots.some(
      (slot) =>
        slot.dayOfWeek === day &&
        hour >= slot.startHour &&
        hour < slot.endHour
    );
  };

  // Handle mouse down to start selection
  const handleMouseDown = (day: number, hour: number) => {
    setIsSelecting(true);
    setSelectionStart({ day, hour });
  };

  // Handle mouse up to finish selection
  const handleMouseUp = (day: number, hour: number) => {
    if (!isSelecting || !selectionStart) return;

    setIsSelecting(false);

    if (selectionStart.day === day) {
      const startHour = Math.min(selectionStart.hour, hour);
      const endHour = Math.max(selectionStart.hour, hour) + 1;

      // Check if we're deselecting
      const existingSlot = selectedSlots.find(
        (slot) =>
          slot.dayOfWeek === day &&
          startHour >= slot.startHour &&
          endHour <= slot.endHour
      );

      if (existingSlot) {
        // Remove the slot
        setSelectedSlots((prev) =>
          prev.filter((slot) => slot !== existingSlot)
        );
      } else {
        // Add new slot, merging with existing if needed
        const newSlot: ScheduleSlot = {
          dayOfWeek: day,
          startHour,
          endHour,
          timezone: userTimezone,
        };

        // Remove overlapping slots for the same day
        const filteredSlots = selectedSlots.filter(
          (slot) =>
            slot.dayOfWeek !== day ||
            slot.endHour < startHour ||
            slot.startHour > endHour
        );

        // Merge with adjacent slots
        const mergedSlot = filteredSlots
          .filter((slot) => slot.dayOfWeek === day)
          .reduce(
            (merged, slot) => {
              if (slot.endHour === merged.startHour || slot.startHour === merged.endHour) {
                return {
                  ...merged,
                  startHour: Math.min(merged.startHour, slot.startHour),
                  endHour: Math.max(merged.endHour, slot.endHour),
                };
              }
              return merged;
            },
            newSlot
          );

        setSelectedSlots([
          ...filteredSlots.filter((slot) => slot.dayOfWeek !== day),
          mergedSlot,
        ]);
      }
    }

    setSelectionStart(null);
  };

  // Save schedule
  const handleSave = async () => {
    await updatePreferences({
      available_times: selectedSlots,
      preferred_regions: (preferences?.preferred_regions as Region[]) || [],
      language_preferences: preferences?.language_preferences || [],
      cross_region_matching: preferences?.cross_region_matching ?? true,
    });
    onScheduleChange?.(selectedSlots);
  };

  // Format hour for display
  const formatHour = (hour: number) => {
    if (timeFormat === "12h") {
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}${period}`;
    }
    return `${hour.toString().padStart(2, "0")}:00`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Your Availability</h3>
          <p className="text-sm text-muted-foreground">
            Click and drag to select your available hours
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {userTimezone} ({getTimezoneOffset(userTimezone)})
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Hour labels */}
          <div className="flex">
            <div className="w-16" />
            {HOURS.filter((h) => h % 2 === 0).map((hour) => (
              <div
                key={hour}
                className="flex-1 text-xs text-muted-foreground text-center"
              >
                {formatHour(hour)}
              </div>
            ))}
          </div>

          {/* Days */}
          {DAYS.map((day, dayIndex) => (
            <div key={day} className="flex items-center mt-1">
              <div className="w-16 text-sm font-medium">{day}</div>
              <div className="flex-1 flex">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className={`h-8 flex-1 border border-border cursor-pointer transition-colors ${
                      isSlotSelected(dayIndex, hour)
                        ? "bg-primary"
                        : "bg-muted hover:bg-muted/80"
                    } ${hour === 0 ? "rounded-l" : ""} ${
                      hour === 23 ? "rounded-r" : ""
                    }`}
                    onMouseDown={() => handleMouseDown(dayIndex, hour)}
                    onMouseUp={() => handleMouseUp(dayIndex, hour)}
                    onMouseEnter={() => {
                      if (isSelecting && selectionStart?.day === dayIndex) {
                        // Preview selection
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted border border-border" />
          <span>Unavailable</span>
        </div>
      </div>

      {/* Summary */}
      {selectedSlots.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="text-sm font-medium mb-2">Selected Times</h4>
          <div className="flex flex-wrap gap-2">
            {selectedSlots
              .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startHour - b.startHour)
              .map((slot, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-primary/10 text-primary rounded text-sm"
                >
                  {DAYS[slot.dayOfWeek]} {formatHour(slot.startHour)}-
                  {formatHour(slot.endHour)}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isUpdating}
        className="w-full"
      >
        {isUpdating ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Check className="h-4 w-4 mr-2" />
        )}
        Save Availability
      </Button>
    </div>
  );
}

// Time converter component
interface TimeConverterProps {
  time: Date;
  fromTimezone?: string;
  toTimezones: string[];
}

export function TimeConverter({ time, fromTimezone, toTimezones }: TimeConverterProps) {
  const { timezone: userTimezone, timeFormat } = useLocalePreferences();
  const sourceTimezone = fromTimezone || userTimezone;

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        Time across regions:
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {toTimezones.map((tz) => (
          <div
            key={tz}
            className="flex items-center justify-between px-3 py-2 bg-muted rounded-lg text-sm"
          >
            <span className="text-muted-foreground truncate">{tz}</span>
            <span className="font-medium">
              {formatTimeForTimezone(time, tz, timeFormat)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Find players component
interface FindPlayersProps {
  gameId?: string;
}

export function FindCompatiblePlayers({ gameId }: FindPlayersProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState(20); // Default to 8 PM
  const { findCompatiblePlayers, isFinding, compatiblePlayers } = useScheduling();
  const { timezone, timeFormat } = useLocalePreferences();

  const handleSearch = async () => {
    const targetTime = new Date(selectedDate);
    targetTime.setHours(selectedHour, 0, 0, 0);

    await findCompatiblePlayers({
      targetTime: targetTime.toISOString(),
      gameId,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-2">Find Compatible Players</h3>
        <p className="text-sm text-muted-foreground">
          Search for players available at your preferred time
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Date</label>
          <input
            type="date"
            value={selectedDate.toISOString().split("T")[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Time</label>
          <select
            value={selectedHour}
            onChange={(e) => setSelectedHour(parseInt(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background"
          >
            {HOURS.map((hour) => (
              <option key={hour} value={hour}>
                {timeFormat === "12h"
                  ? `${hour % 12 || 12}:00 ${hour >= 12 ? "PM" : "AM"}`
                  : `${hour.toString().padStart(2, "0")}:00`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button onClick={handleSearch} disabled={isFinding} className="w-full">
        {isFinding ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Users className="h-4 w-4 mr-2" />
        )}
        Find Players
      </Button>

      {/* Results */}
      {compatiblePlayers.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">
            {compatiblePlayers.length} compatible players found
          </h4>
          <div className="space-y-2">
            {compatiblePlayers.slice(0, 10).map((player: any) => (
              <div
                key={player.user.id}
                className="flex items-center gap-3 p-3 bg-muted rounded-lg"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden">
                  {player.user.avatar_url ? (
                    <img
                      src={player.user.avatar_url}
                      alt={player.user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary font-bold">
                      {player.user.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{player.user.username}</div>
                  <div className="text-xs text-muted-foreground">
                    {player.regions?.join(", ") || player.user.region}
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Invite
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
