import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Auto-reload when returning to the app after a long background period
let lastActive = Date.now();

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    const elapsed = Date.now() - lastActive;
    // If app was in background for more than 5 minutes, reload to get fresh state
    if (elapsed > 5 * 60 * 1000) {
      window.location.reload();
    }
  } else {
    lastActive = Date.now();
  }
});
