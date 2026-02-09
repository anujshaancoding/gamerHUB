"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Eye,
  ThumbsUp,
  Share2,
  Copy,
  ExternalLink,
  Trophy,
  Users,
  Gamepad2,
  Calendar,
  MapPin,
  Globe,
  Mail,
  Twitter,
  Twitch,
  Youtube,
  Check,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkillGrid, SkillRadar } from "./SkillBar";
import {
  type ResumeWithUser,
  type ResumeData,
  type SkillCategory,
  getPlacementLabel,
  getPlacementColor,
  getRarityColor,
} from "@/types/resume";
import { useState } from "react";

interface ResumePreviewProps {
  resume: ResumeWithUser;
  isOwner?: boolean;
  onEndorse?: (skill: SkillCategory) => void;
}

export function ResumePreview({ resume, isOwner = false, onEndorse }: ResumePreviewProps) {
  const [copied, setCopied] = useState(false);
  const data = resume.data as ResumeData;

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/r/${resume.slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/r/${resume.slug}`;
    if (navigator.share) {
      await navigator.share({
        title: `${resume.user.username}'s Gaming Resume`,
        text: resume.headline || `Check out ${resume.user.username}'s gaming resume!`,
        url,
      });
    } else {
      handleCopyLink();
    }
  };

  const visibleSections = data.visibleSections || [
    "bio", "games", "stats", "achievements", "tournaments", "endorsements"
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border overflow-hidden"
      >
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />

        <div className="p-6 -mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-xl bg-muted border-4 border-card overflow-hidden">
              {resume.user.avatar_url ? (
                <img
                  src={resume.user.avatar_url}
                  alt={resume.user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-primary">
                  {resume.user.username?.[0]?.toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold">{resume.user.username}</h1>
              {resume.headline && (
                <p className="text-lg text-muted-foreground mt-1">{resume.headline}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {resume.view_count} views
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  {resume.endorsement_count} endorsements
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                {copied ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied ? "Copied!" : "Copy Link"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              {isOwner && (
                <Button asChild size="sm">
                  <Link href="/resume/edit">Edit Resume</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bio Section */}
      {visibleSections.includes("bio") && data.bio && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <h2 className="text-lg font-semibold mb-4">About</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">{data.bio}</p>

          {/* Looking For */}
          {data.lookingFor && data.lookingFor.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-medium mb-2">Looking for:</p>
              <div className="flex flex-wrap gap-2">
                {data.lookingFor.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full capitalize"
                  >
                    {item.replace("_", " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Availability */}
          {data.availability && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Availability:</span>
              <span>{data.availability}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Games Section */}
      {visibleSections.includes("games") && data.games && data.games.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Games
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.games.map((game, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg"
              >
                {game.gameIcon && (
                  <img
                    src={game.gameIcon}
                    alt={game.gameName}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-medium">{game.gameName}</h3>
                  {game.rank && (
                    <p className="text-sm text-primary">{game.rank}</p>
                  )}
                  {game.peakRank && game.peakRank !== game.rank && (
                    <p className="text-xs text-muted-foreground">
                      Peak: {game.peakRank}
                    </p>
                  )}
                  {game.roles && game.roles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {game.roles.map((role) => (
                        <span
                          key={role}
                          className="px-2 py-0.5 text-xs bg-background rounded capitalize"
                        >
                          {role.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {game.hoursPlayed && (
                  <div className="text-right text-sm">
                    <p className="font-medium">{game.hoursPlayed}h</p>
                    <p className="text-xs text-muted-foreground">played</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Skills Section */}
      {visibleSections.includes("stats") && data.skills && data.skills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <h2 className="text-lg font-semibold mb-6">Skills</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SkillRadar skills={data.skills} />
            <SkillGrid
              skills={data.skills}
              canEndorse={!isOwner}
              onEndorse={onEndorse}
            />
          </div>
        </motion.div>
      )}

      {/* Tournaments Section */}
      {visibleSections.includes("tournaments") && data.tournaments && data.tournaments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Tournament History
          </h2>
          <div className="space-y-4">
            {data.tournaments.map((tournament, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg"
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: `${getPlacementColor(tournament.placement)}20`, color: getPlacementColor(tournament.placement) }}
                >
                  {tournament.placement === "1st" ? "🥇" :
                   tournament.placement === "2nd" ? "🥈" :
                   tournament.placement === "3rd" ? "🥉" :
                   getPlacementLabel(tournament.placement).replace("Top ", "")}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{tournament.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{tournament.game}</span>
                    <span>•</span>
                    <span>{new Date(tournament.date).toLocaleDateString()}</span>
                    {tournament.teamName && (
                      <>
                        <span>•</span>
                        <span>{tournament.teamName}</span>
                      </>
                    )}
                  </div>
                </div>
                {tournament.prizeWon && tournament.prizeWon > 0 && (
                  <div className="text-right">
                    <p className="font-medium text-green-500">
                      ${tournament.prizeWon.toLocaleString()}
                    </p>
                  </div>
                )}
                {tournament.link && (
                  <a
                    href={tournament.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Teams Section */}
      {visibleSections.includes("teams") && data.teams && data.teams.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team History
          </h2>
          <div className="space-y-4">
            {data.teams.map((team, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                  {team.logo ? (
                    <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{team.name}</h3>
                    {team.isCurrentTeam && (
                      <span className="px-2 py-0.5 text-xs bg-green-500/10 text-green-500 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="capitalize">{team.role.replace("_", " ")}</span>
                    <span>•</span>
                    <span>{team.game}</span>
                    <span>•</span>
                    <span>
                      {new Date(team.startDate).toLocaleDateString()} -{" "}
                      {team.endDate ? new Date(team.endDate).toLocaleDateString() : "Present"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Achievements Section */}
      {visibleSections.includes("achievements") && data.achievements && data.achievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Achievements</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.achievements.map((achievement, index) => (
              <div
                key={index}
                className="p-4 bg-muted/50 rounded-lg text-center"
                style={{ borderLeft: `3px solid ${getRarityColor(achievement.rarity)}` }}
              >
                <div
                  className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-2xl mb-2"
                  style={{ backgroundColor: `${getRarityColor(achievement.rarity)}20` }}
                >
                  {achievement.icon || "🏆"}
                </div>
                <h3 className="font-medium text-sm">{achievement.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Contact Section */}
      {visibleSections.includes("contact") && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Contact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.discordUsername && (
              <a
                href={`https://discord.com/users/${data.discordUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <Globe className="h-5 w-5 text-[#5865F2]" />
                <span className="text-sm truncate">{data.discordUsername}</span>
              </a>
            )}
            {data.twitterHandle && (
              <a
                href={`https://twitter.com/${data.twitterHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <Twitter className="h-5 w-5 text-[#1DA1F2]" />
                <span className="text-sm truncate">@{data.twitterHandle}</span>
              </a>
            )}
            {data.twitchUsername && (
              <a
                href={`https://twitch.tv/${data.twitchUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <Twitch className="h-5 w-5 text-[#9146FF]" />
                <span className="text-sm truncate">{data.twitchUsername}</span>
              </a>
            )}
            {data.youtubeChannel && (
              <a
                href={data.youtubeChannel.startsWith("http") ? data.youtubeChannel : `https://youtube.com/@${data.youtubeChannel}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <Youtube className="h-5 w-5 text-[#FF0000]" />
                <span className="text-sm truncate">{data.youtubeChannel}</span>
              </a>
            )}
            {data.email && (
              <a
                href={`mailto:${data.email}`}
                className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm truncate">{data.email}</span>
              </a>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
