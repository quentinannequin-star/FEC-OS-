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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] text-center px-4">
      <p className="text-sm font-medium text-[#52526b] uppercase tracking-widest mb-4">
        Erreur
      </p>
      <h1 className="text-3xl font-semibold text-white mb-2">
        Une erreur est survenue
      </h1>
      <p className="text-[#8b8b9e] mb-8 max-w-sm">
        Une erreur inattendue s&apos;est produite. Veuillez réessayer.
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center justify-center rounded-lg bg-[#e040fb] text-white text-sm font-medium h-8 px-4 hover:bg-[#c030d9] transition-colors"
      >
        Réessayer
      </button>
    </div>
  );
}
