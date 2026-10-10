import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { syncEngine } from "./lib/syncEngine";

// Ensure light institutional theme is active on root HTML element
if (typeof document !== "undefined") {
  document.documentElement.classList.remove("dark");
  localStorage.removeItem("theme");
}

// Register Service Worker & purge legacy stale caches (mtti-pwa-v1/v2/v3)
if ("serviceWorker" in navigator) {
  if ("caches" in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        if (name !== "mtti-pwa-v4") {
          caches.delete(name);
        }
      });
    });
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        reg.update();
        console.log("[MTTI SW] Service Worker registered with scope:", reg.scope);
      })
      .catch((err) => {
        console.warn("[MTTI SW] Service Worker registration failed:", err);
      });
  });

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data && event.data.type === "TRIGGER_BACKGROUND_SYNC") {
      syncEngine.flushQueue();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
