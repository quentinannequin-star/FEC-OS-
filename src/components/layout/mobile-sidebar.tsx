"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { OsModule } from "@/types/database";
import {
  LayoutDashboard,
  User,
  FileSpreadsheet,
  FolderLock,
  Table2,
  Package,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileSpreadsheet,
  FolderLock,
  Table2,
};

interface MobileSidebarProps {
  modules: OsModule[];
  userFullName: string;
}

export function MobileSidebar({ modules, userFullName }: MobileSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full text-zinc-400">
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
          <MobileNavLink
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
              <MobileNavLink
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
          <MobileNavLink
            href="/profile"
            icon={User}
            label="Profil"
            active={pathname === "/profile"}
          />
        </div>
      </nav>

      <Separator className="bg-zinc-800" />

      <div className="p-4">
        <p className="text-sm text-zinc-300 truncate">{userFullName}</p>
        <p className="text-[10px] text-zinc-700 mt-1">
          v0.1.0 — Alvora Partners
        </p>
      </div>
    </div>
  );
}

function MobileNavLink({
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
