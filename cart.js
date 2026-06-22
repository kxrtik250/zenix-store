document.addEventListener("DOMContentLoaded", () => {
  const cartItems = Zenix.byId("cartItems");
  const summary = Zenix.byId("cartSummary");
  const clearButton = Zenix.byId("clearCartBtn");
  const checkoutLink = Zenix.byId("checkoutLink");
  const couponInput = Zenix.byId("cartCoupon");
  const couponMessage = Zenix.byId("couponMessage");

  function summaryRow(label, value, total) {
    const row = document.createElement("div");
    row.className = `summary-row${total ? " total" : ""}`;
    const left = document.createElement("span");
    left.textContent = label;
    const right = document.createElement(total ? "strong" : "span");
    right.textContent = value;
    row.append(left, right);
    return row;
  }

  function renderSummary(totals) {
    summary.replaceChildren(
      summaryRow("Subtotal", Zenix.money(totals.subtotal)),
      summaryRow("GST", Zenix.money(totals.tax)),
      summaryRow("Shipping", totals.shipping ? Zenix.money(totals.shipping) : "Free"),
      summaryRow("Discount", `-${Zenix.money(totals.discount)}`),
      summaryRow("Total", Zenix.money(totals.total), true)
    );

    couponMessage.textContent = totals.coupon.message;
    couponMessage.classList.toggle("is-success", totals.coupon.valid && Boolean(totals.coupon.message));
  }

  function renderItem(item) {
    const card = document.createElement("article");
    card.className = "cart-item";
    card.appendChild(Zenix.image(item.image, item.name));

    const info = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = item.name;
    const meta = document.createElement("p");
    meta.textContent = `${Zenix.money(item.price)} each / ${item.stock} available`;

    const quantity = document.createElement("div");
    quantity.className = "quantity";
    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "-";
    minus.setAttribute("aria-label", `Decrease ${item.name}`);
    const qty = document.createElement("span");
    qty.textContent = String(item.qty);
    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.setAttribute("aria-label", `Increase ${item.name}`);

    minus.addEventListener("click", () => {
      if (item.qty <= 1) Zenix.removeCartItem(item.id);
      else Zenix.updateCartItem(item.id, item.qty - 1);
      render();
    });
    plus.addEventListener("click", () => {
      Zenix.updateCartItem(item.id, item.qty + 1);
      render();
    });

    quantity.append(minus, qty, plus);
    info.append(title, meta, quantity);

    const totals = document.createElement("div");
    totals.className = "cart-line-total";
    const lineTotal = document.createElement("strong");
    lineTotal.textContent = Zenix.money(item.lineTotal);
    const remove = document.createElement("button");
    remove.className = "text-button";
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      Zenix.removeCartItem(item.id);
      Zenix.toast(`${item.name} removed from cart.`);
      render();
    });
    totals.append(lineTotal, remove);

    card.append(info, totals);
    return card;
  }

  function render() {
    const totals = Zenix.calculateTotals(Zenix.getCart(), couponInput.value);
    cartItems.replaceChildren();
    renderSummary(totals);

    const isEmpty = totals.lines.length === 0;
    checkoutLink.classList.toggle("hidden", isEmpty);
    clearButton.disabled = isEmpty;

    if (isEmpty) {
      cartItems.appendChild(Zenix.emptyState("Your cart is empty", "Add a product to start building your order.", {
        href: "products.html",
        label: "Browse products"
      }));
      return;
    }

    totals.lines.forEach((item) => cartItems.appendChild(renderItem(item)));
  }

  couponInput.addEventListener("input", render);
  clearButton.addEventListener("click", () => {
    Zenix.clearCart();
    Zenix.toast("Cart cleared.");
    render();
  });

  render();
});
