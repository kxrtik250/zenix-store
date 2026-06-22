document.addEventListener("DOMContentLoaded", () => {
  const user = Zenix.requireAuth();
  if (!user) return;

  const form = Zenix.byId("checkoutForm");
  const summary = Zenix.byId("checkoutSummary");
  const couponInput = Zenix.byId("couponInput");
  const couponMsg = Zenix.byId("couponMsg");
  const paymentMethod = Zenix.byId("paymentMethod");
  const cardField = Zenix.byId("cardField");

  function fillProfile() {
    Zenix.byId("name").value = user.name || "";
    Zenix.byId("email").value = user.email || "";
    Zenix.byId("phone").value = user.phone || "";
    Zenix.byId("city").value = user.city || "";
    Zenix.byId("address").value = user.address || "";
    Zenix.byId("pincode").value = user.pincode || "";
  }

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

  function renderSummary() {
    const totals = Zenix.calculateTotals(Zenix.getCart(), couponInput.value);
    summary.replaceChildren(
      summaryRow("Items", String(totals.lines.reduce((sum, item) => sum + item.qty, 0))),
      summaryRow("Subtotal", Zenix.money(totals.subtotal)),
      summaryRow("GST", Zenix.money(totals.tax)),
      summaryRow("Shipping", totals.shipping ? Zenix.money(totals.shipping) : "Free"),
      summaryRow("Discount", `-${Zenix.money(totals.discount)}`),
      summaryRow("Total", Zenix.money(totals.total), true)
    );
    couponMsg.textContent = totals.coupon.message;
    couponMsg.classList.toggle("is-success", totals.coupon.valid && Boolean(totals.coupon.message));
    return totals;
  }

  function setError(id, message) {
    Zenix.setFieldError(Zenix.byId(id), message);
  }

  function validate() {
    Zenix.clearFormErrors(form);
    let ok = true;
    const values = {
      name: Zenix.byId("name").value.trim(),
      email: Zenix.byId("email").value.trim(),
      phone: Zenix.byId("phone").value.trim(),
      city: Zenix.byId("city").value.trim(),
      address: Zenix.byId("address").value.trim(),
      pincode: Zenix.byId("pincode").value.trim(),
      paymentMethod: paymentMethod.value,
      cardLast4: Zenix.byId("cardLast4").value.trim()
    };

    if (values.name.length < 2) {
      setError("name", "Enter your full name.");
      ok = false;
    }
    if (!Zenix.validateEmail(values.email)) {
      setError("email", "Enter a valid email address.");
      ok = false;
    }
    if (!Zenix.validatePhone(values.phone)) {
      setError("phone", "Enter a valid phone number.");
      ok = false;
    }
    if (values.city.length < 2) {
      setError("city", "Enter your city.");
      ok = false;
    }
    if (values.address.length < 8) {
      setError("address", "Enter a complete delivery address.");
      ok = false;
    }
    if (!/^[1-9][0-9]{5}$/.test(values.pincode)) {
      setError("pincode", "Enter a valid 6 digit PIN code.");
      ok = false;
    }
    if (values.paymentMethod === "card" && !/^[0-9]{4}$/.test(values.cardLast4)) {
      setError("cardLast4", "Enter the last 4 digits only.");
      ok = false;
    }
    return ok ? values : null;
  }

  function togglePaymentFields() {
    cardField.classList.toggle("hidden", paymentMethod.value !== "card");
  }

  function disableForEmptyCart() {
    if (Zenix.getCart().length) return false;
    form.replaceChildren(Zenix.emptyState("Your cart is empty", "Add products before starting checkout.", {
      href: "products.html",
      label: "Browse products"
    }));
    return true;
  }

  fillProfile();
  togglePaymentFields();
  if (disableForEmptyCart()) {
    renderSummary();
    return;
  }
  renderSummary();

  couponInput.addEventListener("input", renderSummary);
  paymentMethod.addEventListener("change", togglePaymentFields);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = validate();
    const totals = renderSummary();

    if (!values) {
      Zenix.toast("Please fix the highlighted checkout fields.", "error");
      return;
    }
    if (!totals.lines.length) {
      Zenix.toast("Your cart is empty.", "error");
      return;
    }
    if (!totals.coupon.valid) {
      Zenix.toast(totals.coupon.message, "error");
      return;
    }

    Zenix.updateUserProfile({
      name: values.name,
      phone: values.phone,
      address: values.address,
      city: values.city,
      pincode: values.pincode
    });

    const order = Zenix.saveOrder({
      id: Zenix.uid("ZNX"),
      date: new Date().toISOString(),
      status: "Confirmed",
      userId: user.id,
      customer: {
        name: values.name,
        email: values.email,
        phone: values.phone
      },
      shipping: {
        address: values.address,
        city: values.city,
        pincode: values.pincode
      },
      payment: {
        method: values.paymentMethod,
        last4: values.paymentMethod === "card" ? values.cardLast4 : ""
      },
      items: totals.lines,
      totals: {
        subtotal: totals.subtotal,
        tax: totals.tax,
        shipping: totals.shipping,
        discount: totals.discount,
        total: totals.total,
        coupon: totals.coupon.code
      }
    });

    Zenix.clearCart();
    Zenix.toast("Order placed successfully.");
    window.location.href = `invoice.html?order=${encodeURIComponent(order.id)}`;
  });
});
