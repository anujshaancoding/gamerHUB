"use client";

import { useState } from "react";
import { Search, Users, UserPlus, UserCheck, X } from "lucide-react";
import { Modal, Input, Button } from "@/components/ui";
import { SocialListItem } from "./social-list-item";
import { usePublicSocialList } from "@/lib/hooks/usePublicSocialList";

interface SocialListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  listType: "friends" | "followers" | "following";
}

const listTypeConfig = {
  friends: {
    title: "Friends",
    icon: Users,
    emptyText: "No friends yet",
    emptyDescription: "This user hasn't added any friends yet.",
  },
  followers: {
    title: "Followers",
    icon: UserPlus,
    emptyText: "No followers yet",
    emptyDescription: "This user doesn't have any followers yet.",
  },
  following: {
    title: "Following",
    icon: UserCheck,
    emptyText: "Not following anyone",
    emptyDescription: "This user isn't following anyone yet.",
  },
};

export function SocialListModal({
  isOpen,
  onClose,
  userId,
  username,
  listType,
}: SocialListModalProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { users, total, loading, loadMore, hasMore, refetch } = usePublicSocialList({
    userId,
    listType,
    search: debouncedSearch,
    limit: 20,
    enabled: isOpen,
  });

  const config = listTypeConfig[listType];
  const Icon = config.icon;

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <span>{username}'s {config.title}</span>
          {total > 0 && (
            <span className="text-sm font-normal text-text-muted">({total})</span>
          )}
        </div>
      }
      size="md"
    >
      <div className="space-y-4">
        {/* Search */}
        <Input
          placeholder="Search by username..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          rightIcon={
            search && (
              <button onClick={() => { setSearch(""); setDebouncedSearch(""); }}>
                <X className="h-4 w-4 hover:text-primary" />
              </button>
            )
          }
        />

        {/* List */}
        <div className="max-h-[400px] overflow-y-auto -mx-4 px-4">
          {loading && users.length === 0 ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-surface-light" />
                  <div className="flex-1">
                    <div className="w-24 h-4 bg-surface-light rounded mb-2" />
                    <div className="w-16 h-3 bg-surface-light rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Icon className="h-12 w-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary mb-1">{config.emptyText}</p>
              <p className="text-sm text-text-muted">{config.emptyDescription}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {users.map((profile) => (
                <SocialListItem
                  key={profile.id}
                  profile={profile}
                  listType={listType}
                  onActionComplete={refetch}
                />
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && !loading && (
            <div className="text-center py-4">
              <Button variant="ghost" onClick={loadMore}>
                Load More
              </Button>
            </div>
          )}

          {loading && users.length > 0 && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mx-auto" />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
