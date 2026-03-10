export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          M&A OS
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Deal Execution Platform</p>
      </div>
      {children}
      <p className="mt-8 text-xs text-zinc-400">
        &copy; {new Date().getFullYear()} Alvora Partners — Confidential
      </p>
    </div>
  );
}
