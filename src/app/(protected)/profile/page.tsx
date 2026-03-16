"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import type { Profile, NdaSignature } from "@/types/database";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nda, setNda] = useState<NdaSignature | null>(null);
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profileData }, { data: ndaData }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
          .from("nda_signatures")
          .select("*")
          .eq("user_id", user.id)
          .order("signed_at", { ascending: false })
          .limit(1)
          .single(),
      ]);

      if (profileData) {
        setProfile(profileData as Profile);
        setFullName(profileData.full_name || "");
        setCompany(profileData.company || "");
      }
      if (ndaData) setNda(ndaData as NdaSignature);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: fullName, company, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-white">Profil</h1>
        <p className="text-sm text-[#8b8b9e] mt-1">
          Gérez vos informations personnelles
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Profil mis à jour avec succès.</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile?.email || ""} disabled className="bg-white/[0.03]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Société</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Accord de confidentialité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {nda ? (
            <>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span className="text-sm text-[#c0c0d0]">NDA signé</span>
                <Badge variant="secondary">Version {nda.document_version}</Badge>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#8b8b9e]">Date de signature</p>
                  <p className="font-medium">
                    {new Date(nda.signed_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[#8b8b9e]">Nom signé</p>
                  <p className="font-medium">{nda.full_name_typed}</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-[#8b8b9e]">Aucun NDA signé.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
