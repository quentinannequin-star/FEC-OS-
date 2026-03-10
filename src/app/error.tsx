"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 text-center px-4">
      <p className="text-sm font-medium text-zinc-400 uppercase tracking-widest mb-4">
        Erreur
      </p>
      <h1 className="text-3xl font-semibold text-zinc-900 mb-2">
        Une erreur est survenue
      </h1>
      <p className="text-zinc-500 mb-8 max-w-sm">
        Une erreur inattendue s&apos;est produite. Veuillez réessayer.
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center justify-center rounded-lg bg-zinc-900 text-white text-sm font-medium h-8 px-4 hover:bg-zinc-700 transition-colors"
      >
        Réessayer
      </button>
    </div>
  );
}
