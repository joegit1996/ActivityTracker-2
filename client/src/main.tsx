import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";

// Hide error overlay on mobile devices
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
  const style = document.createElement('style');
  style.textContent = `
    [data-vite-plugin="runtime-error-plugin"] {
      display: none !important;
    }
    .vite-error-overlay {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
}

createRoot(document.getElementById("root")!).render(<App />);
