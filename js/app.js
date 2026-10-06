import { fetchProducts, fetchProductById, getCategories } from "./api.js";
import { getData, setData, KEYS } from "./storage.js";
import { initTheme } from "./theme.js";
import { 
  renderHeader, 
  renderFooter, 
  renderLoading, 
  renderError, 
  renderEmpty, 
  updateCartBadge,
  showToast 
} from "./ui.js";

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  renderHeader();
  renderFooter();

  const page = document.body.dataset.page;
  const appContainer = document.getElementById("app");

  switch (page) {
    case "home":
      initHomePage();
      break;
    case "products":
      initProductsPage();
      break;
    case "product":
      initProductDetailPage(appContainer);
      break;
    case "cart":
      initCartPage(appContainer);
      break;
    case "checkout":
      initCheckoutPage();
      break;
  }
});

// Toggle Favorite logic
function toggleFavorite(id, btnElement) {
  let favs = getData(KEYS.favorites, []);
  if (favs.includes(id)) {
    favs = favs.filter((favId) => favId !== id);
    btnElement.classList.remove("on");
    btnElement.textContent = "♡";
    showToast("Removed from favorites");
  } else {
    favs.push(id);
    btnElement.classList.add("on");
    btnElement.textContent = "♥";
    showToast("Added to favorites");
  }
  setData(KEYS.favorites, favs);
}

// Add Item to Cart
function addToCart(product, quantity = 1) {
  let cart = getData(KEYS.cart, []);
  const index = cart.findIndex((item) => item.id === product.id);
  if (index > -1) {
    cart[index].quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      thumbnail: product.thumbnail,
      quantity,
    });
  }
  setData(KEYS.cart, cart);
  updateCartBadge();
  showToast(`Added "${product.title}" to cart`);
}

// Create Product Card Component
function createProductCard(product) {
  const favs = getData(KEYS.favorites, []);
  const isFav = favs.includes(product.id);

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <a href="product.html?id=${product.id}" class="thumb">
      <img src="${product.thumbnail}" alt="${product.title}" loading="lazy" />
    </a>
    <button class="fav ${isFav ? "on" : ""}" data-id="${product.id}" aria-label="Favorite">
      ${isFav ? "♥" : "♡"}
    </button>
    <div class="body">
      <small>${product.category}</small>
      <h3><a href="product.html?id=${product.id}">${product.title}</a></h3>
      <div class="row">
        <span class="price">$${product.price}</span>
        <small class="muted">★ ${product.rating}</small>
      </div>
      <button class="btn sm add-cart-btn" data-id="${product.id}">Add to cart</button>
    </div>
  `;

  const favBtn = card.querySelector(".fav");
  favBtn.addEventListener("click", () => toggleFavorite(product.id, favBtn));

  card.querySelector(".add-cart-btn").addEventListener("click", () => addToCart(product));

  return card;
}

/* --- 1. HOME PAGE --- */
async function initHomePage() {
  const featuredContainer = document.getElementById("featured");
  const catsContainer = document.getElementById("cats");

  try {
    renderLoading(featuredContainer);
    const products = await fetchProducts();
    featuredContainer.innerHTML = "";

    // Categories
    const categories = getCategories(products);
    catsContainer.innerHTML = categories
      .map((c) => `<a href="products.html?cat=${encodeURIComponent(c)}" class="chip">${c}</a>`)
      .join("");

    // Top Rated (Rating >= 4.5)
    const topRated = products.filter((p) => p.rating >= 4.5).slice(0, 8);
    topRated.forEach((p) => featuredContainer.appendChild(createProductCard(p)));
  } catch (err) {
    renderError(featuredContainer, err.message);
  }
}

/* --- 2. PRODUCTS PAGE --- */
async function initProductsPage() {
  const grid = document.getElementById("grid");
  const qInput = document.getElementById("q");
  const catSelect = document.getElementById("cat");
  const sortSelect = document.getElementById("sort");
  const favOnlyCheck = document.getElementById("favOnly");
  const countP = document.getElementById("count");

  try {
    renderLoading(grid);
    const products = await fetchProducts();

    const categories = getCategories(products);
    catSelect.innerHTML =
      `<option value="">All Categories</option>` +
      categories.map((c) => `<option value="${c}">${c}</option>`).join("");

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("cat")) catSelect.value = urlParams.get("cat");

    function filterAndRender() {
      let result = [...products];
      const q = qInput.value.toLowerCase().trim();
      const cat = catSelect.value;
      const sort = sortSelect.value;
      const favOnly = favOnlyCheck.checked;
      const favs = getData(KEYS.favorites, []);

      if (q) result = result.filter((p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
      if (cat) result = result.filter((p) => p.category === cat);
      if (favOnly) result = result.filter((p) => favs.includes(p.id));

      if (sort === "pa") result.sort((a, b) => a.price - b.price);
      if (sort === "pd") result.sort((a, b) => b.price - a.price);
      if (sort === "r") result.sort((a, b) => b.rating - a.rating);
      if (sort === "n") result.sort((a, b) => a.title.localeCompare(b.title));

      countP.textContent = `Showing ${result.length} product(s)`;
      grid.innerHTML = "";

      if (result.length === 0) {
        renderEmpty(grid, "No products found matching your search.");
        return;
      }

      result.forEach((p) => grid.appendChild(createProductCard(p)));
    }

    [qInput, catSelect, sortSelect, favOnlyCheck].forEach((el) => el.addEventListener("input", filterAndRender));
    filterAndRender();
  } catch (err) {
    renderError(grid, err.message);
  }
}

/* --- 3. PRODUCT DETAILS PAGE --- */
async function initProductDetailPage(container) {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");

  if (!id) {
    renderEmpty(container, "Product not specified.");
    return;
  }

  try {
    renderLoading(container);
    const product = await fetchProductById(id);

    container.innerHTML = `
      <div class="detail">
        <div class="pic">
          <img src="${product.thumbnail}" alt="${product.title}" />
        </div>
        <div>
          <small class="muted">${product.category}</small>
          <h1 style="margin: 4px 0 12px">${product.title}</h1>
          <p class="price" style="margin-bottom: 8px">$${product.price}</p>
          <p class="muted">Rating: ★ ${product.rating} | Brand: ${product.brand || "Generic"}</p>
          <p style="margin: 16px 0">${product.description}</p>
          <div class="qty">
            <input type="number" id="qty" value="1" min="1" max="10" style="width: 70px" />
            <button class="btn" id="add-btn">Add to Cart</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("add-btn").addEventListener("click", () => {
      const qty = parseInt(document.getElementById("qty").value) || 1;
      addToCart(product, qty);
    });
  } catch (err) {
    renderError(container, err.message);
  }
}

/* --- 4. CART PAGE --- */
function initCartPage(container) {
  function renderCart() {
    const cart = getData(KEYS.cart, []);
    if (cart.length === 0) {
      renderEmpty(container, 'Your cart is empty. <br><a href="products.html" class="btn sm" style="margin-top:10px">Shop Now</a>');
      return;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal > 100 || subtotal === 0 ? 0 : 10;
    const total = subtotal + shipping;

    container.innerHTML = `
      <h1>Shopping Cart</h1>
      <div class="split">
        <div>
          ${cart.map((item) => `
            <div class="line">
              <img src="${item.thumbnail}" alt="${item.title}" />
              <div>
                <strong>${item.title}</strong>                 <div class="muted">$${item.price}</div>
                <div class="qty">
                  <input type="number" class="cart-qty" data-id="${item.id}" value="${item.quantity}" min="1" style="width:60px" />
                  <button class="btn ghost sm remove-btn" data-id="${item.id}">Remove</button>                 </div>               </div>               <div class="price" style="font-size:1.2rem">$${(item.price * item.quantity).toFixed(2)}</div>
            </div>
          `).join("")}
        </div>
        <div class="summary">
          <h3>Order Summary</h3>
          <div class="row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
          <div class="row"><span>Shipping</span><span>${shipping === 0 ? "Free" : `$${shipping}`}</span></div>
          <div class="row total"><span>Total</span><span>$${total.toFixed(2)}</span></div>
          <a href="checkout.html" class="btn" style="width:100%; text-align:center; margin-top:16px">Proceed to Checkout</a>
        </div>
      </div>
    `;

    container.querySelectorAll(".cart-qty").forEach((input) => {
      input.addEventListener("change", (e) => {
        const id = Number(e.target.dataset.id);
        const qty = parseInt(e.target.value) || 1;
        let c = getData(KEYS.cart, []);
        const item = c.find((i) => i.id === id);
        if (item) item.quantity = qty;
        setData(KEYS.cart, c);
        updateCartBadge();
        renderCart();
      });
    });

    container.querySelectorAll(".remove-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = Number(e.target.dataset.id);
        let c = getData(KEYS.cart, []);
        c = c.filter((i) => i.id !== id);
        setData(KEYS.cart, c);
        updateCartBadge();
        renderCart();
      });
    });
  }

  renderCart();
}

/* --- 5. CHECKOUT & ORDERS PAGE --- */
function initCheckoutPage() {
  const coDiv = document.getElementById("co");
  const oListDiv = document.getElementById("olist");

  function renderCheckout() {
    const cart = getData(KEYS.cart, []);

    if (cart.length === 0) {
      coDiv.innerHTML = `<div class="state"><p>No items in cart to checkout.</p></div>`;
    } else {
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shipping = subtotal > 100 ? 0 : 10;
      const total = subtotal + shipping;

      coDiv.innerHTML = `
        <h1>Checkout</h1>
        <div class="split">
          <form id="checkout-form" class="panel">
            <h3>Shipping Details</h3>
            <div class="f">
              <label>Full Name</label>
              <input type="text" id="name" required placeholder="John Doe" />
            </div>
            <div class="f">
              <label>Address</label>
              <input type="text" id="address" required placeholder="123 Main St" />
            </div>
            <div class="two">
              <div class="f">
                <label>City</label>
                <input type="text" id="city" required placeholder="New York" />
              </div>
              <div class="f">
                <label>Postal Code</label>
                <input type="text" id="zip" required placeholder="10001" />
              </div>
            </div>
            <button type="submit" class="btn" style="width:100%; margin-top:8px">Place Order ($${total.toFixed(2)})</button>
          </form>
          <div class="summary">
            <h3>Items (${cart.length})</h3>
            ${cart.map((item) => `<div class="row"><span>${item.title} x ${item.quantity}</span><span>$${(item.price * item.quantity).toFixed(2)}</span></div>`).join("")}
            <div class="row total"><span>Total</span><span>$${total.toFixed(2)}</span></div>
          </div>
        </div>
      `;

      document.getElementById("checkout-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const orders = getData(KEYS.orders, []);
        const newOrder = {
          id: Date.now(),
          date: new Date().toLocaleDateString(),
          items: cart,
          total: total.toFixed(2),
          customer: document.getElementById("name").value,
          address: document.getElementById("address").value,
        };

        orders.unshift(newOrder);
        setData(KEYS.orders, orders);
        setData(KEYS.cart, []);
        updateCartBadge();

        coDiv.innerHTML = `
          <div class="ok">
            <h2>Order Placed Successfully! 🎉</h2>
            <p>Thank you <strong>${newOrder.customer}</strong>, your order #${newOrder.id} has been recorded.</p>
          </div>
        `;

        renderOrders();
      });
    }
  }

  function renderOrders() {
    const orders = getData(KEYS.orders, []);
    if (orders.length === 0) {
      oListDiv.innerHTML = `<p class="muted">No previous orders found.</p>`;
      return;
    }

    oListDiv.innerHTML = orders
      .map(
        (o) => `
      <div class="order">
        <div class="row">
          <strong>Order #${o.id}</strong>
          <small class="muted">${o.date}</small>
        </div>
        <p><small class="muted">Ship to: ${o.customer} (${o.address})</small></p>
        <ul>
          ${o.items.map((i) => `<li>${i.title} x ${i.quantity} —$${(i.price * i.quantity).toFixed(2)}</li>`).join("")}
        </ul>
        <div class="row" style="border-top:1px dashed var(--border); padding-top:6px;">
          <strong>Total Paid:</strong>
          <span class="price" style="font-size:1.1rem">$${o.total}</span>
        </div>
      </div>
    `
      )
      .join("");
  }

  renderCheckout();
  renderOrders();
}