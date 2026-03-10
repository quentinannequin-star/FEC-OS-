import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import type { OsModule } from "@/types/database";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: modules } = await supabase
    .from("os_modules")
    .select("*")
    .order("sort_order");

  const { data: ndaSignature } = await supabase
    .from("nda_signatures")
    .select("signed_at")
    .eq("user_id", user.id)
    .order("signed_at", { ascending: false })
    .limit(1)
    .single();

  const userFullName = profile?.full_name || user.email || "Utilisateur";
  const typedModules = (modules || []) as OsModule[];

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar modules={typedModules} userFullName={userFullName} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          userFullName={userFullName}
          userEmail={user.email || ""}
          ndaSignedAt={ndaSignature?.signed_at || null}
          modules={typedModules}
        />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
