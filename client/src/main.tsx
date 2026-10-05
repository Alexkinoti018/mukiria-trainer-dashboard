import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { syncEngine } from "./lib/syncEngine";

// Register Service Worker for offline resilience
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("[MTTI SW] Service Worker registered with scope:", reg.scope);
      })
      .catch((err) => {
        console.warn("[MTTI SW] Service Worker registration failed:", err);
      });
  });

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data && event.data.type === "TRIGGER_BACKGROUND_SYNC") {
      console.log("[MTTI SW] Triggering background sync flush via SW message");
      syncEngine.flushQueue();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);

