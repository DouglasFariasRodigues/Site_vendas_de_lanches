const loginPanel = document.getElementById("loginPanel");
const adminPanel = document.getElementById("adminPanel");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const logoutBtn = document.getElementById("logoutBtn");
const productForm = document.getElementById("productForm");
const productList = document.getElementById("productList");
const productCount = document.getElementById("productCount");
const productSearch = document.getElementById("productSearch");
const categoryOptions = document.getElementById("categoryOptions");
const catalogStatus = document.getElementById("catalogStatus");
const editorPanel = document.getElementById("editorPanel");
const optionsEditor = document.getElementById("optionsEditor");
const adminMessage = document.getElementById("adminMessage");
const imagePreview = document.getElementById("imagePreview");
const imagePlaceholder = document.getElementById("imagePlaceholder");

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

let token = sessionStorage.getItem("forjaSystemsDemoAdminToken") || "";
let products = [];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function setMessage(message, isError = false) {
  adminMessage.textContent = message;
  adminMessage.classList.toggle("error", isError);
}

async function api(action, extra = {}) {
  const response = await fetch("/.netlify/functions/admin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ action, ...extra }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Não foi possível concluir a solicitação.");
    error.status = response.status;
    throw error;
  }
  return data;
}

async function loadProducts() {
  catalogStatus.textContent = "Carregando produtos...";
  catalogStatus.classList.remove("is-error");

  try {
    const data = await api("list");
    if (!Array.isArray(data.products)) {
      throw new Error("A resposta do servidor não trouxe uma lista de produtos.");
    }
    products = data.products;
    renderProductList();
    catalogStatus.textContent = products.length
      ? "Os produtos abaixo estão cadastrados no seu cardápio."
      : "Ainda não há produtos cadastrados.";
    return true;
  } catch (error) {
    catalogStatus.textContent = `Não foi possível carregar os produtos: ${error.message}`;
    catalogStatus.classList.add("is-error");
    productList.innerHTML = `
      <div class="admin-empty-state">
        <strong>O catálogo não carregou.</strong>
        <p>Confira a conexão e as variáveis do Supabase no Netlify e tente novamente.</p>
        <button id="retryProductsBtn" class="secondary-btn" type="button">Tentar novamente</button>
      </div>
    `;
    productCount.textContent = "Indisponível";
    throw error;
  }
}

function getProductPriceSummary(product) {
  const prices = (Array.isArray(product.options) ? product.options : [])
    .map((option) => Number(option.price))
    .filter((price) => Number.isFinite(price));

  if (prices.length === 0) return "Preço não informado";
  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);
  return lowest === highest
    ? `A partir de ${currency.format(lowest)}`
    : `${currency.format(lowest)} – ${currency.format(highest)}`;
}

function renderProductList() {
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, "pt-BR"));
  categoryOptions.innerHTML = categories
    .map((category) => `<option value="${escapeHtml(category)}"></option>`)
    .join("");

  const query = productSearch.value.trim().toLocaleLowerCase("pt-BR");
  const visibleProducts = products.filter((product) =>
    `${product.name} ${product.category}`.toLocaleLowerCase("pt-BR").includes(query)
  );

  productCount.textContent = `${products.length} ${products.length === 1 ? "produto" : "produtos"}`;

  if (products.length === 0) {
    productList.innerHTML = `
      <div class="admin-empty-state">
        <span aria-hidden="true">🍽️</span>
        <strong>Seu cardápio está pronto para começar</strong>
        <p>Cadastre o primeiro produto usando o botão “Novo produto”.</p>
      </div>
    `;
    return;
  }

  if (visibleProducts.length === 0) {
    productList.innerHTML = `
      <div class="admin-empty-state">
        <strong>Nenhum produto encontrado</strong>
        <p>Tente buscar por outro nome ou categoria.</p>
      </div>
    `;
    return;
  }

  productList.innerHTML = visibleProducts.map((product) => {
    const options = Array.isArray(product.options) ? product.options : [];
    const imageUrl = product.image_url || product.image || "imgs/forja-systems.png";
    const optionSummary = options.slice(0, 2).map((option) => `
      <span>${escapeHtml(option.label)} <b>${currency.format(Number(option.price) || 0)}</b></span>
    `).join("");
    const moreOptions = options.length > 2
      ? `<small class="admin-more-options">+ ${options.length - 2} ${options.length - 2 === 1 ? "opção" : "opções"}</small>`
      : "";

    return `
      <article class="admin-product-card">
        <div class="admin-product-image-wrap">
          <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.name)}" loading="lazy" />
          <span class="admin-product-state${product.active ? "" : " is-inactive"}">
            ${product.active ? "Ativo" : "Inativo"}
          </span>
        </div>
        <div class="admin-product-content">
          <p class="admin-product-category">${escapeHtml(product.category)}</p>
          <h3>${escapeHtml(product.name)}</h3>
          <p class="admin-product-description">${escapeHtml(product.description || "Sem descrição.")}</p>
          <div class="admin-option-summary">${optionSummary}</div>
          ${moreOptions}
          <p class="admin-product-price">${getProductPriceSummary(product)}</p>
          <div class="admin-product-actions">
            <button type="button" class="secondary-btn" data-edit="${escapeHtml(product.id)}">Editar</button>
            <button type="button" class="admin-delete" data-delete="${escapeHtml(product.id)}">Excluir</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function setImagePreview(source) {
  if (source) {
    imagePreview.src = source;
    imagePreview.classList.remove("hidden");
    imagePlaceholder.classList.add("hidden");
  } else {
    imagePreview.removeAttribute("src");
    imagePreview.classList.add("hidden");
    imagePlaceholder.classList.remove("hidden");
  }
}

function addOptionRow(option = {}) {
  const row = document.createElement("div");
  row.className = "admin-option-row";
  row.innerHTML = `
    <div class="admin-field">
      <label>Nome da opção ou sabor</label>
      <input type="text" data-option-label value="${escapeHtml(option.label || "")}" placeholder="Ex.: Frango com queijo" required />
    </div>
    <div class="admin-field">
      <label>Preço (R$)</label>
      <input type="number" data-option-price min="0" step="0.01" value="${option.price ?? ""}" placeholder="0,00" required />
    </div>
    <button class="admin-remove-option" type="button" data-remove-option aria-label="Remover opção">×</button>
  `;
  optionsEditor.appendChild(row);
}

function readOptions() {
  const rows = [...optionsEditor.querySelectorAll(".admin-option-row")];
  if (rows.length === 0) throw new Error("Adicione pelo menos uma opção e seu preço.");

  return rows.map((row) => {
    const label = row.querySelector("[data-option-label]").value.trim();
    const priceValue = row.querySelector("[data-option-price]").value;
    const price = Number(priceValue);
    if (!label || priceValue === "" || !Number.isFinite(price) || price < 0) {
      throw new Error("Preencha o nome e um preço válido para cada opção.");
    }
    return { label, price };
  });
}

function resetForm() {
  productForm.reset();
  document.getElementById("productId").value = "";
  document.getElementById("productImageUrl").value = "";
  document.getElementById("productImage").value = "";
  document.getElementById("productActive").checked = true;
  document.getElementById("formTitle").textContent = "Novo produto";
  document.getElementById("saveProductBtn").textContent = "Salvar produto";
  optionsEditor.innerHTML = "";
  addOptionRow();
  setImagePreview("");
  setMessage("");
}

function openEditor() {
  editorPanel.classList.remove("hidden");
  editorPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeEditor() {
  editorPanel.classList.add("hidden");
  resetForm();
}

function editProduct(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;

  resetForm();
  document.getElementById("formTitle").textContent = "Editar produto";
  document.getElementById("saveProductBtn").textContent = "Salvar alterações";
  document.getElementById("productId").value = product.id;
  document.getElementById("productName").value = product.name || "";
  document.getElementById("productCategory").value = product.category || "";
  document.getElementById("productDescription").value = product.description || "";
  document.getElementById("productImageUrl").value = product.image_url || product.image || "";
  document.getElementById("productSort").value = product.sort_order ?? 0;
  document.getElementById("productActive").checked = product.active !== false;
  optionsEditor.innerHTML = "";
  (Array.isArray(product.options) && product.options.length ? product.options : [{}])
    .forEach(addOptionRow);
  setImagePreview(product.image_url || product.image || "");
  openEditor();
}

function slugify(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function createProductId(name) {
  const base = slugify(name);
  if (!base) throw new Error("Informe um nome válido para o produto.");
  let candidate = base;
  let suffix = 2;
  while (products.some((product) => product.id === candidate)) {
    candidate = `${base}-${suffix++}`;
  }
  return candidate;
}

async function showAdminPanel() {
  loginPanel.classList.add("hidden");
  adminPanel.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");
  try {
    await loadProducts();
  } catch (error) {
    if (error.status === 401) {
      token = "";
      sessionStorage.removeItem("forjaSystemsDemoAdminToken");
      adminPanel.classList.add("hidden");
      logoutBtn.classList.add("hidden");
      loginPanel.classList.remove("hidden");
      loginError.textContent = "Sua sessão expirou. Entre novamente.";
    }
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginError.textContent = "";
  const submitButton = loginForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    const result = await fetch("/.netlify/functions/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "login",
        username: document.getElementById("adminUser").value,
        password: document.getElementById("adminPassword").value,
      }),
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível entrar.");
      return data;
    });

    token = result.token;
    sessionStorage.setItem("forjaSystemsDemoAdminToken", token);
    await showAdminPanel();
  } catch (error) {
    loginError.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});

logoutBtn.addEventListener("click", () => {
  token = "";
  sessionStorage.removeItem("forjaSystemsDemoAdminToken");
  adminPanel.classList.add("hidden");
  logoutBtn.classList.add("hidden");
  loginPanel.classList.remove("hidden");
  loginForm.reset();
  loginError.textContent = "";
});

document.getElementById("newProductBtn").addEventListener("click", () => {
  resetForm();
  openEditor();
});

document.getElementById("closeEditorBtn").addEventListener("click", closeEditor);
document.getElementById("cancelEditorBtn").addEventListener("click", closeEditor);
document.getElementById("addOptionBtn").addEventListener("click", () => addOptionRow());

optionsEditor.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-option]");
  if (!removeButton) return;
  if (optionsEditor.querySelectorAll(".admin-option-row").length === 1) {
    setMessage("O produto precisa ter pelo menos uma opção.", true);
    return;
  }
  removeButton.closest(".admin-option-row").remove();
  setMessage("");
});

productSearch.addEventListener("input", renderProductList);

document.getElementById("productImage").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    setMessage("A foto deve ter no máximo 5 MB.", true);
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => setImagePreview(reader.result);
  reader.onerror = () => setMessage("Não foi possível abrir essa imagem.", true);
  reader.readAsDataURL(file);
});

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const saveButton = document.getElementById("saveProductBtn");
  saveButton.disabled = true;
  setMessage("Salvando produto...");

  try {
    const name = document.getElementById("productName").value.trim();
    const enteredCategory = document.getElementById("productCategory").value.trim();
    const existingId = document.getElementById("productId").value;
    if (!enteredCategory) throw new Error("Informe a categoria do produto.");
    const matchingCategory = products.find((product) =>
      product.category.trim().toLocaleLowerCase("pt-BR") === enteredCategory.toLocaleLowerCase("pt-BR")
    )?.category;
    const category = matchingCategory || enteredCategory;
    const options = readOptions();
    let imageUrl = document.getElementById("productImageUrl").value;
    const imageFile = document.getElementById("productImage").files[0];

    if (imageFile) {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
        reader.readAsDataURL(imageFile);
      });
      imageUrl = (await api("upload", { dataUrl })).url;
    }

    const previousProduct = products.find((product) => product.id === existingId);
    const product = {
      id: existingId || createProductId(name),
      name,
      category,
      description: document.getElementById("productDescription").value.trim(),
      options,
      image_url: imageUrl,
      gallery: previousProduct?.gallery || [],
      active: document.getElementById("productActive").checked,
      sort_order: Number(document.getElementById("productSort").value || 0),
    };

    await api("upsert", { product });
    document.getElementById("productImage").value = "";
    await loadProducts();
    closeEditor();
    catalogStatus.textContent = "Produto salvo e cardápio atualizado.";
  } catch (error) {
    setMessage(error.message, true);
  } finally {
    saveButton.disabled = false;
  }
});

productList.addEventListener("click", async (event) => {
  const retryButton = event.target.closest("#retryProductsBtn");
  if (retryButton) {
    try {
      await loadProducts();
    } catch {
      // loadProducts displays the actionable error in the catalog.
    }
    return;
  }

  const editButton = event.target.closest("[data-edit]");
  if (editButton) {
    editProduct(editButton.dataset.edit);
    return;
  }

  const deleteButton = event.target.closest("[data-delete]");
  if (!deleteButton) return;
  const product = products.find((item) => item.id === deleteButton.dataset.delete);
  if (!product || !window.confirm(`Excluir "${product.name}" do cardápio?`)) return;

  deleteButton.disabled = true;
  try {
    await api("delete", { id: product.id });
    await loadProducts();
    setMessage("Produto excluído.");
    if (document.getElementById("productId").value === product.id) closeEditor();
  } catch (error) {
    catalogStatus.textContent = `Não foi possível excluir o produto: ${error.message}`;
    catalogStatus.classList.add("is-error");
  }
});

if (token) {
  showAdminPanel();
}
