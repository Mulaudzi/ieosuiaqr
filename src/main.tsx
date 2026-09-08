import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// A user can keep an older app shell open while a deployment replaces its
// content-hashed chunks. Reload once to fetch the new index and chunk map.
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();

  const reloadKey = "ieosuia:last-stale-build-reload";
  const lastReload = Number(sessionStorage.getItem(reloadKey) ?? 0);
  const now = Date.now();

  if (now - lastReload > 10_000) {
    sessionStorage.setItem(reloadKey, String(now));
    window.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
