const STORAGE_KEY = "pyrokart-marketplace-v1";

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

const demoState = {
  listings: [
    {
      id: createId(),
      name: "Gold sparklers pack",
      category: "Sparklers",
      stock: 80,
      price: 149,
      safetyClass: "Low noise",
      pickupWindow: "4:00 PM - 8:00 PM",
      status: "Approved",
    },
    {
      id: createId(),
      name: "Classic flower pots",
      category: "Flower pots",
      stock: 34,
      price: 329,
      safetyClass: "Outdoor only",
      pickupWindow: "5:00 PM - 9:00 PM",
      status: "Approved",
    },
    {
      id: createId(),
      name: "Festival gift box",
      category: "Gift boxes",
      stock: 16,
      price: 1199,
      safetyClass: "Adult supervised",
      pickupWindow: "3:00 PM - 7:00 PM",
      status: "Pending",
    },
  ],
  orders: [
    {
      id: "PKR-4108",
      buyer: "Asha Kumar",
      items: "Gold sparklers pack x2",
      total: 298,
      pickupWindow: "4:00 PM - 8:00 PM",
      status: "Ready for pickup",
    },
  ],
  cart: [],
};

let state = loadState();

const views = document.querySelectorAll(".view");
const roleTabs = document.querySelectorAll(".role-tab");
const toast = document.querySelector("#toast");

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return cloneData(demoState);
  }

  try {
    return JSON.parse(saved);
  } catch {
    return cloneData(demoState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function setView(viewName) {
  views.forEach((view) => view.classList.toggle("active", view.id === `${viewName}-view`));
  roleTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === viewName));
}

function metric(label, value) {
  return `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`;
}

function renderSellerMetrics() {
  const approved = state.listings.filter((item) => item.status === "Approved").length;
  const pending = state.listings.filter((item) => item.status === "Pending").length;
  const stock = state.listings.reduce((total, item) => total + Number(item.stock), 0);
  const revenue = state.orders.reduce((total, order) => total + Number(order.total), 0);

  document.querySelector("#seller-metrics").innerHTML = [
    metric("Approved listings", approved),
    metric("Pending approval", pending),
    metric("Available units", stock),
    metric("Reserved value", formatMoney(revenue)),
  ].join("");
}

function renderAdminMetrics() {
  const pending = state.listings.filter((item) => item.status === "Pending").length;
  const paused = state.listings.filter((item) => item.status === "Paused").length;
  const orders = state.orders.length;
  const approvedStock = state.listings
    .filter((item) => item.status === "Approved")
    .reduce((total, item) => total + Number(item.stock), 0);

  document.querySelector("#admin-metrics").innerHTML = [
    metric("Approval queue", pending),
    metric("Paused listings", paused),
    metric("Pickup reservations", orders),
    metric("Approved stock", approvedStock),
  ].join("");
}

function statusBadge(status) {
  const modifier = status === "Pending" ? "pending" : status === "Paused" ? "paused" : "";
  return `<span class="badge ${modifier}">${status}</span>`;
}

function renderInventory() {
  const filter = document.querySelector("#inventory-filter").value;
  const listings = state.listings.filter((item) => filter === "all" || item.status === filter);
  const target = document.querySelector("#inventory-list");

  target.innerHTML = listings.length
    ? listings
        .map(
          (item) => `
          <article class="inventory-item">
            <div class="item-top">
              <div>
                <strong>${item.name}</strong>
                <p class="item-meta">${item.category} · ${item.safetyClass} · ${formatMoney(item.price)}</p>
              </div>
              ${statusBadge(item.status)}
            </div>
            <p class="item-meta">${item.stock} units · Pickup ${item.pickupWindow}</p>
            <div class="item-actions">
              <button class="small-action" type="button" data-action="toggle-pause" data-id="${item.id}">
                ${item.status === "Paused" ? "Resume" : "Pause"}
              </button>
            </div>
          </article>
        `,
        )
        .join("")
    : `<p class="cart-empty">No listings match this filter.</p>`;
}

function renderOrders() {
  const rows = state.orders.length
    ? state.orders
        .map(
          (order) => `
        <div class="table-row">
          <strong>${order.id}</strong>
          <span>${order.buyer}</span>
          <span>${order.items}</span>
          <span>${formatMoney(order.total)}</span>
          <span>${order.pickupWindow}</span>
          <span class="badge">${order.status}</span>
        </div>
      `,
        )
        .join("")
    : `<p class="cart-empty">No reservations yet.</p>`;

  document.querySelector("#seller-orders").innerHTML = rows;
  document.querySelector("#admin-orders").innerHTML = rows;
}

function renderCatalog() {
  const query = document.querySelector("#catalog-search").value.trim().toLowerCase();
  const category = document.querySelector("#category-filter").value;
  const products = state.listings.filter((item) => {
    const visible = item.status === "Approved" && Number(item.stock) > 0;
    const categoryMatch = category === "all" || item.category === category;
    const queryMatch = item.name.toLowerCase().includes(query);
    return visible && categoryMatch && queryMatch;
  });

  document.querySelector("#catalog-list").innerHTML = products.length
    ? products
        .map(
          (item) => `
          <article class="product-card">
            <div class="product-visual" aria-hidden="true">
              <div class="cracker-pack"></div>
            </div>
            <div class="product-body">
              <div>
                <strong>${item.name}</strong>
                <p class="item-meta">${item.category} · ${item.safetyClass}</p>
              </div>
              <div class="product-price">${formatMoney(item.price)}</div>
              <p class="item-meta">${item.stock} units · Pickup ${item.pickupWindow}</p>
              <button class="primary-action" type="button" data-action="add-cart" data-id="${item.id}">
                Add to pickup cart
              </button>
            </div>
          </article>
        `,
        )
        .join("")
    : `<p class="cart-empty">No approved products match your search.</p>`;
}

function renderCart() {
  const target = document.querySelector("#cart-list");
  const total = state.cart.reduce((sum, cartItem) => {
    const product = state.listings.find((item) => item.id === cartItem.id);
    return product ? sum + product.price * cartItem.qty : sum;
  }, 0);

  target.innerHTML = state.cart.length
    ? state.cart
        .map((cartItem) => {
          const product = state.listings.find((item) => item.id === cartItem.id);
          if (!product) return "";
          return `
            <div class="cart-item">
              <div class="item-top">
                <strong>${product.name}</strong>
                <button class="small-action" type="button" data-action="remove-cart" data-id="${product.id}">Remove</button>
              </div>
              <p class="item-meta">Qty ${cartItem.qty} · ${formatMoney(product.price * cartItem.qty)}</p>
            </div>
          `;
        })
        .join("")
    : `<p class="cart-empty">Your pickup cart is empty.</p>`;

  document.querySelector("#cart-total").textContent = formatMoney(total);
}

function renderApprovals() {
  const pendingListings = state.listings.filter((item) => item.status === "Pending");

  document.querySelector("#approval-list").innerHTML = pendingListings.length
    ? pendingListings
        .map(
          (item) => `
          <article class="approval-item">
            <div class="item-top">
              <div>
                <strong>${item.name}</strong>
                <p class="item-meta">${item.category} · ${item.safetyClass} · ${formatMoney(item.price)}</p>
              </div>
              ${statusBadge(item.status)}
            </div>
            <p class="item-meta">${item.stock} units · Pickup ${item.pickupWindow}</p>
            <div class="item-actions">
              <button class="small-action" type="button" data-action="approve" data-id="${item.id}">Approve</button>
              <button class="warning-action" type="button" data-action="reject" data-id="${item.id}">Pause</button>
            </div>
          </article>
        `,
        )
        .join("")
    : `<p class="cart-empty">No listings waiting for review.</p>`;
}

function renderAll() {
  renderSellerMetrics();
  renderAdminMetrics();
  renderInventory();
  renderOrders();
  renderCatalog();
  renderCart();
  renderApprovals();
}

function addListing(form) {
  const data = new FormData(form);
  state.listings.unshift({
    id: createId(),
    name: data.get("name").trim(),
    category: data.get("category"),
    stock: Number(data.get("stock")),
    price: Number(data.get("price")),
    safetyClass: data.get("safetyClass"),
    pickupWindow: data.get("pickupWindow").trim(),
    status: "Pending",
  });
  saveState();
  form.reset();
  renderAll();
  notify("Listing submitted to admin approval.");
}

function addToCart(id) {
  const product = state.listings.find((item) => item.id === id);
  if (!product || product.stock <= 0) return;

  const existing = state.cart.find((item) => item.id === id);
  if (existing) {
    if (existing.qty >= product.stock) {
      notify("No more stock is available for that item.");
      return;
    }
    existing.qty += 1;
  } else {
    state.cart.push({ id, qty: 1 });
  }

  saveState();
  renderCart();
  notify("Added to pickup cart.");
}

function removeFromCart(id) {
  state.cart = state.cart.filter((item) => item.id !== id);
  saveState();
  renderCart();
}

function reserveCart() {
  if (!state.cart.length) {
    notify("Add at least one item before reserving pickup.");
    return;
  }

  if (!document.querySelector("#age-confirm").checked) {
    notify("Please confirm legal eligibility and ID pickup check.");
    return;
  }

  const orderItems = [];
  let total = 0;
  let pickupWindow = "";

  state.cart.forEach((cartItem) => {
    const product = state.listings.find((item) => item.id === cartItem.id);
    if (!product) return;
    product.stock -= cartItem.qty;
    total += product.price * cartItem.qty;
    pickupWindow = pickupWindow || product.pickupWindow;
    orderItems.push(`${product.name} x${cartItem.qty}`);
  });

  state.orders.unshift({
    id: `PKR-${Math.floor(1000 + Math.random() * 9000)}`,
    buyer: "Walk-in buyer",
    items: orderItems.join(", "),
    total,
    pickupWindow,
    status: "Reserved",
  });
  state.cart = [];
  document.querySelector("#age-confirm").checked = false;
  saveState();
  renderAll();
  notify("Pickup reservation created. No delivery has been scheduled.");
}

document.querySelector("#listing-form").addEventListener("submit", (event) => {
  event.preventDefault();
  addListing(event.currentTarget);
});

document.querySelector("#seed-demo").addEventListener("click", () => {
  state = cloneData(demoState);
  saveState();
  renderAll();
  notify("Demo data restored.");
});

document.querySelector("#inventory-filter").addEventListener("change", renderInventory);
document.querySelector("#catalog-search").addEventListener("input", renderCatalog);
document.querySelector("#category-filter").addEventListener("change", renderCatalog);
document.querySelector("#reserve-cart").addEventListener("click", reserveCart);

roleTabs.forEach((tab) => {
  tab.addEventListener("click", () => setView(tab.dataset.view));
});

document.body.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  const listing = state.listings.find((item) => item.id === id);

  if (action === "approve" && listing) {
    listing.status = "Approved";
    notify("Listing approved for buyer catalog.");
  }

  if (action === "reject" && listing) {
    listing.status = "Paused";
    notify("Listing paused for seller correction.");
  }

  if (action === "toggle-pause" && listing) {
    listing.status = listing.status === "Paused" ? "Pending" : "Paused";
    notify(listing.status === "Paused" ? "Listing paused." : "Listing returned to approval.");
  }

  if (action === "add-cart") {
    addToCart(id);
    return;
  }

  if (action === "remove-cart") {
    removeFromCart(id);
    return;
  }

  saveState();
  renderAll();
});

renderAll();
