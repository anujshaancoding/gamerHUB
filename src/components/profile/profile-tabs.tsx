"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  Gamepad2,
  Trophy,
  Activity,
} from "lucide-react";
import { useGameTheme } from "@/components/profile/game-theme-provider";

export type ProfileTabKey = "overview" | "games" | "achievements" | "activity";

interface TabDefinition {
  key: ProfileTabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabDefinition[] = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "games", label: "Games & Stats", icon: Gamepad2 },
  { key: "achievements", label: "Achievements", icon: Trophy },
  { key: "activity", label: "Activity", icon: Activity },
];

interface ProfileTabsProps {
  children: Record<ProfileTabKey, React.ReactNode>;
  defaultTab?: ProfileTabKey;
}

export function ProfileTabs({ children, defaultTab = "overview" }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<ProfileTabKey>(defaultTab);
  const { theme } = useGameTheme();

  return (
    <div>
      {/* Tab Bar */}
      <div className="relative mb-6">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide p-1 rounded-xl bg-surface/80 backdrop-blur-sm border border-border">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                  transition-colors whitespace-nowrap flex-1 justify-center
                  ${isActive
                    ? "text-white"
                    : "text-text-muted hover:text-text-secondary"
                  }
                `}
              >
                {/* Active tab background */}
                {isActive && (
                  <motion.div
                    layoutId="activeProfileTab"
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, ${theme.colors.primary}CC, ${theme.colors.primary}99)`,
                      boxShadow: `0 0 20px ${theme.colors.glow}`,
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                <Icon className={`h-4 w-4 relative z-10 ${isActive ? "" : ""}`} />
                <span className="relative z-10 hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {children[activeTab]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
