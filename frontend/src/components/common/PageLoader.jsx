import { Sparkles, ShieldCheck } from "lucide-react";

export default function PageLoader({
  message = "Loading workspace...",
  subtitle = "Connecting to real-time Cloud Firestore",
  fullScreen = false,
  compact = false,
}) {
  const content = (
    <div className="flex flex-col items-center justify-center text-center p-6 select-none animate-in fade-in duration-200">
      {/* Glowing Brand Icon with Multi-ring Spinners */}
      <div className="relative mb-5 flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className="absolute h-18 w-18 rounded-3xl bg-gradient-to-r from-indigo-500/30 to-emerald-500/30 blur-xl animate-pulse" />
        
        {/* Spinning track ring */}
        <div className="absolute h-16 w-16 rounded-2xl border-2 border-slate-200/60 border-t-indigo-600 dark:border-slate-800/80 dark:border-t-emerald-400 animate-spin" />
        
        {/* Central Logo Badge */}
        <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30">
          AI
        </div>
      </div>

      {/* Status Message */}
      <div className="space-y-1.5 max-w-xs">
        <h4 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5">
          <span>{message}</span>
        </h4>
        {subtitle && (
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {/* Linear animated progress bar */}
      <div className="mt-4 h-1 w-36 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full animate-indeterminate" />
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md">
        {content}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center justify-center py-12">
        {content}
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center">
      {content}
    </div>
  );
}
