import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 text-center px-4">
      <p className="text-sm font-medium text-zinc-400 uppercase tracking-widest mb-4">
        404
      </p>
      <h1 className="text-3xl font-semibold text-zinc-900 mb-2">
        Page introuvable
      </h1>
      <p className="text-zinc-500 mb-8 max-w-sm">
        La page que vous cherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center rounded-lg bg-zinc-900 text-white text-sm font-medium h-8 px-4 hover:bg-zinc-700 transition-colors"
      >
        Retour au dashboard
      </Link>
    </div>
  );
}
