"use client";

import { motion } from "framer-motion";
import {
  Crosshair,
  MessageCircle,
  Calendar,
  Trophy,
  Users,
  BookOpen,
} from "lucide-react";
import {
  DNA_CATEGORIES,
  type DNATraits,
  type DNATraitCategory,
  type CompatibilityResult,
  getChemistryColor,
  getChemistryEmoji,
} from "@/types/squad-dna";

const CATEGORY_ICONS: Record<DNATraitCategory, React.ElementType> = {
  playstyle: Crosshair,
  communication: MessageCircle,
  schedule: Calendar,
  competitiveness: Trophy,
  social: Users,
  learning: BookOpen,
};

interface DNARadarChartProps {
  traits: DNATraits;
  size?: number;
  showLabels?: boolean;
  animate?: boolean;
  comparisonTraits?: DNATraits;
}

export function DNARadarChart({
  traits,
  size = 250,
  showLabels = true,
  animate = true,
  comparisonTraits,
}: DNARadarChartProps) {
  const categories = Object.keys(DNA_CATEGORIES) as DNATraitCategory[];
  const numCategories = categories.length;
  const angleStep = (2 * Math.PI) / numCategories;
  const maxRadius = size / 2 - 30;

  // Calculate trait "intensity" for each category (0-100)
  const getIntensity = (category: DNATraitCategory, t: DNATraits): number => {
    const traitCount = t[category]?.length || 0;
    // More traits = higher intensity, max out at 5 traits
    return Math.min(traitCount * 20, 100);
  };

  // Calculate points for the polygon
  const calculatePoints = (t: DNATraits) =>
    categories.map((category, index) => {
      const intensity = getIntensity(category, t);
      const normalizedRadius = (intensity / 100) * maxRadius;
      const angle = index * angleStep - Math.PI / 2;
      const x = size / 2 + normalizedRadius * Math.cos(angle);
      const y = size / 2 + normalizedRadius * Math.sin(angle);
      return { x, y, category, intensity };
    });

  const points = calculatePoints(traits);
  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  const comparisonPoints = comparisonTraits ? calculatePoints(comparisonTraits) : null;
  const comparisonPolygonPoints = comparisonPoints?.map((p) => `${p.x},${p.y}`).join(" ");

  // Create background rings
  const rings = [25, 50, 75, 100].map((level) => {
    const normalizedRadius = (level / 100) * maxRadius;
    return categories.map((_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = size / 2 + normalizedRadius * Math.cos(angle);
      const y = size / 2 + normalizedRadius * Math.sin(angle);
      return `${x},${y}`;
    }).join(" ");
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background rings */}
        {rings.map((ringPoints, index) => (
          <polygon
            key={index}
            points={ringPoints}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-muted/20"
          />
        ))}

        {/* Axis lines */}
        {categories.map((_, index) => {
          const angle = index * angleStep - Math.PI / 2;
          const x2 = size / 2 + maxRadius * Math.cos(angle);
          const y2 = size / 2 + maxRadius * Math.sin(angle);
          return (
            <line
              key={index}
              x1={size / 2}
              y1={size / 2}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth="1"
              className="text-muted/20"
            />
          );
        })}

        {/* Comparison polygon (if provided) */}
        {comparisonPolygonPoints && (
          <motion.polygon
            initial={animate ? { opacity: 0 } : undefined}
            animate={{ opacity: 0.5 }}
            points={comparisonPolygonPoints}
            fill="currentColor"
            fillOpacity={0.1}
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 2"
            className="text-muted-foreground"
          />
        )}

        {/* Main data polygon */}
        <motion.polygon
          initial={animate ? { opacity: 0, scale: 0.8 } : undefined}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          points={polygonPoints}
          fill="currentColor"
          fillOpacity={0.3}
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
        />

        {/* Data points */}
        {points.map((point, index) => (
          <motion.circle
            key={point.category}
            initial={animate ? { opacity: 0 } : undefined}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            cx={point.x}
            cy={point.y}
            r="5"
            fill="currentColor"
            className="text-primary"
          />
        ))}

        {/* Labels */}
        {showLabels &&
          categories.map((category, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const labelRadius = maxRadius + 25;
            const x = size / 2 + labelRadius * Math.cos(angle);
            const y = size / 2 + labelRadius * Math.sin(angle);
            const Icon = CATEGORY_ICONS[category];

            return (
              <g key={category} transform={`translate(${x - 12}, ${y - 12})`}>
                <foreignObject width="24" height="24">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${DNA_CATEGORIES[category].color}20` }}
                    title={DNA_CATEGORIES[category].name}
                  >
                    <Icon
                      className="h-3.5 w-3.5"
                      style={{ color: DNA_CATEGORIES[category].color }}
                    />
                  </div>
                </foreignObject>
              </g>
            );
          })}
      </svg>

      {/* Legend */}
      {showLabels && (
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {categories.map((category) => (
            <div
              key={category}
              className="flex items-center gap-1.5 text-xs"
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: DNA_CATEGORIES[category].color }}
              />
              <span className="text-muted-foreground">
                {DNA_CATEGORIES[category].name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Compatibility score display
interface CompatibilityScoreProps {
  result: CompatibilityResult;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
}

export function CompatibilityScore({
  result,
  size = "md",
  showDetails = false,
}: CompatibilityScoreProps) {
  const sizeClasses = {
    sm: "w-16 h-16 text-lg",
    md: "w-24 h-24 text-2xl",
    lg: "w-32 h-32 text-3xl",
  };

  const chemistryColor = getChemistryColor(result.chemistry);

  return (
    <div className="flex flex-col items-center">
      {/* Score circle */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`${sizeClasses[size]} rounded-full flex flex-col items-center justify-center font-bold border-4`}
        style={{
          borderColor: chemistryColor,
          backgroundColor: `${chemistryColor}10`,
        }}
      >
        <span style={{ color: chemistryColor }}>{result.overallScore}%</span>
        <span className="text-xs">{getChemistryEmoji(result.chemistry)}</span>
      </motion.div>

      <p
        className="mt-2 font-medium capitalize"
        style={{ color: chemistryColor }}
      >
        {result.chemistry} Match
      </p>

      {/* Details */}
      {showDetails && (
        <div className="mt-4 w-full space-y-2">
          {Object.entries(result.categoryScores).map(([category, score]) => {
            const catInfo = DNA_CATEGORIES[category as DNATraitCategory];
            return (
              <div key={category} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: catInfo.color }}
                />
                <span className="text-sm flex-1">{catInfo.name}</span>
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ delay: 0.2 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: catInfo.color }}
                  />
                </div>
                <span className="text-sm w-8 text-right">{score}%</span>
              </div>
            );
          })}

          {/* Strengths & Weaknesses */}
          {result.strengths.length > 0 && (
            <div className="pt-2 mt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Strengths:</p>
              <div className="flex flex-wrap gap-1">
                {result.strengths.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 text-xs bg-green-500/10 text-green-500 rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.weaknesses.length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-1">Could improve:</p>
              <div className="flex flex-wrap gap-1">
                {result.weaknesses.map((w) => (
                  <span
                    key={w}
                    className="px-2 py-0.5 text-xs bg-orange-500/10 text-orange-500 rounded-full"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Player match card
interface PlayerMatchCardProps {
  match: {
    user: {
      id: string;
      username: string;
      avatar_url?: string;
    };
    compatibility: CompatibilityResult;
    commonGames?: string[];
  };
  onConnect?: () => void;
}

export function PlayerMatchCard({ match, onConnect }: PlayerMatchCardProps) {
  const chemistryColor = getChemistryColor(match.compatibility.chemistry);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 transition-colors"
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-muted overflow-hidden">
          {match.user.avatar_url ? (
            <img
              src={match.user.avatar_url}
              alt={match.user.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-primary">
              {match.user.username?.[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h3 className="font-medium">{match.user.username}</h3>
          <div className="flex items-center gap-2 text-sm">
            <span
              className="font-medium"
              style={{ color: chemistryColor }}
            >
              {match.compatibility.overallScore}% match
            </span>
            <span>{getChemistryEmoji(match.compatibility.chemistry)}</span>
          </div>
          {match.commonGames && match.commonGames.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Plays: {match.commonGames.slice(0, 3).join(", ")}
            </p>
          )}
        </div>

        {/* Compatibility badge */}
        <div
          className="w-14 h-14 rounded-lg flex flex-col items-center justify-center text-sm font-bold"
          style={{
            backgroundColor: `${chemistryColor}10`,
            color: chemistryColor,
          }}
        >
          <span className="text-lg">{match.compatibility.overallScore}</span>
          <span className="text-xs opacity-75">%</span>
        </div>
      </div>

      {/* Strengths */}
      {match.compatibility.strengths.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {match.compatibility.strengths.map((s) => (
            <span
              key={s}
              className="px-2 py-0.5 text-xs bg-green-500/10 text-green-500 rounded-full"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Connect button */}
      {onConnect && (
        <button
          onClick={onConnect}
          className="w-full mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Connect
        </button>
      )}
    </motion.div>
  );
}
