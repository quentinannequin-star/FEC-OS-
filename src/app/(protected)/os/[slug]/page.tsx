import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FileSpreadsheet, FolderLock, Table2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
    return <FecAnalyzerPage />;
  }

  notFound();
}

function FecAnalyzerPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
            <FileSpreadsheet className="h-5 w-5 text-zinc-700" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">
              FEC Analyzer
            </h1>
            <p className="text-sm text-zinc-500">Analyseur Comptable M&A</p>
          </div>
        </div>
        <p className="text-zinc-600 mt-4 leading-relaxed">
          Importez vos FEC et obtenez automatiquement : P&L analytique, BFR
          mensuel, dette nette, bridge QoE, analyse CAPEX et proxy FCF.
        </p>
      </div>

      {/* Drop zone */}
      <div className="border-2 border-dashed border-zinc-200 rounded-xl p-12 text-center bg-white hover:border-zinc-300 transition-colors">
        <FileSpreadsheet className="h-10 w-10 text-zinc-300 mx-auto mb-4" />
        <p className="text-sm font-medium text-zinc-600">
          Glissez vos fichiers FEC ici
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          Formats acceptés : .txt, .csv (norme DGFiP)
        </p>
        <button
          disabled
          className="mt-4 px-4 py-2 text-sm rounded-lg bg-zinc-100 text-zinc-400 cursor-not-allowed"
        >
          Lancer l&apos;analyse
        </button>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-800 font-medium">
          Module en cours d&apos;intégration — Phase 2
        </p>
        <p className="text-xs text-amber-700 mt-1">
          L&apos;ingestion et l&apos;analyse des FEC seront disponibles dans la
          prochaine version.
        </p>
      </div>
    </div>
  );
}
