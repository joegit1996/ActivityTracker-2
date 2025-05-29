import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";

// Hide error overlay on mobile devices
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  const style = document.createElement('style');
  style.textContent = `
    [data-vite-plugin="runtime-error-plugin"],
    .vite-error-overlay,
    [id*="vite-error"],
    [class*="vite-error"],
    [data-vite*="error"] {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
      z-index: -9999 !important;
    }
  `;
  document.head.appendChild(style);
  
  // Also remove any existing error overlays
  const removeErrorOverlays = () => {
    const overlays = document.querySelectorAll('[data-vite-plugin="runtime-error-plugin"], .vite-error-overlay, [id*="vite-error"]');
    overlays.forEach(overlay => {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    });
  };
  
  // Remove on load and periodically check
  removeErrorOverlays();
  setInterval(removeErrorOverlays, 1000);
}

createRoot(document.getElementById("root")!).render(<App />);
