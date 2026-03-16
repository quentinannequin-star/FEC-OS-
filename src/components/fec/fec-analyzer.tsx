"use client";

import { useState, useCallback } from "react";
import type { Company, MultiYearAnalysisResult, AnalysisStep } from "@/lib/fec/types";
import { CompanyForm } from "./company-form";
import { ResultsView } from "./results-view";
import { analyzeCompanyMultiYear } from "@/lib/fec/engine";

export function FecAnalyzer() {
  const [step, setStep] = useState<AnalysisStep>("scope");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [results, setResults] = useState<MultiYearAnalysisResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLaunchAnalysis = useCallback(async () => {
    setIsProcessing(true);

    // Small delay to let UI update before heavy computation
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      const validCompanies = companies.filter(
        (c) =>
          c.fecFiles.some((f) => f.parsedEntries && f.parsedEntries.length > 0) &&
          c.name.trim() !== ""
      );

      const analysisResults: MultiYearAnalysisResult[] = [];

      for (const company of validCompanies) {
        // Yield to UI between companies
        await new Promise((resolve) => setTimeout(resolve, 10));
        const result = analyzeCompanyMultiYear(company);
        analysisResults.push(result);
      }

      setResults(analysisResults);
      setStep("results");
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [companies]);

  const handleBack = useCallback(() => {
    setStep("scope");
    setResults([]);
  }, []);

  if (step === "results" && results.length > 0) {
    return <ResultsView results={results} onBack={handleBack} />;
  }

  return (
    <CompanyForm
      companies={companies}
      onCompaniesChange={setCompanies}
      onLaunchAnalysis={handleLaunchAnalysis}
      isProcessing={isProcessing}
    />
  );
}
