"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  User,
  FileText,
  Trophy,
  Gift,
  Shield,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Input, Card, Avatar, Badge, Button } from "@/components/ui";
import { useUniversalSearch } from "@/lib/hooks/useUniversalSearch";
import type { SearchCategory } from "@/types/search";
import { cn } from "@/lib/utils";

type Tab = SearchCategory | "all";

const TABS: { value: Tab; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "All", icon: <Search className="h-4 w-4" /> },
  { value: "users", label: "Users", icon: <User className="h-4 w-4" /> },
  { value: "blogs", label: "Blogs", icon: <FileText className="h-4 w-4" /> },
  {
    value: "listings",
    label: "Tournaments & Giveaways",
    icon: <Trophy className="h-4 w-4" />,
  },
  { value: "clans", label: "Clans", icon: <Shield className="h-4 w-4" /> },
];

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  const initialTab = (searchParams.get("tab") as Tab) || "all";

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Use higher limits for the full page
  const limit = activeTab === "all" ? 6 : 20;
  const { users, blogs, listings, clans, isAnyLoading, isEmpty } =
    useUniversalSearch(query, { limit });

  // Sync URL when query or tab changes
  useEffect(() => {
    if (query.length >= 3) {
      const params = new URLSearchParams();
      params.set("q", query);
      if (activeTab !== "all") params.set("tab", activeTab);
      router.replace(`/search?${params.toString()}`);
    }
  }, [query, activeTab, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const showSection = (tab: SearchCategory) =>
    activeTab === "all" || activeTab === tab;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Header */}
      <div>
        <h1 className="text-2xl font-bold text-text mb-4">Search</h1>
        <form onSubmit={handleSearch}>
          <Input
            placeholder="Search users, blogs, tournaments, clans..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search className="h-5 w-5" />}
            className="text-base"
          />
        </form>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
              activeTab === tab.value
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-surface-light text-text-secondary hover:text-text hover:bg-surface-light/80"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {query.length < 3 ? (
        <div className="py-16 text-center">
          <Search className="h-12 w-12 text-text-dim mx-auto mb-4" />
          <p className="text-text-secondary">
            Type at least 3 characters to search
          </p>
        </div>
      ) : isAnyLoading &&
        users.data.length === 0 &&
        blogs.data.length === 0 &&
        listings.data.length === 0 &&
        clans.data.length === 0 ? (
        <div className="py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-text-secondary">Searching...</p>
        </div>
      ) : isEmpty ? (
        <div className="py-16 text-center">
          <Search className="h-12 w-12 text-text-dim mx-auto mb-4" />
          <p className="text-text-secondary">
            No results found for &quot;{query}&quot;
          </p>
          <p className="text-sm text-text-dim mt-2">
            Try different keywords or check the spelling
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Users */}
          {showSection("users") && users.data.length > 0 && (
            <ResultSection
              title="Users"
              icon={<User className="h-5 w-5" />}
              total={users.total}
              isLoading={users.isLoading}
              showSeeMore={activeTab === "all" && users.total > 6}
              onSeeMore={() => setActiveTab("users")}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {users.data.map((user) => (
                  <Link key={user.id} href={`/profile/${user.username}`}>
                    <Card
                      variant="interactive"
                      className="p-4 flex items-center gap-3"
                    >
                      <Avatar
                        src={user.avatar_url}
                        alt={user.display_name || user.username}
                        size="md"
                        status={user.is_online ? "online" : "offline"}
                        showStatus
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text truncate">
                          {user.display_name || user.username}
                        </p>
                        <p className="text-sm text-text-muted truncate">
                          @{user.username}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {user.is_premium && (
                          <Badge variant="warning" size="sm">
                            PRO
                          </Badge>
                        )}
                        <Badge variant="default" size="sm">
                          Lv.{user.level}
                        </Badge>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </ResultSection>
          )}

          {/* Blogs */}
          {showSection("blogs") && blogs.data.length > 0 && (
            <ResultSection
              title="Blogs"
              icon={<FileText className="h-5 w-5" />}
              total={blogs.total}
              isLoading={blogs.isLoading}
              showSeeMore={activeTab === "all" && blogs.total > 6}
              onSeeMore={() => setActiveTab("blogs")}
            >
              <div className="grid gap-3">
                {blogs.data.map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`}>
                    <Card
                      variant="interactive"
                      className="p-4 flex items-center gap-4"
                    >
                      {post.featured_image_url ? (
                        <div
                          className="w-16 h-16 rounded-lg bg-cover bg-center flex-shrink-0"
                          style={{
                            backgroundImage: `url(${post.featured_image_url})`,
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-surface-light flex items-center justify-center flex-shrink-0">
                          <FileText className="h-6 w-6 text-text-muted" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text truncate">
                          {post.title}
                        </p>
                        {post.excerpt && (
                          <p className="text-sm text-text-muted line-clamp-1 mt-0.5">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-text-dim">
                            {post.author?.display_name ||
                              post.author?.username ||
                              "Unknown"}
                          </span>
                          {post.game && (
                            <>
                              <span className="text-xs text-text-dim">
                                &middot;
                              </span>
                              <span className="text-xs text-text-dim">
                                {post.game.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" size="sm">
                        {post.category}
                      </Badge>
                    </Card>
                  </Link>
                ))}
              </div>
            </ResultSection>
          )}

          {/* Tournaments & Giveaways */}
          {showSection("listings") && listings.data.length > 0 && (
            <ResultSection
              title="Tournaments & Giveaways"
              icon={<Trophy className="h-5 w-5" />}
              total={listings.total}
              isLoading={listings.isLoading}
              showSeeMore={activeTab === "all" && listings.total > 6}
              onSeeMore={() => setActiveTab("listings")}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {listings.data.map((listing) => {
                  const isTournament =
                    listing.listing_type === "tournament";
                  return (
                    <Link
                      key={listing.id}
                      href={`/community?tab=tournaments&listing=${listing.id}`}
                    >
                      <Card
                        variant="interactive"
                        className="p-4 flex items-center gap-3"
                      >
                        <div className="h-10 w-10 rounded-lg bg-surface-light flex items-center justify-center flex-shrink-0">
                          {isTournament ? (
                            <Trophy className="h-5 w-5 text-warning" />
                          ) : (
                            <Gift className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text truncate">
                            {listing.title}
                          </p>
                          <p className="text-sm text-text-muted truncate">
                            {listing.game?.name || "General"}
                            {listing.starts_at && (
                              <>
                                {" "}
                                &middot;{" "}
                                {new Date(
                                  listing.starts_at
                                ).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
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
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </ResultSection>
          )}

          {/* Clans */}
          {showSection("clans") && clans.data.length > 0 && (
            <ResultSection
              title="Clans"
              icon={<Shield className="h-5 w-5" />}
              total={clans.total}
              isLoading={clans.isLoading}
              showSeeMore={activeTab === "all" && clans.total > 6}
              onSeeMore={() => setActiveTab("clans")}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {clans.data.map((clan) => (
                  <Link key={clan.id} href={`/clans/${clan.slug}`}>
                    <Card
                      variant="interactive"
                      className="p-4 flex items-center gap-3"
                    >
                      <Avatar
                        src={clan.avatar_url}
                        alt={clan.name}
                        fallback={clan.tag}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text truncate">
                          {clan.name}{" "}
                          <span className="text-text-muted">[{clan.tag}]</span>
                        </p>
                        <p className="text-sm text-text-muted truncate">
                          {clan.member_count} members
                          {clan.primary_game && (
                            <> &middot; {clan.primary_game.name}</>
                          )}
                        </p>
                      </div>
                      {clan.is_recruiting && (
                        <Badge variant="success" size="sm">
                          Recruiting
                        </Badge>
                      )}
                    </Card>
                  </Link>
                ))}
              </div>
            </ResultSection>
          )}
        </div>
      )}
    </div>
  );
}

// --- Section wrapper for the results page ---

interface ResultSectionProps {
  title: string;
  icon: React.ReactNode;
  total: number;
  isLoading: boolean;
  showSeeMore: boolean;
  onSeeMore: () => void;
  children: React.ReactNode;
}

function ResultSection({
  title,
  icon,
  total,
  isLoading,
  showSeeMore,
  onSeeMore,
  children,
}: ResultSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-text-secondary">{icon}</span>
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          {!isLoading && (
            <span className="text-sm text-text-dim">({total})</span>
          )}
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
          )}
        </div>
        {showSeeMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSeeMore}
            className="text-primary"
          >
            See all
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}

// --- Page export with Suspense ---

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
