import { ShaderAnimation } from "@/components/ui/shader-animation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — shader animation */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <ShaderAnimation />
        {/* Overlay branding */}
        <div className="absolute inset-0 flex flex-col justify-between p-10 pointer-events-none">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              M&A OS
            </h1>
            <p className="text-sm text-white/60 mt-1">Deal Execution Platform</p>
          </div>
          <div>
            <p className="text-xs text-white/30">
              &copy; 2026 Alvora Partners — Confidential
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 bg-white">
        {/* Mobile logo (hidden on desktop) */}
        <div className="mb-8 text-center lg:hidden">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            M&A OS
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Deal Execution Platform</p>
        </div>

        {children}

        <p className="mt-8 text-xs text-zinc-400 lg:hidden">
          &copy; 2026 Alvora Partners — Confidential
        </p>
      </div>
    </div>
  );
}
