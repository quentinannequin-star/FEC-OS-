"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { OsModule } from "@/types/database";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileSidebar } from "./mobile-sidebar";
import { Menu, User, LogOut, Shield } from "lucide-react";

interface HeaderProps {
  userFullName: string;
  userEmail: string;
  ndaSignedAt: string | null;
  modules: OsModule[];
}

export function Header({
  userFullName,
  userEmail,
  ndaSignedAt,
  modules,
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
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-zinc-200 bg-white px-4 md:px-6">
      {/* Mobile menu trigger */}
      <Sheet>
        <SheetTrigger
          className="md:hidden flex items-center justify-center h-8 w-8 rounded-md hover:bg-zinc-100 transition-colors"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5 text-zinc-600" />
        </SheetTrigger>
        <SheetContent side="left" className="w-[260px] p-0 bg-zinc-950">
          <MobileSidebar modules={modules} userFullName={userFullName} />
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center justify-center h-8 w-8 rounded-full focus:outline-none"
          aria-label="Menu utilisateur"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-zinc-900 text-white text-xs">
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
