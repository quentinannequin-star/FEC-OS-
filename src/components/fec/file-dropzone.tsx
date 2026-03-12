"use client";

import { useCallback, useRef, useState } from "react";
import { FileSpreadsheet, Upload, CheckCircle2, AlertCircle, X } from "lucide-react";
import { formatFileSize } from "@/lib/fec/format";
import { parseFecFile } from "@/lib/fec/parser";
import type { ParseResult } from "@/lib/fec/types";

interface FileDropzoneProps {
  onFileLoaded: (
    file: File,
    result: ParseResult
  ) => void;
  fileName?: string | null;
  fileSize?: number | null;
  entryCount?: number;
  parseError?: string | null;
  onRemoveFile?: () => void;
}

export function FileDropzone({
  onFileLoaded,
  fileName,
  fileSize,
  entryCount = 0,
  parseError,
  onRemoveFile,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setIsParsing(true);
      try {
        const result = await parseFecFile(file);
        onFileLoaded(file, result);
      } catch (e) {
        onFileLoaded(file, {
          entries: [],
          errors: [e instanceof Error ? e.message : "Erreur inconnue"],
          warnings: [],
        });
      } finally {
        setIsParsing(false);
      }
    },
    [onFileLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input value so same file can be re-selected
      e.target.value = "";
    },
    [handleFile]
  );

  // File loaded state
  if (fileName && !parseError) {
    return (
      <div className="relative border border-zinc-200 rounded-lg p-3 bg-zinc-50/50">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 truncate">
              {fileName}
            </p>
            <p className="text-xs text-zinc-500">
              {fileSize ? formatFileSize(fileSize) : ""} — {entryCount.toLocaleString("fr-FR")} écritures
            </p>
          </div>
          {onRemoveFile && (
            <button
              onClick={onRemoveFile}
              className="p-1 rounded hover:bg-zinc-200 transition-colors"
            >
              <X className="h-4 w-4 text-zinc-400" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (parseError) {
    return (
      <div className="relative border border-red-200 rounded-lg p-3 bg-red-50/50">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-900">Erreur de parsing</p>
            <p className="text-xs text-red-600 truncate">{parseError}</p>
          </div>
          {onRemoveFile && (
            <button
              onClick={onRemoveFile}
              className="p-1 rounded hover:bg-red-100 transition-colors"
            >
              <X className="h-4 w-4 text-red-400" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default drop zone
  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      className={`
        relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
        transition-all duration-200
        ${
          isDragging
            ? "border-zinc-400 bg-zinc-50"
            : "border-zinc-200 hover:border-zinc-300 bg-white"
        }
        ${isParsing ? "pointer-events-none opacity-60" : ""}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.csv"
        className="hidden"
        onChange={handleInputChange}
      />
      {isParsing ? (
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Lecture du fichier...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          {isDragging ? (
            <Upload className="h-8 w-8 text-zinc-400" />
          ) : (
            <FileSpreadsheet className="h-8 w-8 text-zinc-300" />
          )}
          <div>
            <p className="text-sm font-medium text-zinc-600">
              {isDragging ? "Déposez le fichier" : "Glissez le FEC ici"}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              .txt ou .csv — norme DGFiP
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
