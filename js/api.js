const BASE = "https://dummyjson.com";
let cache = null; 

async function request(path) {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

export async function fetchProducts() {
  if (cache) return cache;
  const data = await request("/products?limit=0");
  cache = data.products;
  return cache;
}

export async function fetchProductById(id) {
  const found = cache?.find((p) => p.id === Number(id));
  if (found) return found;
  return request(`/products/${id}`);
}

export function getCategories(products) {
  return [...new Set(products.map((p) => p.category))].sort();
}