import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";

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

  const { data: ndaSignature } = await supabase
    .from("nda_signatures")
    .select("signed_at")
    .eq("user_id", user.id)
    .order("signed_at", { ascending: false })
    .limit(1)
    .single();

  const userFullName = profile?.full_name || user.email || "Utilisateur";

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Header
        userFullName={userFullName}
        userEmail={user.email || ""}
        ndaSignedAt={ndaSignature?.signed_at || null}
      />
      <main className="p-4 md:p-6">{children}</main>
    </div>
  );
}
