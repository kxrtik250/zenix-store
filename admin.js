document.addEventListener("DOMContentLoaded", () => {
  const user = Zenix.requireAuth();
  if (!user) return;

  const mount = Zenix.byId("adminContent");

  if (user.role !== "admin") {
    mount.appendChild(Zenix.emptyState("Admin access required", "Your current account does not have operator permissions.", {
      href: "profile.html",
      label: "Back to profile"
    }));
    return;
  }

  const orders = Zenix.orders().sort((a, b) => new Date(b.date) - new Date(a.date));
  if (!orders.length) {
    mount.appendChild(Zenix.emptyState("No orders found", "Orders placed by customers will appear here.", {
      href: "products.html",
      label: "Open catalog"
    }));
    return;
  }

  const tableWrap = document.createElement("div");
  tableWrap.className = "table-wrap";
  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>Order</th>
        <th>Customer</th>
        <th>Items</th>
        <th>Total</th>
        <th>Status</th>
        <th>Date</th>
      </tr>
    </thead>
  `;
  const tbody = document.createElement("tbody");

  orders.forEach((order) => {
    const tr = document.createElement("tr");
    const cells = [
      order.id,
      `${order.customer.name || "-"}\n${order.customer.email || ""}`,
      order.items.map((item) => `${item.name} x ${item.qty}`).join(", "),
      Zenix.money(order.totals.total),
      order.status,
      new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.date))
    ];
    cells.forEach((value) => {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  tableWrap.appendChild(table);
  mount.appendChild(tableWrap);
});
