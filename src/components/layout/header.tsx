"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, LogOut, Shield } from "lucide-react";

interface HeaderProps {
  userFullName: string;
  userEmail: string;
  ndaSignedAt: string | null;
}

export function Header({
  userFullName,
  userEmail,
  ndaSignedAt,
}: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = userFullName
    ? userFullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : userEmail[0]?.toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-white/[0.08] bg-[#12121a] px-4 md:px-6">
      {/* Branding */}
      <Link href="/os/fec-analyzer" className="flex items-center gap-2">
        <span className="text-base font-bold text-white tracking-tight">
          M&A OS
        </span>
        <span className="hidden sm:inline text-xs text-[#52526b]">
          Deal Execution Platform
        </span>
      </Link>

      <div className="flex-1" />

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center justify-center h-8 w-8 rounded-full focus:outline-none"
          aria-label="Menu utilisateur"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-[#1a1a2e] text-[#e040fb] text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{userFullName || "Utilisateur"}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/profile")}>
            <User className="mr-2 h-4 w-4" />
            Profil
          </DropdownMenuItem>
          {ndaSignedAt && (
            <DropdownMenuItem disabled>
              <Shield className="mr-2 h-4 w-4" />
              NDA signé le {new Date(ndaSignedAt).toLocaleDateString("fr-FR")}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
