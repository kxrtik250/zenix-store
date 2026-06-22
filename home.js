document.addEventListener("DOMContentLoaded", () => {
  const categoryMount = Zenix.byId("homeCategories");
  const featuredMount = Zenix.byId("featuredProducts");
  const newsletterForm = Zenix.byId("newsletterForm");

  if (categoryMount) {
    const counts = Zenix.products().reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {});

    Zenix.categories()
      .filter((category) => category.id !== "all")
      .forEach((category) => {
        const link = document.createElement("a");
        link.className = "category-tile";
        link.href = `products.html?category=${encodeURIComponent(category.id)}`;
        const title = document.createElement("strong");
        title.textContent = category.label;
        const count = document.createElement("span");
        count.textContent = `${counts[category.id] || 0} products`;
        link.append(title, count);
        categoryMount.appendChild(link);
      });
  }

  if (featuredMount) {
    Zenix.products()
      .slice()
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4)
      .forEach((product) => featuredMount.appendChild(Zenix.productCard(product, { compact: true })));
  }

  newsletterForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    Zenix.clearFormErrors(newsletterForm);
    const email = Zenix.byId("newsletterEmail");
    if (!Zenix.validateEmail(email.value)) {
      Zenix.setFieldError(email, "Enter a valid email address.");
      return;
    }
    const list = Zenix.read(Zenix.keys.newsletter, []);
    const normalized = email.value.trim().toLowerCase();
    if (!list.includes(normalized)) {
      list.push(normalized);
      Zenix.write(Zenix.keys.newsletter, list);
    }
    newsletterForm.reset();
    Zenix.toast("You are subscribed to Zenix updates.");
  });
});
