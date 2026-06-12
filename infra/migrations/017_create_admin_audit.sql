-- 017_create_admin_audit.sql
-- Audit trail for sensitive / privileged admin actions (who did what, when).
-- Additive: creates one new table + indexes. No existing data touched.

CREATE TABLE IF NOT EXISTS admin_audit (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Nullable + SET NULL so the audit record survives if the actor is ever deleted;
  -- actor_email is kept denormalized for display in that case.
  actor_id     uuid REFERENCES profiles(id) ON DELETE SET NULL,
  actor_email  text,
  action       text NOT NULL,          -- e.g. 'user.delete_user', 'forum.post.delete', 'automation.stop'
  target_type  text,                   -- 'user' | 'forum_post' | 'forum_reply' | 'clan' | 'setting' | ...
  target_id    text,
  metadata     jsonb,                  -- before/after, reason, extra context
  ip           text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_created_idx ON admin_audit (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_actor_idx   ON admin_audit (actor_id);
CREATE INDEX IF NOT EXISTS admin_audit_action_idx  ON admin_audit (action);
