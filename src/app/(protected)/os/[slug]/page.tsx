import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FecAnalyzer } from "@/components/fec/fec-analyzer";

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

  if (slug === "fec-analyzer") {
    return <FecAnalyzer />;
  }

  notFound();
}
