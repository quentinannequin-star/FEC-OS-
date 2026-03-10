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
    <aside className="hidden md:flex w-[260px] flex-col bg-zinc-950 text-zinc-400 h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-lg font-semibold text-white tracking-tight">
          M&A OS
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">Deal Execution Platform</p>
      </div>

      <Separator className="bg-zinc-800" />

      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        <div>
          <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-zinc-600 mb-2">
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
          <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-zinc-600 mb-2">
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
          <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-zinc-600 mb-2">
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

      <Separator className="bg-zinc-800" />

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="min-w-0">
            <p className="text-sm text-zinc-300 truncate">{userFullName}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-zinc-500 hover:text-white hover:bg-zinc-800 h-8 w-8 p-0"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-zinc-700">v0.1.0 — Alvora Partners</p>
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
      <span className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-zinc-600 cursor-not-allowed">
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
          ? "bg-zinc-800 text-zinc-100"
          : "hover:bg-zinc-900 hover:text-zinc-100"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
