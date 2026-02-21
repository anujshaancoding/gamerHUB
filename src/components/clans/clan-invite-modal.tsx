"use client";

import { useState, useEffect } from "react";
import { Search, UserPlus, X } from "lucide-react";
import { Modal, Button, Input, Avatar, Badge } from "@/components/ui";
import { usePresence } from "@/lib/presence/PresenceProvider";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

interface ClanInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  clanId: string;
  onInvite: (userId: string, message?: string) => Promise<{ error?: Error }>;
}

export function ClanInviteModal({
  isOpen,
  onClose,
  clanId,
  onInvite,
}: ClanInviteModalProps) {
  const supabase = createClient();
  const { getUserStatus } = usePresence();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [invited, setInvited] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchUsers = async () => {
      if (!search || search.length < 2) {
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
        // Search for users not in any clan
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .or(`username.ilike.%${search}%,display_name.ilike.%${search}%`)
          .limit(10);

        if (profiles) {
          // Filter out users already in a clan
          const profileList = profiles as Profile[];
          const { data: clanMembers } = await supabase
            .from("clan_members")
            .select("user_id")
            .in(
              "user_id",
              profileList.map((p) => p.id)
            );

          const memberList = clanMembers as { user_id: string }[] | null;
          const memberIds = new Set(memberList?.map((m) => m.user_id) || []);
          setUsers(profileList.filter((p) => !memberIds.has(p.id)));
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [search, supabase]);

  const handleInvite = async (userId: string) => {
    setInviting(userId);
    setError(null);

    const result = await onInvite(userId);

    if (result.error) {
      setError(result.error.message);
    } else {
      setInvited((prev) => new Set([...prev, userId]));
    }

    setInviting(null);
  };

  const handleClose = () => {
    setSearch("");
    setUsers([]);
    setInvited(new Set());
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Players" size="md">
      <div className="space-y-4">
        {/* Search */}
        <Input
          placeholder="Search by username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />

        {error && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {loading && (
            <div className="text-center py-8 text-text-muted">Searching...</div>
          )}

          {!loading && search.length >= 2 && users.length === 0 && (
            <div className="text-center py-8 text-text-muted">
              No users found or all matching users are already in clans
            </div>
          )}

          {!loading && search.length < 2 && (
            <div className="text-center py-8 text-text-muted">
              Type at least 2 characters to search
            </div>
          )}

          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 bg-surface-light rounded-lg"
            >
              <Avatar
                src={user.avatar_url}
                alt={user.display_name || user.username}
                size="sm"
                status={getUserStatus(user.id)}
                showStatus
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text truncate">
                  {user.display_name || user.username}
                </p>
                <p className="text-xs text-text-muted">@{user.username}</p>
              </div>
              {invited.has(user.id) ? (
                <Badge variant="success">Invited</Badge>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleInvite(user.id)}
                  isLoading={inviting === user.id}
                  leftIcon={<UserPlus className="h-3 w-3" />}
                >
                  Invite
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <p className="text-sm text-text-muted">
            {invited.size > 0 && `${invited.size} invitation(s) sent`}
          </p>
          <Button variant="ghost" onClick={handleClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
