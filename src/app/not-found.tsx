import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] text-center px-4">
      <p className="text-sm font-medium text-[#52526b] uppercase tracking-widest mb-4">
        404
      </p>
      <h1 className="text-3xl font-semibold text-white mb-2">
        Page introuvable
      </h1>
      <p className="text-[#8b8b9e] mb-8 max-w-sm">
        La page que vous cherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/os/fec-analyzer"
        className="inline-flex items-center justify-center rounded-lg bg-[#e040fb] text-white text-sm font-medium h-8 px-4 hover:bg-[#c030d9] transition-colors"
      >
        Retour au dashboard
      </Link>
    </div>
  );
}
