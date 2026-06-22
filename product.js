document.addEventListener("DOMContentLoaded", () => {
  const mount = Zenix.byId("productDetail");
  const related = Zenix.byId("relatedProducts");
  const productId = new URLSearchParams(location.search).get("id");
  const product = Zenix.findProduct(productId);

  if (!mount) return;

  if (!product) {
    mount.appendChild(Zenix.emptyState("Product not found", "The selected product is unavailable or the link is incomplete.", {
      href: "products.html",
      label: "Browse products"
    }));
    if (related) related.closest(".section")?.classList.add("hidden");
    return;
  }

  document.title = `${product.name} | Zenix Store`;

  const wrapper = document.createElement("div");
  wrapper.className = "product-detail";

  const media = document.createElement("div");
  media.className = "detail-media";
  media.appendChild(Zenix.image(product.image, product.name));

  const copy = document.createElement("div");
  copy.className = "detail-copy";
  copy.innerHTML = `
    <p class="eyebrow">${Zenix.escapeHtml(Zenix.categoryLabel(product.category))}</p>
    <h1>${Zenix.escapeHtml(product.name)}</h1>
    <div class="price-row"><strong>${Zenix.money(product.price)}</strong><span>${Zenix.money(product.oldPrice)}</span></div>
    <p>${Zenix.escapeHtml(product.desc)}</p>
    <p class="helper-text">${product.rating.toFixed(1)} rating from ${product.reviews} reviews / ${product.stock} in stock</p>
  `;

  const list = document.createElement("ul");
  list.className = "feature-list";
  product.features.forEach((feature) => {
    const item = document.createElement("li");
    item.textContent = feature;
    list.appendChild(item);
  });

  const controls = document.createElement("div");
  controls.className = "cart-actions";

  const quantity = document.createElement("div");
  quantity.className = "quantity";
  quantity.innerHTML = `<button type="button" aria-label="Decrease quantity">-</button><span>1</span><button type="button" aria-label="Increase quantity">+</button>`;
  const qtyValue = quantity.querySelector("span");
  const qtyButtons = quantity.querySelectorAll("button");
  qtyButtons[0].addEventListener("click", () => {
    qtyValue.textContent = String(Math.max(1, Number(qtyValue.textContent) - 1));
  });
  qtyButtons[1].addEventListener("click", () => {
    qtyValue.textContent = String(Math.min(product.stock, Number(qtyValue.textContent) + 1));
  });

  const addButton = document.createElement("button");
  addButton.className = "button primary";
  addButton.type = "button";
  addButton.textContent = "Add to cart";
  addButton.addEventListener("click", () => Zenix.addToCart(product.id, Number(qtyValue.textContent)));

  const saveButton = document.createElement("button");
  saveButton.className = `button ghost${Zenix.isWishlisted(product.id) ? " is-active" : ""}`;
  saveButton.type = "button";
  saveButton.textContent = Zenix.isWishlisted(product.id) ? "Saved" : "Save";
  saveButton.addEventListener("click", () => {
    const active = Zenix.toggleWishlist(product.id);
    saveButton.classList.toggle("is-active", active);
    saveButton.textContent = active ? "Saved" : "Save";
  });

  controls.append(quantity, addButton, saveButton);
  copy.append(list, controls);
  wrapper.append(media, copy);
  mount.appendChild(wrapper);

  if (related) {
    Zenix.products()
      .filter((item) => item.category === product.category && item.id !== product.id)
      .slice(0, 4)
      .forEach((item) => related.appendChild(Zenix.productCard(item, { compact: true })));
  }
});
