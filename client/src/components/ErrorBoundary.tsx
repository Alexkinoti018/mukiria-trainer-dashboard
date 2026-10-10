import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkLoadError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, isChunkLoadError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const msg = error?.message || "";
    const isChunkLoadError =
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Importing a module script failed") ||
      error.name === "ChunkLoadError";

    return { hasError: true, error, isChunkLoadError };
  }

  componentDidCatch(error: Error) {
    const msg = error?.message || "";
    const isChunkLoadError =
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Importing a module script failed") ||
      error.name === "ChunkLoadError";

    if (isChunkLoadError && typeof window !== "undefined") {
      const key = "error_boundary_auto_retry_" + window.location.pathname;
      const retried = sessionStorage.getItem(key);
      if (!retried) {
        sessionStorage.setItem(key, "true");
        window.location.reload();
      }
    }
  }

  handleReload = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("error_boundary_auto_retry_" + window.location.pathname);
      sessionStorage.removeItem("retry_import_" + window.location.pathname);
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4 sm:p-8 bg-slate-950 text-slate-100">
          <div className="flex flex-col items-center w-full max-w-xl p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5">
              <AlertTriangle size={28} />
            </div>

            <h2 className="text-xl font-bold tracking-tight text-white mb-2">
              {this.state.isChunkLoadError
                ? "Academic Module Reconnection Required"
                : "An unexpected error occurred."}
            </h2>

            <p className="text-sm text-slate-400 mb-6 max-w-md">
              {this.state.isChunkLoadError
                ? "A page module could not be loaded because the local server restarted or the network connection was briefly interrupted. Reloading will reconnect the session."
                : "An unexpected runtime error was caught by the institutional error boundary."}
            </p>

            {this.state.error && (
              <div className="p-3 w-full rounded-xl bg-slate-950 border border-slate-800 text-left overflow-auto mb-6 max-h-36 font-mono text-xs text-slate-400">
                <span className="text-red-400 font-bold block mb-1">
                  {this.state.error.name}: {this.state.error.message}
                </span>
                {this.state.error.stack}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-[#000953] hover:bg-[#000e7a] text-white border border-[#c48820]/40 shadow-lg transition active:scale-95 cursor-pointer"
            >
              <RotateCcw size={16} className="text-[#c48820]" />
              <span>Reload Page & Reconnect</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

