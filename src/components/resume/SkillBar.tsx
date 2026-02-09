"use client";

import { motion } from "framer-motion";
import {
  Crosshair,
  Brain,
  MessageCircle,
  Crown,
  RefreshCw,
  Map,
  Users,
  Shield,
  ThumbsUp,
} from "lucide-react";
import { SKILL_CATEGORIES, type SkillCategory, type ResumeSkill } from "@/types/resume";

const SKILL_ICONS: Record<SkillCategory, React.ElementType> = {
  mechanical: Crosshair,
  game_sense: Brain,
  communication: MessageCircle,
  leadership: Crown,
  adaptability: RefreshCw,
  strategy: Map,
  teamwork: Users,
  composure: Shield,
};

interface SkillBarProps {
  skill: ResumeSkill;
  showEndorsements?: boolean;
  editable?: boolean;
  onLevelChange?: (level: number) => void;
  onEndorse?: () => void;
  canEndorse?: boolean;
}

export function SkillBar({
  skill,
  showEndorsements = true,
  editable = false,
  onLevelChange,
  onEndorse,
  canEndorse = false,
}: SkillBarProps) {
  const skillInfo = SKILL_CATEGORIES[skill.category];
  const Icon = SKILL_ICONS[skill.category];

  const getLevelLabel = (level: number): string => {
    if (level >= 90) return "Expert";
    if (level >= 75) return "Advanced";
    if (level >= 50) return "Intermediate";
    if (level >= 25) return "Beginner";
    return "Novice";
  };

  const getLevelColor = (level: number): string => {
    if (level >= 90) return "bg-gradient-to-r from-yellow-500 to-orange-500";
    if (level >= 75) return "bg-gradient-to-r from-purple-500 to-pink-500";
    if (level >= 50) return "bg-gradient-to-r from-blue-500 to-cyan-500";
    if (level >= 25) return "bg-gradient-to-r from-green-500 to-emerald-500";
    return "bg-gray-500";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <span className="font-medium text-sm">{skillInfo.name}</span>
            <span className="ml-2 text-xs text-muted-foreground">
              {getLevelLabel(skill.level)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showEndorsements && skill.endorsements > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ThumbsUp className="h-3 w-3" />
              {skill.endorsements}
            </div>
          )}
          {canEndorse && onEndorse && (
            <button
              onClick={onEndorse}
              className="p-1 hover:bg-muted rounded transition-colors"
              title="Endorse this skill"
            >
              <ThumbsUp className="h-4 w-4 text-muted-foreground hover:text-primary" />
            </button>
          )}
          <span className="text-sm font-medium w-8 text-right">{skill.level}%</span>
        </div>
      </div>

      <div className="relative">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${skill.level}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${getLevelColor(skill.level)}`}
          />
        </div>

        {editable && (
          <input
            type="range"
            min={0}
            max={100}
            value={skill.level}
            onChange={(e) => onLevelChange?.(parseInt(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        )}
      </div>

      {skillInfo.description && (
        <p className="text-xs text-muted-foreground">{skillInfo.description}</p>
      )}
    </div>
  );
}

// Skill grid for resume view
interface SkillGridProps {
  skills: ResumeSkill[];
  editable?: boolean;
  onSkillChange?: (category: SkillCategory, level: number) => void;
  onEndorse?: (category: SkillCategory) => void;
  canEndorse?: boolean;
}

export function SkillGrid({
  skills,
  editable = false,
  onSkillChange,
  onEndorse,
  canEndorse = false,
}: SkillGridProps) {
  // Sort by level descending
  const sortedSkills = [...skills].sort((a, b) => b.level - a.level);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sortedSkills.map((skill) => (
        <SkillBar
          key={skill.category}
          skill={skill}
          editable={editable}
          onLevelChange={(level) => onSkillChange?.(skill.category, level)}
          onEndorse={() => onEndorse?.(skill.category)}
          canEndorse={canEndorse}
        />
      ))}
    </div>
  );
}

// Skill radar chart (simplified CSS version)
interface SkillRadarProps {
  skills: ResumeSkill[];
  size?: number;
}

export function SkillRadar({ skills, size = 200 }: SkillRadarProps) {
  const categories = Object.keys(SKILL_CATEGORIES) as SkillCategory[];
  const numCategories = categories.length;
  const angleStep = (2 * Math.PI) / numCategories;

  // Create skill map for quick lookup
  const skillMap = new Map(skills.map((s) => [s.category, s.level]));

  // Calculate points for the polygon
  const points = categories.map((category, index) => {
    const level = skillMap.get(category) || 0;
    const normalizedLevel = (level / 100) * (size / 2 - 20);
    const angle = index * angleStep - Math.PI / 2;
    const x = size / 2 + normalizedLevel * Math.cos(angle);
    const y = size / 2 + normalizedLevel * Math.sin(angle);
    return { x, y, category, level };
  });

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Create background rings
  const rings = [20, 40, 60, 80, 100].map((level) => {
    const normalizedLevel = (level / 100) * (size / 2 - 20);
    return categories.map((_, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x = size / 2 + normalizedLevel * Math.cos(angle);
      const y = size / 2 + normalizedLevel * Math.sin(angle);
      return `${x},${y}`;
    }).join(" ");
  });

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background rings */}
        {rings.map((ringPoints, index) => (
          <polygon
            key={index}
            points={ringPoints}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-muted/30"
          />
        ))}

        {/* Axis lines */}
        {categories.map((_, index) => {
          const angle = index * angleStep - Math.PI / 2;
          const x2 = size / 2 + (size / 2 - 20) * Math.cos(angle);
          const y2 = size / 2 + (size / 2 - 20) * Math.sin(angle);
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

        {/* Data polygon */}
        <motion.polygon
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          points={polygonPoints}
          fill="currentColor"
          fillOpacity={0.3}
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
        />

        {/* Data points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="currentColor"
            className="text-primary"
          />
        ))}

        {/* Labels */}
        {categories.map((category, index) => {
          const angle = index * angleStep - Math.PI / 2;
          const labelRadius = size / 2 + 10;
          const x = size / 2 + labelRadius * Math.cos(angle);
          const y = size / 2 + labelRadius * Math.sin(angle);
          const Icon = SKILL_ICONS[category];

          return (
            <g key={category} transform={`translate(${x - 8}, ${y - 8})`}>
              <foreignObject width="16" height="16">
                <div className="text-muted-foreground" title={SKILL_CATEGORIES[category].name}>
                  <Icon className="h-4 w-4" />
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
