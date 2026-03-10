export type UserRole =
  | "analyst"
  | "associate"
  | "vp"
  | "director"
  | "partner"
  | "admin";

export type ModuleStatus =
  | "active"
  | "coming_soon"
  | "maintenance"
  | "deprecated";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface NdaSignature {
  id: string;
  user_id: string;
  signed_at: string;
  ip_address: string | null;
  user_agent: string | null;
  document_version: string;
  full_name_typed: string;
}

export interface OsModule {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  status: ModuleStatus;
  requires_role: string[];
  sort_order: number;
  created_at: string;
}
