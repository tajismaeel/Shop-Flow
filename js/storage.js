export const KEYS = {
  cart: "shopflow_cart",
  favorites: "shopflow_favorites",
  orders: "shopflow_orders",
  theme: "shopflow_theme",
};

export function getData(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback; 
  }
}

export function setData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Storage error:", err);
  }
}