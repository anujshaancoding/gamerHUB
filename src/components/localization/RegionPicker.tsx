"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe2, Users, Check, ChevronRight, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalePreferences, useRegions } from "@/lib/hooks/useTranslation";
import { REGIONS, type Region } from "@/types/localization";

interface RegionPickerProps {
  showStats?: boolean;
  onRegionChange?: (region: Region) => void;
}

export function RegionPicker({ showStats = false, onRegionChange }: RegionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { region, updatePreferences, isUpdating } = useLocalePreferences();
  const { data: regions, isLoading: regionsLoading } = useRegions(showStats);

  const currentRegion = REGIONS[region];

  const handleSelect = async (regionCode: Region) => {
    setIsOpen(false);
    if (regionCode === region) return;

    await updatePreferences({ region: regionCode });
    onRegionChange?.(regionCode);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isUpdating}
        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-input bg-background hover:bg-muted transition-colors w-full"
      >
        {isUpdating ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <span className="text-2xl">{currentRegion.flag}</span>
        )}
        <div className="flex-1 text-left">
          <div className="font-medium">{currentRegion.name}</div>
          <div className="text-xs text-muted-foreground">
            {currentRegion.languages.length} languages
          </div>
        </div>
        <ChevronRight
          className={`h-5 w-5 text-muted-foreground transition-transform ${
            isOpen ? "rotate-90" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 right-0 mt-2 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden"
            >
              <div className="p-2 max-h-96 overflow-y-auto">
                {(regions || Object.entries(REGIONS).map(([code, r]) => ({ code, ...r }))).map(
                  (r: any) => (
                    <button
                      key={r.code}
                      onClick={() => handleSelect(r.code as Region)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                        region === r.code
                          ? "bg-primary/10"
                          : "hover:bg-muted"
                      }`}
                    >
                      <span className="text-2xl">{r.flag}</span>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.currency} • {r.languages?.join(", ") || r.languages}
                        </div>
                      </div>
                      {showStats && r.memberCount !== undefined && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {r.memberCount.toLocaleString()}
                        </div>
                      )}
                      {region === r.code && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </button>
                  )
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Region card for browsing
interface RegionCardProps {
  code: Region;
  showJoinButton?: boolean;
  onSelect?: (code: Region) => void;
}

export function RegionCard({ code, showJoinButton = false, onSelect }: RegionCardProps) {
  const regionInfo = REGIONS[code];
  const { region: userRegion, updatePreferences, isUpdating } = useLocalePreferences();
  const isSelected = userRegion === code;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-card rounded-xl border p-6 cursor-pointer transition-colors ${
        isSelected ? "border-primary" : "border-border hover:border-primary/50"
      }`}
      onClick={() => onSelect?.(code)}
    >
      <div className="flex items-start gap-4">
        <span className="text-4xl">{regionInfo.flag}</span>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{regionInfo.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {regionInfo.languages.length} supported languages
          </p>
          <div className="flex flex-wrap gap-1 mt-3">
            {regionInfo.languages.slice(0, 4).map((lang) => (
              <span
                key={lang}
                className="px-2 py-0.5 text-xs bg-muted rounded-full"
              >
                {lang.toUpperCase()}
              </span>
            ))}
            {regionInfo.languages.length > 4 && (
              <span className="px-2 py-0.5 text-xs bg-muted rounded-full">
                +{regionInfo.languages.length - 4}
              </span>
            )}
          </div>
        </div>
      </div>

      {showJoinButton && (
        <div className="mt-4 pt-4 border-t border-border">
          {isSelected ? (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Check className="h-4 w-4" />
              Your region
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={async (e) => {
                e.stopPropagation();
                await updatePreferences({ region: code });
              }}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MapPin className="h-4 w-4 mr-2" />
              )}
              Set as my region
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// Region selector grid
export function RegionGrid() {
  const { updatePreferences } = useLocalePreferences();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.keys(REGIONS).map((code) => (
        <RegionCard
          key={code}
          code={code as Region}
          showJoinButton
          onSelect={(region) => updatePreferences({ region })}
        />
      ))}
    </div>
  );
}
