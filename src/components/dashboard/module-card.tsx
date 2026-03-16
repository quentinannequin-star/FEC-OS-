import Link from "next/link";
import type { OsModule } from "@/types/database";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  FolderLock,
  Table2,
  Package,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileSpreadsheet,
  FolderLock,
  Table2,
};

const statusConfig = {
  active: { label: "Actif", variant: "default" as const },
  coming_soon: { label: "Bientôt", variant: "secondary" as const },
  maintenance: { label: "Maintenance", variant: "destructive" as const },
  deprecated: { label: "Déprécié", variant: "outline" as const },
};

export function ModuleCard({ module }: { module: OsModule }) {
  const Icon = iconMap[module.icon] || Package;
  const status = statusConfig[module.status];

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06]">
              <Icon className="h-5 w-5 text-[#e040fb]" />
            </div>
            <div>
              <CardTitle>{module.name}</CardTitle>
            </div>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between gap-4">
        <CardDescription className="line-clamp-2">
          {module.description}
        </CardDescription>
        {module.status === "active" ? (
          <Link
            href={`/os/${module.slug}`}
            className="inline-flex w-full items-center justify-center rounded-lg bg-[#e040fb] text-white text-sm font-medium h-8 px-2.5 hover:bg-[#c030d9] transition-colors"
          >
            Ouvrir
          </Link>
        ) : (
          <Button disabled className="w-full" variant="secondary">
            Bientôt disponible
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
