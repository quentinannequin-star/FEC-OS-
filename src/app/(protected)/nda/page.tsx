import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { NDA_CONTENT, NDA_VERSION } from "@/lib/nda-content";
import { NdaForm } from "./nda-form";

export const metadata: Metadata = {
  title: "Signature NDA — M&A OS",
};

export default async function NdaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            M&A OS
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Accord de Confidentialité
          </p>
        </div>
        <NdaForm
          userId={user.id}
          fullName={profile?.full_name ?? ""}
          ndaContent={NDA_CONTENT}
          ndaVersion={NDA_VERSION}
        />
      </div>
    </div>
  );
}
