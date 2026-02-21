"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  User,
  FileText,
  Trophy,
  Gift,
  Shield,
  Search,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Avatar, Badge } from "@/components/ui";
import { useUniversalSearch } from "@/lib/hooks/useUniversalSearch";
import type {
  SearchUser,
  SearchBlogPost,
  SearchListing,
  SearchClan,
} from "@/types/search";

interface SearchDropdownProps {
  query: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDropdown({ query, isOpen, onClose }: SearchDropdownProps) {
  const { users, blogs, listings, clans, isAnyLoading, isEmpty, debouncedQuery } =
    useUniversalSearch(query, { enabled: isOpen });

  if (!isOpen || query.length < 3) return null;

  // Show loading skeleton while waiting for debounce or first results
  const showLoading =
    isAnyLoading && users.data.length === 0 && blogs.data.length === 0 && listings.data.length === 0 && clans.data.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="fixed sm:absolute left-4 right-4 sm:left-0 sm:right-0 top-16 sm:top-auto sm:mt-2 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-50"
    >
      <div className="max-h-[28rem] overflow-y-auto">
        {showLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-surface-light" />
                <div className="flex-1">
                  <div className="h-4 w-3/4 bg-surface-light rounded mb-1" />
                  <div className="h-3 w-1/2 bg-surface-light rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="p-6 text-center">
            <Search className="h-8 w-8 text-text-muted mx-auto mb-2" />
            <p className="text-sm text-text-muted">
              No results found for &quot;{debouncedQuery}&quot;
            </p>
            <p className="text-xs text-text-dim mt-1">Try different keywords</p>
          </div>
        ) : (
          <>
            {/* Users Section */}
            {(users.data.length > 0 || users.isLoading) && (
              <SearchSection
                title="Users"
                icon={<User className="h-4 w-4" />}
                total={users.total}
                isLoading={users.isLoading}
                seeMoreHref={`/search?q=${encodeURIComponent(query)}&tab=users`}
                onNavigate={onClose}
              >
                {users.data.map((user) => (
                  <UserResultItem key={user.id} user={user} onNavigate={onClose} />
                ))}
              </SearchSection>
            )}

            {/* Blogs Section */}
            {(blogs.data.length > 0 || blogs.isLoading) && (
              <SearchSection
                title="Blogs"
                icon={<FileText className="h-4 w-4" />}
                total={blogs.total}
                isLoading={blogs.isLoading}
                seeMoreHref={`/search?q=${encodeURIComponent(query)}&tab=blogs`}
                onNavigate={onClose}
              >
                {blogs.data.map((post) => (
                  <BlogResultItem key={post.id} post={post} onNavigate={onClose} />
                ))}
              </SearchSection>
            )}

            {/* Tournaments & Giveaways Section */}
            {(listings.data.length > 0 || listings.isLoading) && (
              <SearchSection
                title="Tournaments & Giveaways"
                icon={<Trophy className="h-4 w-4" />}
                total={listings.total}
                isLoading={listings.isLoading}
                seeMoreHref={`/search?q=${encodeURIComponent(query)}&tab=listings`}
                onNavigate={onClose}
              >
                {listings.data.map((listing) => (
                  <ListingResultItem
                    key={listing.id}
                    listing={listing}
                    onNavigate={onClose}
                  />
                ))}
              </SearchSection>
            )}

            {/* Clans Section */}
            {(clans.data.length > 0 || clans.isLoading) && (
              <SearchSection
                title="Clans"
                icon={<Shield className="h-4 w-4" />}
                total={clans.total}
                isLoading={clans.isLoading}
                seeMoreHref={`/search?q=${encodeURIComponent(query)}&tab=clans`}
                onNavigate={onClose}
              >
                {clans.data.map((clan) => (
                  <ClanResultItem key={clan.id} clan={clan} onNavigate={onClose} />
                ))}
              </SearchSection>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {!isEmpty && !showLoading && (
        <div className="border-t border-border">
          <Link
            href={`/search?q=${encodeURIComponent(query)}`}
            className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-primary hover:bg-surface-light transition-colors"
            onClick={onClose}
          >
            <Search className="h-4 w-4" />
            View all results for &quot;{query}&quot;
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </motion.div>
  );
}

// --- Section wrapper ---

interface SearchSectionProps {
  title: string;
  icon: React.ReactNode;
  total: number;
  isLoading: boolean;
  seeMoreHref: string;
  onNavigate: () => void;
  children: React.ReactNode;
}

function SearchSection({
  title,
  icon,
  total,
  isLoading,
  seeMoreHref,
  onNavigate,
  children,
}: SearchSectionProps) {
  return (
    <div className="border-b border-border last:border-b-0">
      <div className="flex items-center justify-between px-4 py-2 bg-surface-light/50">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {icon}
          {title}
          {!isLoading && total > 0 && (
            <span className="text-text-dim font-normal normal-case">({total})</span>
          )}
        </div>
        {isLoading && <Loader2 className="h-3 w-3 animate-spin text-text-muted" />}
      </div>
      <div>{children}</div>
      {total > 3 && (
        <Link
          href={seeMoreHref}
          className="flex items-center gap-1 px-4 py-2 text-xs text-primary hover:bg-surface-light transition-colors"
          onClick={onNavigate}
        >
          See more
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

// --- Individual result items ---

function UserResultItem({
  user,
  onNavigate,
}: {
  user: SearchUser;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={`/profile/${user.username}`}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-light transition-colors"
      onClick={onNavigate}
    >
      <Avatar
        src={user.avatar_url}
        alt={user.display_name || user.username}
        size="sm"
        status={user.is_online ? "online" : "offline"}
        showStatus
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text truncate">
          {user.display_name || user.username}
        </p>
        <p className="text-xs text-text-muted truncate">@{user.username}</p>
      </div>
      <div className="flex items-center gap-1.5">
        {user.is_premium && (
          <Badge variant="warning" size="sm">
            PRO
          </Badge>
        )}
        <Badge variant="default" size="sm">
          Lv.{user.level}
        </Badge>
      </div>
    </Link>
  );
}

function BlogResultItem({
  post,
  onNavigate,
}: {
  post: SearchBlogPost;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-light transition-colors"
      onClick={onNavigate}
    >
      <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-surface-light flex items-center justify-center">
        <FileText className="h-4 w-4 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text truncate">{post.title}</p>
        <p className="text-xs text-text-muted truncate">
          {post.author?.display_name || post.author?.username || "Unknown"}{" "}
          {post.game && <>&middot; {post.game.name}</>}
        </p>
      </div>
      <Badge variant="outline" size="sm">
        {post.category}
      </Badge>
    </Link>
  );
}

function ListingResultItem({
  listing,
  onNavigate,
}: {
  listing: SearchListing;
  onNavigate: () => void;
}) {
  const isTournament = listing.listing_type === "tournament";

  return (
    <Link
      href={`/community?tab=tournaments&listing=${listing.id}`}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-light transition-colors"
      onClick={onNavigate}
    >
      <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-surface-light flex items-center justify-center">
        {isTournament ? (
          <Trophy className="h-4 w-4 text-warning" />
        ) : (
          <Gift className="h-4 w-4 text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text truncate">{listing.title}</p>
        <p className="text-xs text-text-muted truncate">
          {listing.game?.name || "General"}
          {listing.starts_at && (
            <>
              {" "}
              &middot;{" "}
              {new Date(listing.starts_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </>
          )}
        </p>
      </div>
      <Badge
        variant={isTournament ? "warning" : "primary"}
        size="sm"
      >
        {isTournament ? "Tournament" : "Giveaway"}
      </Badge>
    </Link>
  );
}

function ClanResultItem({
  clan,
  onNavigate,
}: {
  clan: SearchClan;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={`/clans/${clan.slug}`}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-light transition-colors"
      onClick={onNavigate}
    >
      <Avatar
        src={clan.avatar_url}
        alt={clan.name}
        fallback={clan.tag}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text truncate">
          {clan.name}{" "}
          <span className="text-text-muted">[{clan.tag}]</span>
        </p>
        <p className="text-xs text-text-muted truncate">
          {clan.member_count} members
          {clan.primary_game && <> &middot; {clan.primary_game.name}</>}
        </p>
      </div>
      {clan.is_recruiting && (
        <Badge variant="success" size="sm">
          Recruiting
        </Badge>
      )}
    </Link>
  );
}
