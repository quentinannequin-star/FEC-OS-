"use client";

import { useCallback } from "react";
import { Building2, Crown, Trash2, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileDropzone } from "./file-dropzone";
import type { Company, CompanyType, CompanySector, FecYearFile, ParseResult } from "@/lib/fec/types";
import { SECTOR_LABELS } from "@/lib/fec/types";

interface CompanyCardProps {
  company: Company;
  onUpdate: (id: string, updates: Partial<Company>) => void;
  onRemove: (id: string) => void;
}

export function CompanyCard({ company, onUpdate, onRemove }: CompanyCardProps) {
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate(company.id, { name: e.target.value });
    },
    [company.id, onUpdate]
  );

  const handleTypeChange = useCallback(
    (type: CompanyType) => {
      onUpdate(company.id, { type });
    },
    [company.id, onUpdate]
  );

  const handleSectorChange = useCallback(
    (sector: CompanySector) => {
      onUpdate(company.id, { sector });
    },
    [company.id, onUpdate]
  );

  const handleAddYear = useCallback(() => {
    const existingYears = company.fecFiles.map((f) => f.fiscalYear);
    const currentYear = new Date().getFullYear();
    // Default to current year minus number of existing files
    let defaultYear = currentYear - company.fecFiles.length;
    // Avoid duplicates
    while (existingYears.includes(defaultYear)) {
      defaultYear--;
    }

    const newFile: FecYearFile = {
      id: crypto.randomUUID(),
      fiscalYear: defaultYear,
      file: null,
      fileName: null,
      fileSize: null,
      parsedEntries: null,
      parseError: null,
      entryCount: 0,
    };
    onUpdate(company.id, {
      fecFiles: [...company.fecFiles, newFile],
    });
  }, [company.id, company.fecFiles, onUpdate]);

  const handleYearChange = useCallback(
    (yearFileId: string, fiscalYear: number) => {
      const updated = company.fecFiles.map((f) =>
        f.id === yearFileId ? { ...f, fiscalYear } : f
      );
      onUpdate(company.id, { fecFiles: updated });
    },
    [company.id, company.fecFiles, onUpdate]
  );

  const handleFileLoaded = useCallback(
    (yearFileId: string, file: File, result: ParseResult) => {
      const updated = company.fecFiles.map((f) => {
        if (f.id !== yearFileId) return f;
        if (result.errors.length > 0) {
          return {
            ...f,
            file,
            fileName: file.name,
            fileSize: file.size,
            parsedEntries: null,
            parseError: result.errors[0],
            entryCount: 0,
          };
        }
        // Auto-detect fiscal year from entry dates
        let detectedYear = f.fiscalYear;
        if (result.entries.length > 0) {
          const dates = result.entries
            .map((e) => e.EcritureDate.getTime())
            .filter((t) => t > 0);
          if (dates.length > 0) {
            const maxDate = new Date(Math.max(...dates));
            detectedYear = maxDate.getFullYear();
          }
        }
        return {
          ...f,
          file,
          fileName: file.name,
          fileSize: file.size,
          parsedEntries: result.entries,
          parseError: null,
          entryCount: result.entries.length,
          fiscalYear: detectedYear,
        };
      });
      onUpdate(company.id, { fecFiles: updated });
    },
    [company.id, company.fecFiles, onUpdate]
  );

  const handleRemoveYear = useCallback(
    (yearFileId: string) => {
      const updated = company.fecFiles.filter((f) => f.id !== yearFileId);
      onUpdate(company.id, { fecFiles: updated });
    },
    [company.id, company.fecFiles, onUpdate]
  );

  const handleRemoveFile = useCallback(
    (yearFileId: string) => {
      const updated = company.fecFiles.map((f) =>
        f.id === yearFileId
          ? { ...f, file: null, fileName: null, fileSize: null, parsedEntries: null, parseError: null, entryCount: 0 }
          : f
      );
      onUpdate(company.id, { fecFiles: updated });
    },
    [company.id, company.fecFiles, onUpdate]
  );

  // Sort files by year descending for display
  const sortedFiles = [...company.fecFiles].sort((a, b) => b.fiscalYear - a.fiscalYear);

  return (
    <Card className="relative">
      <CardContent className="p-4 space-y-3">
        {/* Header: Name + Delete */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              value={company.name}
              onChange={handleNameChange}
              placeholder="Nom de la société"
              className="font-medium"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(company.id)}
            className="text-[#52526b] hover:text-red-400 shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Type toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => handleTypeChange("operationnelle")}
            className={`
              flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
              transition-all duration-150 border
              ${
                company.type === "operationnelle"
                  ? "bg-[#e040fb] text-white border-[#e040fb]"
                  : "bg-white/[0.06] text-[#8b8b9e] border-white/[0.08] hover:border-white/[0.15]"
              }
            `}
          >
            <Building2 className="h-3.5 w-3.5" />
            Opérationnelle
          </button>
          <button
            onClick={() => handleTypeChange("holding")}
            className={`
              flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
              transition-all duration-150 border
              ${
                company.type === "holding"
                  ? "bg-[#e040fb] text-white border-[#e040fb]"
                  : "bg-white/[0.06] text-[#8b8b9e] border-white/[0.08] hover:border-white/[0.15]"
              }
            `}
          >
            <Crown className="h-3.5 w-3.5" />
            Holding
          </button>
        </div>

        {/* Sector selector */}
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(SECTOR_LABELS) as CompanySector[]).map((sector) => (
            <button
              key={sector}
              onClick={() => handleSectorChange(sector)}
              className={`
                px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 border
                ${
                  company.sector === sector
                    ? "bg-[#a78bfa] text-white border-[#a78bfa]"
                    : "bg-white/[0.06] text-[#8b8b9e] border-white/[0.08] hover:border-white/[0.15]"
                }
              `}
            >
              {SECTOR_LABELS[sector]}
            </button>
          ))}
        </div>

        {/* FEC files per fiscal year */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#8b8b9e] uppercase tracking-wide">
              Exercices fiscaux
            </p>
            <button
              onClick={handleAddYear}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#8b8b9e] hover:text-white transition-colors"
            >
              <Plus className="h-3 w-3" />
              Ajouter un exercice
            </button>
          </div>

          {sortedFiles.length === 0 && (
            <div className="border-2 border-dashed border-white/[0.1] rounded-lg p-4 text-center">
              <p className="text-xs text-[#52526b]">
                Cliquez sur &quot;Ajouter un exercice&quot; puis glissez votre FEC
              </p>
            </div>
          )}

          {sortedFiles.map((yearFile) => (
            <div key={yearFile.id} className="border border-white/[0.08] rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-xs text-[#8b8b9e] font-medium shrink-0">FY</label>
                <input
                  type="number"
                  value={yearFile.fiscalYear}
                  onChange={(e) => handleYearChange(yearFile.id, parseInt(e.target.value, 10) || new Date().getFullYear())}
                  className="w-20 px-2 py-1 text-sm font-mono border border-white/[0.1] rounded-md bg-white/[0.04] text-white focus:outline-none focus:ring-1 focus:ring-[#e040fb]"
                  min={2000}
                  max={2099}
                />
                <div className="flex-1" />
                <button
                  onClick={() => handleRemoveYear(yearFile.id)}
                  className="p-1 rounded hover:bg-white/[0.06] transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-[#52526b]" />
                </button>
              </div>
              <FileDropzone
                onFileLoaded={(file, result) => handleFileLoaded(yearFile.id, file, result)}
                fileName={yearFile.fileName}
                fileSize={yearFile.fileSize}
                entryCount={yearFile.entryCount}
                parseError={yearFile.parseError}
                onRemoveFile={() => handleRemoveFile(yearFile.id)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
