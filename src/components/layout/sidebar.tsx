"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { OsModule } from "@/types/database";
import {
  LayoutDashboard,
  User,
  LogOut,
  FileSpreadsheet,
  FolderLock,
  Table2,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileSpreadsheet,
  FolderLock,
  Table2,
};

interface SidebarProps {
  modules: OsModule[];
  userFullName: string;
}

export function Sidebar({ modules, userFullName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex w-[260px] flex-col bg-[#0d0d14] text-[#8b8b9e] h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-lg font-semibold text-white tracking-tight">
          M&A OS
        </h1>
        <p className="text-xs text-[#52526b] mt-0.5">Deal Execution Platform</p>
      </div>

      <Separator className="bg-white/[0.06]" />

      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        <div>
          <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-[#52526b] mb-2">
            Plateforme
          </p>
          <NavLink
            href="/dashboard"
            icon={LayoutDashboard}
            label="Dashboard"
            active={pathname === "/dashboard"}
          />
        </div>

        <div>
          <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-[#52526b] mb-2">
            Outils
          </p>
          {modules.map((mod) => {
            const Icon = iconMap[mod.icon] || Package;
            return (
              <NavLink
                key={mod.id}
                href={`/os/${mod.slug}`}
                icon={Icon}
                label={mod.name}
                active={pathname === `/os/${mod.slug}`}
                disabled={mod.status !== "active"}
              />
            );
          })}
        </div>

        <div>
          <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-[#52526b] mb-2">
            Compte
          </p>
          <NavLink
            href="/profile"
            icon={User}
            label="Profil"
            active={pathname === "/profile"}
          />
        </div>
      </nav>

      <Separator className="bg-white/[0.06]" />

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="min-w-0">
            <p className="text-sm text-[#c0c0d0] truncate">{userFullName}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-[#52526b] hover:text-white hover:bg-white/[0.08] h-8 w-8 p-0"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-[#52526b]">v0.1.0 — Alvora Partners</p>
      </div>
    </aside>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
  active,
  disabled,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[#52526b] cursor-not-allowed">
        <Icon className="h-4 w-4" />
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
        active
          ? "bg-white/[0.08] text-white"
          : "hover:bg-white/[0.06] hover:text-white"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
