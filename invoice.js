document.addEventListener("DOMContentLoaded", () => {
  const mount = Zenix.byId("invoiceContent");
  const params = new URLSearchParams(location.search);
  const orderId = params.get("order") || Zenix.read(Zenix.keys.lastOrder, "");
  const order = Zenix.findOrder(orderId);

  function formatDate(value) {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  }

  function row(label, value, total) {
    const item = document.createElement("div");
    item.className = `summary-row${total ? " total" : ""}`;
    const left = document.createElement("span");
    left.textContent = label;
    const right = document.createElement(total ? "strong" : "span");
    right.textContent = value;
    item.append(left, right);
    return item;
  }

  if (!order) {
    mount.appendChild(Zenix.emptyState("Invoice not found", "The invoice link is invalid or the order was removed.", {
      href: "orders.html",
      label: "View orders"
    }));
    return;
  }

  document.title = `${order.id} Invoice | Zenix Store`;

  const head = document.createElement("div");
  head.className = "invoice-head";
  head.innerHTML = `
    <div>
      <p class="eyebrow">Invoice</p>
      <h1>Zenix Store</h1>
      <p class="helper-text">Order ${Zenix.escapeHtml(order.id)} / ${formatDate(order.date)}</p>
    </div>
    <div class="page-actions">
      <button class="button primary" type="button" id="printInvoice">Print</button>
      <a class="button ghost" href="orders.html">Orders</a>
    </div>
  `;

  const details = document.createElement("div");
  details.className = "summary-list";
  details.append(
    row("Customer", order.customer.name || "-"),
    row("Email", order.customer.email || "-"),
    row("Phone", order.customer.phone || "-"),
    row("Ship to", `${order.shipping.address || "-"}, ${order.shipping.city || ""} ${order.shipping.pincode || ""}`.trim()),
    row("Payment", order.payment.last4 ? `${order.payment.method} ending ${order.payment.last4}` : order.payment.method)
  );

  const tableWrap = document.createElement("div");
  tableWrap.className = "table-wrap";
  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>Item</th>
        <th>Price</th>
        <th>Qty</th>
        <th>Total</th>
      </tr>
    </thead>
  `;
  const tbody = document.createElement("tbody");
  order.items.forEach((item) => {
    const tr = document.createElement("tr");
    [item.name, Zenix.money(item.price), String(item.qty), Zenix.money(item.lineTotal)].forEach((value) => {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  tableWrap.appendChild(table);

  const totals = document.createElement("div");
  totals.className = "summary-list";
  totals.append(
    row("Subtotal", Zenix.money(order.totals.subtotal)),
    row("GST", Zenix.money(order.totals.tax)),
    row("Shipping", order.totals.shipping ? Zenix.money(order.totals.shipping) : "Free"),
    row("Discount", `-${Zenix.money(order.totals.discount)}`),
    row("Grand total", Zenix.money(order.totals.total), true)
  );

  mount.append(head, details, tableWrap, totals);
  Zenix.byId("printInvoice")?.addEventListener("click", () => window.print());
});
