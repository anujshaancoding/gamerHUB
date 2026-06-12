"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Modal, Button, Textarea, Avatar } from "@/components/ui";
import type { Clan } from "@/types/database";

interface ClanJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  clan: Clan;
  onSubmit: (message?: string) => Promise<{ error?: Error }>;
}

export function ClanJoinModal({
  isOpen,
  onClose,
  clan,
  onSubmit,
}: ClanJoinModalProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const result = await onSubmit(message || undefined);

    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  };

  const handleClose = () => {
    setMessage("");
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (success) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Request Sent" size="sm">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="h-8 w-8 text-success" />
          </div>
          <h3 className="text-lg font-semibold text-text mb-2">
            Request Submitted!
          </h3>
          <p className="text-text-muted">
            Your request to join <strong>[{clan.tag}] {clan.name}</strong> has
            been sent. You&apos;ll be notified when it&apos;s reviewed.
          </p>
          <Button variant="primary" onClick={handleClose} className="mt-4">
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Request to Join" size="md">
      <div className="space-y-4">
        {/* Clan Info */}
        <div className="flex items-center gap-3 p-3 bg-surface-light rounded-lg">
          <Avatar
            src={clan.avatar_url}
            alt={clan.name}
            size="md"
            fallback={clan.tag}
          />
          <div>
            <h4 className="font-semibold text-text">
              [{clan.tag}] {clan.name}
            </h4>
            {clan.description && (
              <p className="text-sm text-text-muted line-clamp-1">
                {clan.description}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        {/* Message */}
        <Textarea
          label="Message (optional)"
          placeholder="Tell the clan leaders why you want to join..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
        />

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={loading}
            leftIcon={<UserPlus className="h-4 w-4" />}
          >
            Send Request
          </Button>
        </div>
      </div>
    </Modal>
  );
}
