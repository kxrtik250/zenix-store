document.addEventListener("DOMContentLoaded", () => {
  const user = Zenix.requireAuth();
  if (!user) return;

  const box = Zenix.byId("orderHistory");
  const orders = Zenix.ordersForCurrentUser().sort((a, b) => new Date(b.date) - new Date(a.date));

  function formatDate(value) {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  }

  if (!orders.length) {
    box.appendChild(Zenix.emptyState("No orders yet", "Your completed checkout orders will appear here.", {
      href: "products.html",
      label: "Start shopping"
    }));
    return;
  }

  orders.forEach((order) => {
    const card = document.createElement("article");
    card.className = "order-card";

    const header = document.createElement("header");
    const titleWrap = document.createElement("div");
    const id = document.createElement("h2");
    id.textContent = order.id;
    const date = document.createElement("p");
    date.className = "helper-text";
    date.textContent = formatDate(order.date);
    titleWrap.append(id, date);
    const status = document.createElement("span");
    status.className = "status";
    status.textContent = order.status;
    header.append(titleWrap, status);

    const items = document.createElement("ul");
    items.className = "order-items";
    order.items.forEach((item) => {
      const li = document.createElement("li");
      const name = document.createElement("span");
      name.textContent = `${item.name} x ${item.qty}`;
      const total = document.createElement("strong");
      total.textContent = Zenix.money(item.lineTotal);
      li.append(name, total);
      items.appendChild(li);
    });

    const footer = document.createElement("footer");
    const total = document.createElement("strong");
    total.textContent = `Total ${Zenix.money(order.totals.total)}`;
    const invoice = document.createElement("a");
    invoice.className = "button ghost";
    invoice.href = `invoice.html?order=${encodeURIComponent(order.id)}`;
    invoice.textContent = "View invoice";
    footer.append(total, invoice);

    card.append(header, items, footer);
    box.appendChild(card);
  });
});
