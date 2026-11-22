const demoProducts = [
  {
    id: "espresso-demo",
    name: "Espresso da casa",
    category: "Cafeteria",
    description: "Café encorpado preparado na hora.",
    image: "imgs/demo-cafe.svg",
    options: [{ label: "Curto", price: 6 }, { label: "Duplo", price: 9 }],
  },
  {
    id: "cafe-gelado-demo",
    name: "Café gelado",
    category: "Cafeteria",
    description: "Café suave servido com gelo.",
    image: "imgs/demo-cafe.svg",
    options: [{ label: "300 ml", price: 10 }, { label: "500 ml", price: 14 }],
  },
  {
    id: "pao-artesanal-demo",
    name: "Pão artesanal",
    category: "Padaria",
    description: "Pão dourado para acompanhar seu café.",
    image: "imgs/demo-pao.svg",
    options: [{ label: "Unidade", price: 8 }],
  },
  {
    id: "bolo-demo",
    name: "Bolo do dia",
    category: "Confeitaria",
    description: "Uma fatia para deixar a pausa mais gostosa.",
    image: "imgs/demo-bolo.svg",
    options: [{ label: "Fatia", price: 7 }, { label: "Fatia especial", price: 9 }],
  },
  {
    id: "cha-demo",
    name: "Chá cítrico",
    category: "Bebidas geladas",
    description: "Bebida refrescante com notas cítricas.",
    image: "imgs/demo-cha.svg",
    options: [{ label: "300 ml", price: 8 }],
  },
  {
    id: "combo-demo",
    name: "Combo pausa",
    category: "Combos",
    description: "Uma bebida e um acompanhamento em uma combinação demonstrativa.",
    image: "imgs/demo-combo.svg",
    options: [{ label: "Café + pão", price: 13 }, { label: "Chá + bolo", price: 14 }],
  },
];

const publicConfig = window.FORJA_CONFIG || {};
const supabaseUrl = String(publicConfig.supabaseUrl || "")
  .trim()
  .replace(/\/rest\/v1\/?$/i, "")
  .replace(/\/+$/, "");
const supabaseAnonKey = String(publicConfig.supabaseAnonKey || "").trim();
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const catalogGrid = document.getElementById("catalogGrid");
const categoryStories = document.getElementById("categoryStories");
const cartButton = document.getElementById("cartButton");
const cartCount = document.getElementById("cartCount");
const cartBottomBar = document.getElementById("cartBottomBar");
const fabCart = document.getElementById("fabCart");
const fabCartCount = document.getElementById("fabCartCount");
const fabCartTotal = document.getElementById("fabCartTotal");
const cartModal = document.getElementById("cartModal");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const checkoutBtn = document.getElementById("checkoutBtn");
const checkoutModal = document.getElementById("checkoutModal");
const checkoutForm = document.getElementById("checkoutForm");
const toast = document.getElementById("toast");

let products = demoProducts;
let cart = [];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function slugify(value) {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function renderProductCard(product) {
  const productId = escapeHtml(product.id);
  const productName = escapeHtml(product.name);
  const category = escapeHtml(product.category);
  const image = escapeHtml(product.image || product.image_url || "imgs/forja-systems.png");
  const options = Array.isArray(product.options) ? product.options : [];

  return `
    <article class="product-card">
      <div class="product-image">
        <img src="${image}" alt="${productName}" loading="lazy" />
        <span class="product-badge">${category}</span>
      </div>
      <div class="product-body">
        <p class="product-category">${category}</p>
        <h3>${productName}</h3>
        <p class="product-description">${escapeHtml(product.description || "Item demonstrativo.")}</p>
        <label class="option-label" for="option-${productId}">Escolha uma opção</label>
        <select id="option-${productId}" class="product-option" data-option-select="${productId}">
          ${options.map((option, index) => `<option value="${index}">${escapeHtml(option.label)} — ${currency.format(Number(option.price) || 0)}</option>`).join("")}
        </select>
        <div class="quantity-row">
          <label for="qty-${productId}">Quantidade</label>
          <div class="quantity-stepper" aria-label="Quantidade de ${productName}">
            <button type="button" aria-label="Diminuir quantidade" data-quantity-step="-1">−</button>
            <input id="qty-${productId}" class="qty-input" type="number" min="1" inputmode="numeric" value="1" aria-label="Quantidade de ${productName}" />
            <button type="button" aria-label="Aumentar quantidade" data-quantity-step="1">+</button>
          </div>
        </div>
        <button type="button" class="add-btn" data-product-id="${productId}">
          <span aria-hidden="true">＋</span> Adicionar à sacola
        </button>
      </div>
    </article>
  `;
}

function renderProducts() {
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, "pt-BR"));
  const ringColors = ["#FF6A00", "#FF9A1F", "#F2F4F7", "#FF4D00"];

  categoryStories.innerHTML = categories.map((category, index) => {
    const firstProduct = products.find((product) => product.category === category);
    return `
      <a class="category-story" href="#category-${slugify(category)}" style="--story-ring: ${ringColors[index % ringColors.length]}">
        <span class="category-story-image"><img src="${escapeHtml(firstProduct.image || firstProduct.image_url || "imgs/forja-systems.png")}" alt="" loading="lazy" /></span>
        <span>${escapeHtml(category)}</span>
      </a>
    `;
  }).join("");

  catalogGrid.innerHTML = categories.map((category) => `
    <section class="category-section" id="category-${slugify(category)}">
      <h3 class="category-title">${escapeHtml(category)}</h3>
      <div class="product-grid">
        ${products.filter((product) => product.category === category).map(renderProductCard).join("")}
      </div>
    </section>
  `).join("");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.add("hidden"), 2400);
}

function openModal(modal) {
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(modal) {
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

function updateCart() {
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartCount.textContent = count;
  fabCartCount.textContent = count;
  fabCartTotal.textContent = currency.format(total);
  cartTotal.textContent = currency.format(total);
  cartBottomBar.classList.toggle("hidden", count === 0);
  checkoutBtn.disabled = count === 0;

  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="empty-state"><strong>Sacola vazia</strong><p>Adicione um item para testar a demonstração.</p></div>';
    return;
  }

  cartItems.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      <div class="cart-item-info">
        <strong>${escapeHtml(item.name)}</strong>
        <div>${escapeHtml(item.option)} · ${currency.format(item.price)} × ${item.quantity}</div>
      </div>
      <button class="cart-remove" type="button" data-remove-item="${index}">Remover</button>
    </div>
  `).join("");
}

document.addEventListener("change", (event) => {
  const quantityField = event.target.closest(".qty-input");
  if (quantityField) quantityField.value = Math.max(1, Number(quantityField.value || 1));
});

document.addEventListener("click", (event) => {
  const closeButton = event.target.closest("[data-close-modal]");
  if (closeButton) {
    closeModal(document.getElementById(closeButton.dataset.closeModal));
    return;
  }

  if (event.target.classList.contains("modal")) {
    closeModal(event.target);
    return;
  }

  const quantityStep = event.target.closest("[data-quantity-step]");
  if (quantityStep) {
    const input = quantityStep.closest(".product-card").querySelector(".qty-input");
    input.value = Math.max(1, Number(input.value || 1) + Number(quantityStep.dataset.quantityStep));
    return;
  }

  const removeButton = event.target.closest("[data-remove-item]");
  if (removeButton) {
    cart.splice(Number(removeButton.dataset.removeItem), 1);
    updateCart();
    return;
  }

  const addButton = event.target.closest("[data-product-id]");
  if (!addButton) return;

  const product = products.find((item) => item.id === addButton.dataset.productId);
  const card = addButton.closest(".product-card");
  const optionSelect = card.querySelector(`[data-option-select="${product.id}"]`);
  const option = product.options[Number(optionSelect.value)];
  const quantity = Math.max(1, Number(card.querySelector(".qty-input").value || 1));
  const existing = cart.find((item) => item.id === product.id && item.option === option.label);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ id: product.id, name: product.name, option: option.label, price: Number(option.price) || 0, quantity });
  }
  updateCart();
  showToast("Item adicionado à sacola de demonstração.");
});

cartButton.addEventListener("click", () => openModal(cartModal));
fabCart.addEventListener("click", () => openModal(cartModal));
checkoutBtn.addEventListener("click", () => {
  if (cart.length === 0) return;
  closeModal(cartModal);
  openModal(checkoutModal);
});

checkoutForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (cart.length === 0) return;
  cart = [];
  updateCart();
  closeModal(checkoutModal);
  showToast("Simulação concluída. Nenhum dado foi enviado.");
});

async function loadProducts() {
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/products?select=*&active=eq.true&order=sort_order.asc`, {
        headers: { apikey: supabaseAnonKey },
      });
      if (!response.ok) throw new Error(`Supabase respondeu HTTP ${response.status}`);
      const remoteProducts = await response.json();
      if (Array.isArray(remoteProducts) && remoteProducts.length > 0) {
        products = remoteProducts.map((product) => ({
          ...product,
          image: product.image_url || product.image || "imgs/forja-systems.png",
          options: Array.isArray(product.options) ? product.options : [],
        }));
      }
    } catch (error) {
      console.warn("Usando os produtos fictícios da demonstração.", error);
    }
  }

  renderProducts();
  updateCart();
}

const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

loadProducts();
