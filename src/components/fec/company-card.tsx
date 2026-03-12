"use client";

import { useCallback } from "react";
import { Building2, Crown, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileDropzone } from "./file-dropzone";
import type { Company, CompanyType, CompanySector, ParseResult } from "@/lib/fec/types";
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

  const handleFileLoaded = useCallback(
    (file: File, result: ParseResult) => {
      if (result.errors.length > 0) {
        onUpdate(company.id, {
          file,
          fileName: file.name,
          fileSize: file.size,
          parsedEntries: null,
          parseError: result.errors[0],
          entryCount: 0,
        });
      } else {
        onUpdate(company.id, {
          file,
          fileName: file.name,
          fileSize: file.size,
          parsedEntries: result.entries,
          parseError: null,
          entryCount: result.entries.length,
        });
      }
    },
    [company.id, onUpdate]
  );

  const handleRemoveFile = useCallback(() => {
    onUpdate(company.id, {
      file: null,
      fileName: null,
      fileSize: null,
      parsedEntries: null,
      parseError: null,
      entryCount: 0,
    });
  }, [company.id, onUpdate]);

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
            className="text-zinc-400 hover:text-red-500 shrink-0"
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
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300"
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
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300"
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
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300"
                }
              `}
            >
              {SECTOR_LABELS[sector]}
            </button>
          ))}
        </div>

        {/* FEC Dropzone */}
        <FileDropzone
          onFileLoaded={handleFileLoaded}
          fileName={company.fileName}
          fileSize={company.fileSize}
          entryCount={company.entryCount}
          parseError={company.parseError}
          onRemoveFile={handleRemoveFile}
        />
      </CardContent>
    </Card>
  );
}
