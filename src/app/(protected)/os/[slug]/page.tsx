import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FecAnalyzer } from "@/components/fec/fec-analyzer";
import type { OsModule } from "@/types/database";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${slug} — M&A OS` };
}

export default async function OsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: module } = await supabase
    .from("os_modules")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!module) notFound();

  const mod = module as OsModule;

  if (mod.status === "coming_soon" || mod.status === "maintenance") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100">
          <Clock className="h-8 w-8 text-zinc-400" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">{mod.name}</h1>
          <p className="text-zinc-500 mt-2 max-w-md">{mod.description}</p>
        </div>
        <Badge variant="secondary">Bientôt disponible</Badge>
      </div>
    );
  }

  if (slug === "fec-analyzer") {
    return <FecAnalyzer />;
  }

  notFound();
}
