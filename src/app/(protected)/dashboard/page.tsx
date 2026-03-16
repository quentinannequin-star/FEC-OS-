import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ModuleCard } from "@/components/dashboard/module-card";
import type { OsModule } from "@/types/database";

export const metadata: Metadata = {
  title: "Dashboard — M&A OS",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const { data: modules } = await supabase
    .from("os_modules")
    .select("*")
    .order("sort_order");

  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Bienvenue, {firstName}
        </h1>
        <p className="text-sm text-[#8b8b9e] mt-1 capitalize">{today}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {((modules || []) as OsModule[]).map((mod) => (
          <ModuleCard key={mod.id} module={mod} />
        ))}
      </div>
    </div>
  );
}
