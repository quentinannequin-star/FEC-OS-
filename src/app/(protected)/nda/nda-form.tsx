"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle, Loader2 } from "lucide-react";

interface NdaFormProps {
  userId: string;
  fullName: string;
  ndaContent: string;
  ndaVersion: string;
}

export function NdaForm({
  userId,
  fullName,
  ndaContent,
  ndaVersion,
}: NdaFormProps) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hasProfileName = fullName.trim().length > 0;
  const nameMatches = hasProfileName
    ? typedName.trim().toLowerCase() === fullName.trim().toLowerCase()
    : typedName.trim().length > 0;
  const canSign = accepted && nameMatches && typedName.trim().length > 0;

  async function handleSign() {
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { error: insertError } = await supabase
      .from("nda_signatures")
      .insert({
        user_id: userId,
        document_version: ndaVersion,
        full_name_typed: typedName.trim(),
      });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push("/os/fec-analyzer");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#8b8b9e]">
          <Shield className="h-4 w-4" />
          <span className="text-sm font-medium">Document confidentiel</span>
        </div>
        <Badge variant="secondary">Version {ndaVersion}</Badge>
      </div>

      <div className="h-[400px] overflow-y-auto rounded-lg border border-white/[0.08] bg-[#12121a] p-6">
        <pre className="whitespace-pre-wrap font-sans text-sm text-[#c0c0d0] leading-relaxed">
          {ndaContent}
        </pre>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-[#12121a] accent-[#e040fb]"
          />
          <span className="text-sm text-[#c0c0d0]">
            J&apos;ai lu et j&apos;accepte les termes de l&apos;accord de
            confidentialité ci-dessus.
          </span>
        </label>

        <div className="space-y-2">
          <Label htmlFor="typedName">
            Tapez votre nom complet pour signer{" "}
            {fullName && (
              <span className="text-[#52526b] font-normal">({fullName})</span>
            )}
          </Label>
          <Input
            id="typedName"
            placeholder={fullName || "Votre nom complet"}
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
          />
          {typedName.length > 0 && !nameMatches && hasProfileName && (
            <p className="text-xs text-destructive">
              Le nom saisi ne correspond pas à votre nom de profil.
            </p>
          )}
        </div>

        <Button
          onClick={handleSign}
          disabled={!canSign || loading}
          className="w-full"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Je certifie avoir lu, compris et j&apos;accepte — Signer le NDA
        </Button>
      </div>

      <p className="text-center text-xs text-[#52526b]">
        &copy; 2026 Alvora Partners — Confidential
      </p>
    </div>
  );
}
