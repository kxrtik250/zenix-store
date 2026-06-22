document.addEventListener("DOMContentLoaded", () => {
  const box = Zenix.byId("wishlistItems");
  if (!box) return;

  function render() {
    box.replaceChildren();
    const products = Zenix.getWishlist()
      .map((id) => Zenix.findProduct(id))
      .filter(Boolean);

    if (!products.length) {
      box.appendChild(Zenix.emptyState("Your wishlist is empty", "Save products you want to revisit later.", {
        href: "products.html",
        label: "Explore products"
      }));
      return;
    }

    products.forEach((product) => {
      const card = Zenix.productCard(product);
      card.querySelector(".button.ghost")?.addEventListener("click", () => {
        window.setTimeout(render, 0);
      });
      box.appendChild(card);
    });
  }

  render();
});
