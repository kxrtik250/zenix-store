document.addEventListener("DOMContentLoaded", () => {
  const grid = Zenix.byId("productsGrid");
  if (!grid) return;

  const searchInput = Zenix.byId("searchInput");
  const sortSelect = Zenix.byId("sortSelect");
  const priceFilter = Zenix.byId("priceFilter");
  const categoryFilters = Zenix.byId("categoryFilters");
  const resetButton = Zenix.byId("resetFilters");
  const productCount = Zenix.byId("productCount");
  const activeFilters = Zenix.byId("activeFilters");
  const params = new URLSearchParams(location.search);

  const state = {
    category: params.get("category") || "all",
    query: "",
    price: "all",
    sort: "featured"
  };

  function renderCategoryFilters() {
    categoryFilters.replaceChildren();
    Zenix.categories().forEach((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `chip${state.category === category.id ? " active" : ""}`;
      button.textContent = category.label;
      button.setAttribute("aria-pressed", String(state.category === category.id));
      button.addEventListener("click", () => {
        state.category = category.id;
        render();
      });
      categoryFilters.appendChild(button);
    });
  }

  function inPriceRange(product) {
    if (state.price === "0-5000") return product.price <= 5000;
    if (state.price === "5000-20000") return product.price > 5000 && product.price <= 20000;
    if (state.price === "20000-80000") return product.price > 20000 && product.price <= 80000;
    if (state.price === "80000+") return product.price > 80000;
    return true;
  }

  function filteredProducts() {
    const query = state.query.trim().toLowerCase();
    const next = Zenix.products().filter((product) => {
      const matchesCategory = state.category === "all" || product.category === state.category;
      const matchesPrice = inPriceRange(product);
      const searchText = `${product.name} ${product.desc} ${Zenix.categoryLabel(product.category)}`.toLowerCase();
      const matchesQuery = !query || searchText.includes(query);
      return matchesCategory && matchesPrice && matchesQuery;
    });

    if (state.sort === "priceLow") next.sort((a, b) => a.price - b.price);
    if (state.sort === "priceHigh") next.sort((a, b) => b.price - a.price);
    if (state.sort === "nameAZ") next.sort((a, b) => a.name.localeCompare(b.name));
    if (state.sort === "rating") next.sort((a, b) => b.rating - a.rating);
    return next;
  }

  function describeFilters(count) {
    const parts = [];
    if (state.category !== "all") parts.push(Zenix.categoryLabel(state.category));
    if (state.price !== "all") parts.push(priceFilter.options[priceFilter.selectedIndex].textContent);
    if (state.query) parts.push(`search "${state.query}"`);
    activeFilters.textContent = parts.length ? `Showing ${count} results for ${parts.join(", ")}` : "Showing all products";
  }

  function updateUrl() {
    const nextParams = new URLSearchParams();
    if (state.category !== "all") nextParams.set("category", state.category);
    const query = nextParams.toString();
    history.replaceState(null, "", query ? `products.html?${query}` : "products.html");
  }

  function render() {
    const list = filteredProducts();
    grid.replaceChildren();
    renderCategoryFilters();
    productCount.textContent = `${list.length} product${list.length === 1 ? "" : "s"}`;
    describeFilters(list.length);
    updateUrl();

    if (!list.length) {
      grid.appendChild(Zenix.emptyState("No products found", "Try a different search, category, or price range.", {
        href: "products.html",
        label: "Reset catalog"
      }));
      return;
    }

    list.forEach((product) => grid.appendChild(Zenix.productCard(product)));
  }

  searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    render();
  });

  sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    render();
  });

  priceFilter.addEventListener("change", (event) => {
    state.price = event.target.value;
    render();
  });

  resetButton.addEventListener("click", () => {
    state.category = "all";
    state.query = "";
    state.price = "all";
    state.sort = "featured";
    searchInput.value = "";
    priceFilter.value = "all";
    sortSelect.value = "featured";
    render();
  });

  render();
});
