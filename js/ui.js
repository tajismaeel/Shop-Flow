import { toggleTheme } from "./theme.js";
import { getData, KEYS } from "./storage.js";

export function renderHeader() {
  const page = document.body.dataset.page;
  const cart = getData(KEYS.cart, []);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const header = document.createElement("header");
  header.className = "top";
  header.innerHTML = `
    <div class="in">
      <a href="index.html" class="brand">ShopFlow</a>
      <nav>
        <a href="index.html" class="${page === "home" ? "on" : ""}">Home</a>
        <a href="products.html" class="${page === "products" ? "on" : ""}">Products</a>
        <a href="cart.html" class="${page === "cart" ? "on" : ""}">
          Cart <span class="badge" id="cart-badge">${cartCount}</span>
        </a>
        <a href="checkout.html" class="${page === "checkout" ? "on" : ""}">Orders</a>
      </nav>
      <button id="theme-toggle" class="icon" aria-label="Toggle Theme">🌓</button>
    </div>
  `;

  document.body.prepend(header);

  document.getElementById("theme-toggle").addEventListener("click", () => {
    toggleTheme();
  });
}

export function renderFooter() {
  const footer = document.createElement("footer");
  footer.innerHTML = `<p>&copy; ${new Date().getFullYear()} ShopFlow. Built with HTML, CSS, & JS.</p>`;
  document.body.appendChild(footer);
}

export function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

export function renderLoading(container) {
  container.innerHTML = `
    <div class="state">
      <div class="spin"></div>
      <p>Loading products...</p>
    </div>
  `;
}

export function renderError(container, message) {
  container.innerHTML = `
    <div class="state error">
      <p>Error: ${message}</p>
      <button onclick="window.location.reload()" class="btn sm">Try Again</button>
    </div>
  `;
}

export function renderEmpty(container, message) {
  container.innerHTML = `<div class="state"><p>${message}</p></div>`;
}

export function updateCartBadge() {
  const badge = document.getElementById("cart-badge");
  if (badge) {
    const cart = getData(KEYS.cart, []);
    badge.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
  }
}