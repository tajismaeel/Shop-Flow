import { getData, setData, KEYS } from "./storage.js";

function apply(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function initTheme() {
  const saved = getData(KEYS.theme, null);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  apply(saved || (prefersDark ? "dark" : "light"));
}

export function toggleTheme() {
  const next =
    document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  apply(next);
  setData(KEYS.theme, next);
  return next;
}