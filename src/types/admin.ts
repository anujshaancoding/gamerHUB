export type AdminRole = "super_admin" | "editor" | "moderator";

export interface AdminProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  admin_role: AdminRole | null;
}
