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
      fecFiles: [],
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

  // At least one company with at least one parsed FEC file
  const hasFiles = (c: Company) => c.fecFiles.some((f) => f.parsedEntries && f.parsedEntries.length > 0);
  const canLaunch =
    companies.length > 0 &&
    companies.some(hasFiles) &&
    companies.every((c) => c.name.trim() !== "" || !hasFiles(c));

  // Count ready companies
  const readyCount = companies.filter(
    (c) => hasFiles(c) && c.name.trim() !== ""
  ).length;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e040fb]/10">
            <FileSpreadsheet className="h-5 w-5 text-[#e040fb]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">
              FEC Analyzer
            </h1>
            <p className="text-sm text-[#8b8b9e]">Analyseur Comptable M&A</p>
          </div>
        </div>
        <p className="text-[#8b8b9e] mt-4 leading-relaxed">
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
        <div className="border-2 border-dashed border-white/[0.1] rounded-xl p-12 text-center">
          <FileSpreadsheet className="h-10 w-10 text-[#52526b] mx-auto mb-4" />
          <p className="text-sm font-medium text-[#8b8b9e]">
            Aucune société dans le périmètre
          </p>
          <p className="text-xs text-[#52526b] mt-1">
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
          <span className="text-sm text-[#8b8b9e]">
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
