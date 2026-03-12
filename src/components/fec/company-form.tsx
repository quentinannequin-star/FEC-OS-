"use client";

import { useCallback } from "react";
import { Plus, Play, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyCard } from "./company-card";
import type { Company } from "@/lib/fec/types";

interface CompanyFormProps {
  companies: Company[];
  onCompaniesChange: (companies: Company[]) => void;
  onLaunchAnalysis: () => void;
  isProcessing: boolean;
}

export function CompanyForm({
  companies,
  onCompaniesChange,
  onLaunchAnalysis,
  isProcessing,
}: CompanyFormProps) {
  const handleAddCompany = useCallback(() => {
    const newCompany: Company = {
      id: crypto.randomUUID(),
      name: "",
      type: "operationnelle",
      sector: "esn",
      file: null,
      fileName: null,
      fileSize: null,
      parsedEntries: null,
      parseError: null,
      entryCount: 0,
    };
    onCompaniesChange([...companies, newCompany]);
  }, [companies, onCompaniesChange]);

  const handleUpdateCompany = useCallback(
    (id: string, updates: Partial<Company>) => {
      onCompaniesChange(
        companies.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
    },
    [companies, onCompaniesChange]
  );

  const handleRemoveCompany = useCallback(
    (id: string) => {
      onCompaniesChange(companies.filter((c) => c.id !== id));
    },
    [companies, onCompaniesChange]
  );

  // At least one company with a parsed file
  const canLaunch =
    companies.length > 0 &&
    companies.some((c) => c.parsedEntries && c.parsedEntries.length > 0) &&
    companies.every((c) => c.name.trim() !== "" || !c.parsedEntries);

  // Count ready companies
  const readyCount = companies.filter(
    (c) => c.parsedEntries && c.parsedEntries.length > 0 && c.name.trim() !== ""
  ).length;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
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
          Ajoutez les sociétés du périmètre, indiquez leur nature (holding ou
          opérationnelle), puis glissez le FEC de chaque entité pour lancer
          l&apos;analyse.
        </p>
      </div>

      {/* Company list */}
      {companies.length > 0 && (
        <div className="space-y-3">
          {companies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onUpdate={handleUpdateCompany}
              onRemove={handleRemoveCompany}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {companies.length === 0 && (
        <div className="border-2 border-dashed border-zinc-200 rounded-xl p-12 text-center">
          <FileSpreadsheet className="h-10 w-10 text-zinc-300 mx-auto mb-4" />
          <p className="text-sm font-medium text-zinc-600">
            Aucune société dans le périmètre
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Cliquez sur &ldquo;Ajouter une entité&rdquo; pour commencer
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="outline"
          onClick={handleAddCompany}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Ajouter une entité
        </Button>

        <div className="flex-1" />

        {readyCount > 0 && (
          <span className="text-sm text-zinc-500">
            {readyCount} entité{readyCount > 1 ? "s" : ""} prête{readyCount > 1 ? "s" : ""}
          </span>
        )}

        <Button
          onClick={onLaunchAnalysis}
          disabled={!canLaunch || isProcessing}
          className="gap-2"
        >
          {isProcessing ? (
            <>
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyse en cours...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Lancer l&apos;analyse
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
