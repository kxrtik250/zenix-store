(function () {
  "use strict";

  const keys = {
    cart: "zenix.cart",
    wishlist: "zenix.wishlist",
    orders: "zenix.orders",
    users: "zenix.users",
    session: "zenix.session",
    theme: "zenix.theme",
    contacts: "zenix.contacts",
    newsletter: "zenix.newsletter",
    lastOrder: "zenix.lastOrder"
  };

  const products = () => window.ZENIX_PRODUCTS || [];
  const categories = () => window.ZENIX_CATEGORIES || [];
  const coupons = () => window.ZENIX_COUPONS || {};
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  });

  function safeJson(value, fallback) {
    try {
      const parsed = JSON.parse(value);
      return parsed == null ? fallback : parsed;
    } catch (error) {
      return fallback;
    }
  }

  function read(key, fallback) {
    try {
      return safeJson(localStorage.getItem(key), fallback);
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      toast("Storage is unavailable in this browser session.", "error");
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      return null;
    }
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function money(value) {
    return formatter.format(Number(value) || 0);
  }

  function clampQty(value, max) {
    const qty = Math.max(1, Number.parseInt(value, 10) || 1);
    return Math.min(qty, max || 99);
  }

  function uid(prefix) {
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${random}`;
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function slugFor(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function findProduct(productId) {
    return products().find((product) => product.id === productId);
  }

  function productFromLegacyName(name) {
    const target = String(name || "").trim().toLowerCase();
    return products().find((product) => product.name.toLowerCase() === target);
  }

  function migrateLegacyStorage() {
    const cartExists = localStorage.getItem(keys.cart);
    const oldCart = read("cart", null);
    if (!cartExists && Array.isArray(oldCart)) {
      const nextCart = oldCart
        .map((item) => {
          const product = productFromLegacyName(item.name);
          return product ? { id: product.id, qty: clampQty(item.qty, product.stock) } : null;
        })
        .filter(Boolean);
      write(keys.cart, nextCart);
    }

    const wishlistExists = localStorage.getItem(keys.wishlist);
    const oldWishlist = read("wishlist", null);
    if (!wishlistExists && Array.isArray(oldWishlist)) {
      const nextWishlist = oldWishlist
        .map((item) => productFromLegacyName(item.name)?.id)
        .filter(Boolean);
      write(keys.wishlist, Array.from(new Set(nextWishlist)));
    }

    const ordersExists = localStorage.getItem(keys.orders);
    const oldOrders = read("orders", null);
    if (!ordersExists && Array.isArray(oldOrders)) {
      const nextOrders = oldOrders.map((order) => {
        const items = Array.isArray(order.items)
          ? order.items
              .map((item) => {
                const product = productFromLegacyName(item.name);
                if (!product) return null;
                const qty = clampQty(item.qty, product.stock);
                return {
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: product.image,
                  qty,
                  lineTotal: product.price * qty
                };
              })
              .filter(Boolean)
          : [];
        return {
          id: order.orderId || uid("ZNX"),
          date: order.date || new Date().toISOString(),
          status: order.status || "Confirmed",
          userId: null,
          customer: order.customer || {},
          shipping: order.customer || {},
          payment: { method: "Legacy", last4: "" },
          items,
          totals: {
            subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
            tax: 0,
            shipping: 0,
            discount: 0,
            total: Number(order.total) || 0
          }
        };
      });
      write(keys.orders, nextOrders);
    }

    const oldTheme = localStorage.getItem("theme");
    if (!localStorage.getItem(keys.theme) && oldTheme) {
      localStorage.setItem(keys.theme, oldTheme === "dark" ? "dark" : "light");
    }
  }

  function getCart() {
    const rawCart = read(keys.cart, []);
    if (!Array.isArray(rawCart)) return [];
    return rawCart
      .map((item) => {
        const product = findProduct(item.id);
        return product ? { id: product.id, qty: clampQty(item.qty, product.stock) } : null;
      })
      .filter(Boolean);
  }

  function setCart(cart) {
    write(keys.cart, cart);
    refreshHeaderCounts();
  }

  function addToCart(productId, qty) {
    const product = findProduct(productId);
    if (!product) return false;
    const cart = getCart();
    const existing = cart.find((item) => item.id === productId);
    if (existing) {
      existing.qty = clampQty(existing.qty + (Number(qty) || 1), product.stock);
    } else {
      cart.push({ id: productId, qty: clampQty(qty || 1, product.stock) });
    }
    setCart(cart);
    toast(`${product.name} added to cart.`);
    return true;
  }

  function updateCartItem(productId, qty) {
    const product = findProduct(productId);
    if (!product) return;
    const next = getCart()
      .map((item) => (item.id === productId ? { id: item.id, qty: clampQty(qty, product.stock) } : item))
      .filter((item) => item.qty > 0);
    setCart(next);
  }

  function removeCartItem(productId) {
    setCart(getCart().filter((item) => item.id !== productId));
  }

  function clearCart() {
    setCart([]);
  }

  function getWishlist() {
    const rawWishlist = read(keys.wishlist, []);
    if (!Array.isArray(rawWishlist)) return [];
    return rawWishlist.filter((id) => Boolean(findProduct(id)));
  }

  function setWishlist(wishlist) {
    write(keys.wishlist, Array.from(new Set(wishlist)));
    refreshHeaderCounts();
  }

  function isWishlisted(productId) {
    return getWishlist().includes(productId);
  }

  function toggleWishlist(productId) {
    const product = findProduct(productId);
    if (!product) return false;
    const wishlist = getWishlist();
    const exists = wishlist.includes(productId);
    const next = exists ? wishlist.filter((id) => id !== productId) : wishlist.concat(productId);
    setWishlist(next);
    toast(exists ? `${product.name} removed from wishlist.` : `${product.name} saved to wishlist.`);
    return !exists;
  }

  function cartLines(cart) {
    return cart
      .map((item) => {
        const product = findProduct(item.id);
        if (!product) return null;
        const qty = clampQty(item.qty, product.stock);
        return {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category,
          qty,
          stock: product.stock,
          lineTotal: product.price * qty
        };
      })
      .filter(Boolean);
  }

  function couponDiscount(subtotal, couponCode) {
    const code = String(couponCode || "").trim().toUpperCase();
    if (!code) {
      return { code: "", discount: 0, valid: true, message: "" };
    }
    const coupon = coupons()[code];
    if (!coupon) {
      return { code, discount: 0, valid: false, message: "Coupon code is not valid." };
    }
    if (subtotal < coupon.min) {
      return {
        code,
        discount: 0,
        valid: false,
        message: `${code} applies on orders above ${money(coupon.min)}.`
      };
    }
    const discount = coupon.type === "percent"
      ? Math.round((subtotal * coupon.value) / 100)
      : Math.min(coupon.value, subtotal);
    return { code, discount, valid: true, message: `${coupon.label} applied.` };
  }

  function calculateTotals(cart, couponCode) {
    const lines = cartLines(cart);
    const subtotal = lines.reduce((sum, item) => sum + item.lineTotal, 0);
    const coupon = couponDiscount(subtotal, couponCode);
    const tax = subtotal ? Math.round(subtotal * 0.18) : 0;
    const shipping = subtotal === 0 || subtotal >= 5000 ? 0 : 199;
    const total = Math.max(0, subtotal + tax + shipping - coupon.discount);
    return {
      lines,
      subtotal,
      tax,
      shipping,
      discount: coupon.discount,
      total,
      coupon
    };
  }

  function readUsers() {
    const users = read(keys.users, []);
    return Array.isArray(users) ? users : [];
  }

  function writeUsers(users) {
    write(keys.users, users);
  }

  function hashPassword(password, salt) {
    const input = `${salt}:${password}`;
    let hash = 2166136261;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(16);
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
  }

  function validatePhone(phone) {
    return /^[0-9+\-\s()]{7,18}$/.test(String(phone || "").trim());
  }

  function validatePassword(password) {
    return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(String(password || ""));
  }

  function currentUser() {
    const session = read(keys.session, null);
    if (!session || !session.userId) return null;
    return readUsers().find((user) => user.id === session.userId) || null;
  }

  function setSession(userId) {
    write(keys.session, { userId, signedInAt: new Date().toISOString() });
    renderHeader();
    refreshHeaderCounts();
  }

  function registerUser(payload) {
    const name = String(payload.name || "").trim();
    const email = normalizeEmail(payload.email);
    const password = String(payload.password || "");
    if (name.length < 2) return { ok: false, message: "Enter your full name." };
    if (!validateEmail(email)) return { ok: false, message: "Enter a valid email address." };
    if (!validatePassword(password)) {
      return { ok: false, message: "Use at least 8 characters with a letter and a number." };
    }
    const users = readUsers();
    if (users.some((user) => user.email === email)) {
      return { ok: false, message: "An account with this email already exists." };
    }
    const salt = uid("SALT");
    const user = {
      id: uid("USR"),
      role: email === "admin@zenix.store" ? "admin" : "customer",
      name,
      email,
      phone: "",
      address: "",
      city: "",
      pincode: "",
      createdAt: new Date().toISOString(),
      salt,
      passwordHash: hashPassword(password, salt)
    };
    users.push(user);
    writeUsers(users);
    setSession(user.id);
    return { ok: true, user };
  }

  function loginUser(emailValue, password) {
    const email = normalizeEmail(emailValue);
    const user = readUsers().find((item) => item.email === email);
    if (!user || user.passwordHash !== hashPassword(password, user.salt)) {
      return { ok: false, message: "Email or password is incorrect." };
    }
    setSession(user.id);
    return { ok: true, user };
  }

  function logout() {
    remove(keys.session);
    renderHeader();
    refreshHeaderCounts();
  }

  function updateUserProfile(patch) {
    const user = currentUser();
    if (!user) return { ok: false, message: "Please sign in first." };
    const users = readUsers();
    const index = users.findIndex((item) => item.id === user.id);
    if (index < 0) return { ok: false, message: "User account was not found." };
    const next = {
      ...users[index],
      name: String(patch.name || "").trim(),
      phone: String(patch.phone || "").trim(),
      address: String(patch.address || "").trim(),
      city: String(patch.city || "").trim(),
      pincode: String(patch.pincode || "").trim()
    };
    if (next.name.length < 2) return { ok: false, message: "Enter your full name." };
    if (next.phone && !validatePhone(next.phone)) return { ok: false, message: "Enter a valid phone number." };
    users[index] = next;
    writeUsers(users);
    renderHeader();
    refreshHeaderCounts();
    return { ok: true, user: next };
  }

  function changePassword(currentPassword, nextPassword) {
    const user = currentUser();
    if (!user) return { ok: false, message: "Please sign in first." };
    if (user.passwordHash !== hashPassword(currentPassword, user.salt)) {
      return { ok: false, message: "Current password is incorrect." };
    }
    if (!validatePassword(nextPassword)) {
      return { ok: false, message: "Use at least 8 characters with a letter and a number." };
    }
    const users = readUsers();
    const index = users.findIndex((item) => item.id === user.id);
    users[index] = {
      ...users[index],
      passwordHash: hashPassword(nextPassword, user.salt),
      passwordUpdatedAt: new Date().toISOString()
    };
    writeUsers(users);
    return { ok: true };
  }

  function resetPassword(emailValue, nextPassword) {
    const email = normalizeEmail(emailValue);
    if (!validateEmail(email)) return { ok: false, message: "Enter a valid email address." };
    if (!validatePassword(nextPassword)) {
      return { ok: false, message: "Use at least 8 characters with a letter and a number." };
    }
    const users = readUsers();
    const index = users.findIndex((user) => user.email === email);
    if (index < 0) return { ok: false, message: "No account exists for that email." };
    users[index] = {
      ...users[index],
      passwordHash: hashPassword(nextPassword, users[index].salt),
      passwordUpdatedAt: new Date().toISOString()
    };
    writeUsers(users);
    return { ok: true };
  }

  function requireAuth() {
    const user = currentUser();
    if (user) return user;
    const target = encodeURIComponent(location.pathname.split("/").pop() + location.search);
    location.href = `login.html?redirect=${target}`;
    return null;
  }

  function orders() {
    const allOrders = read(keys.orders, []);
    return Array.isArray(allOrders) ? allOrders : [];
  }

  function saveOrder(order) {
    const allOrders = orders();
    allOrders.push(order);
    write(keys.orders, allOrders);
    write(keys.lastOrder, order.id);
    return order;
  }

  function findOrder(orderId) {
    return orders().find((order) => order.id === orderId);
  }

  function ordersForCurrentUser() {
    const user = currentUser();
    if (!user) return [];
    return orders().filter((order) => order.userId === user.id || normalizeEmail(order.customer?.email) === user.email);
  }

  function toast(message, type) {
    let region = byId("toastRegion");
    if (!region) {
      region = document.createElement("div");
      region.id = "toastRegion";
      region.className = "toast-region";
      region.setAttribute("aria-live", "polite");
      region.setAttribute("aria-atomic", "true");
      document.body.appendChild(region);
    }
    const item = document.createElement("div");
    item.className = `toast ${type === "error" ? "toast-error" : "toast-success"}`;
    item.textContent = message;
    region.appendChild(item);
    window.setTimeout(() => item.classList.add("is-visible"), 10);
    window.setTimeout(() => {
      item.classList.remove("is-visible");
      window.setTimeout(() => item.remove(), 180);
    }, 3200);
  }

  function setFieldError(field, message) {
    const wrapper = field.closest(".field");
    const error = wrapper ? wrapper.querySelector(".field-error") : null;
    field.setAttribute("aria-invalid", message ? "true" : "false");
    if (error) error.textContent = message || "";
  }

  function clearFormErrors(form) {
    form.querySelectorAll("[aria-invalid]").forEach((field) => field.removeAttribute("aria-invalid"));
    form.querySelectorAll(".field-error").forEach((error) => {
      error.textContent = "";
    });
  }

  function refreshHeaderCounts() {
    const cartCount = document.querySelector("[data-cart-count]");
    const wishCount = document.querySelector("[data-wishlist-count]");
    if (cartCount) {
      cartCount.textContent = String(getCart().reduce((sum, item) => sum + item.qty, 0));
    }
    if (wishCount) {
      wishCount.textContent = String(getWishlist().length);
    }
  }

  function activePage() {
    const page = document.body?.dataset.page;
    if (page) return page;
    const file = location.pathname.split("/").pop() || "index.html";
    return file.replace(".html", "") || "home";
  }

  function navLink(href, label, page) {
    const active = activePage() === page || (page === "products" && activePage() === "product");
    return `<a class="nav-link${active ? " active" : ""}" href="${href}">${label}</a>`;
  }

  function renderHeader() {
    const mount = byId("siteHeader");
    if (!mount) return;
    const user = currentUser();
    mount.innerHTML = `
      <header class="site-header">
        <a class="brand" href="index.html" aria-label="Zenix Store home">
          <span class="brand-mark">Z</span>
          <span>Zenix Store</span>
        </a>
        <button class="icon-button menu-toggle" type="button" aria-label="Open navigation" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
        <nav class="site-nav" aria-label="Primary navigation">
          ${navLink("products.html", "Products", "products")}
          ${navLink("wishlist.html", `Wishlist <span class="pill" data-wishlist-count>${getWishlist().length}</span>`, "wishlist")}
          ${navLink("orders.html", "Orders", "orders")}
          ${navLink("about.html", "About", "about")}
          ${navLink("contact.html", "Contact", "contact")}
        </nav>
        <div class="header-actions">
          <a class="cart-link" href="cart.html" aria-label="View cart">
            Cart <span class="pill" data-cart-count>${getCart().reduce((sum, item) => sum + item.qty, 0)}</span>
          </a>
          <button class="theme-toggle" type="button" aria-label="Toggle color theme" data-theme-toggle>Theme</button>
          ${
            user
              ? `<a class="account-link" href="profile.html">${escapeHtml(user.name.split(" ")[0] || "Profile")}</a>`
              : `<a class="account-link" href="login.html">Sign in</a>`
          }
        </div>
      </header>
    `;

    const toggle = mount.querySelector(".menu-toggle");
    const nav = mount.querySelector(".site-nav");
    toggle?.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      nav.classList.toggle("is-open", !expanded);
    });
    mount.querySelector("[data-theme-toggle]")?.addEventListener("click", toggleTheme);
  }

  function renderFooter() {
    const mount = byId("siteFooter");
    if (!mount) return;
    mount.innerHTML = `
      <footer class="site-footer">
        <div>
          <a class="brand footer-brand" href="index.html">
            <span class="brand-mark">Z</span>
            <span>Zenix Store</span>
          </a>
          <p>Curated tech, fashion, beauty, furniture, and home essentials with fast checkout.</p>
        </div>
        <div class="footer-links">
          <a href="products.html">Shop</a>
          <a href="profile.html">Profile</a>
          <a href="orders.html">Orders</a>
          <a href="admin.html">Admin</a>
        </div>
        <div class="footer-links">
          <a href="about.html">About</a>
          <a href="contact.html">Contact</a>
          <a href="404.html">404</a>
          <a href="500.html">500</a>
        </div>
      </footer>
    `;
  }

  function applyTheme() {
    const theme = localStorage.getItem(keys.theme) || "light";
    document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
  }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem(keys.theme, next);
    applyTheme();
  }

  function image(path, alt, className) {
    const img = document.createElement("img");
    img.src = path;
    img.alt = alt;
    img.loading = "lazy";
    img.decoding = "async";
    if (className) img.className = className;
    return img;
  }

  function productCard(product, options) {
    const compact = options?.compact;
    const article = document.createElement("article");
    article.className = "product-card";

    const media = document.createElement("a");
    media.className = "product-media";
    media.href = `product.html?id=${encodeURIComponent(product.id)}`;
    media.appendChild(image(product.image, product.name, ""));

    const badge = document.createElement("span");
    badge.className = "product-badge";
    badge.textContent = product.badge;
    media.appendChild(badge);

    const body = document.createElement("div");
    body.className = "product-body";

    const meta = document.createElement("p");
    meta.className = "product-meta";
    meta.textContent = `${categoryLabel(product.category)} / ${product.rating.toFixed(1)} rating`;

    const title = document.createElement("a");
    title.className = "product-title";
    title.href = media.href;
    title.textContent = product.name;

    const desc = document.createElement("p");
    desc.className = "product-desc";
    desc.textContent = compact ? product.desc.slice(0, 78) + "..." : product.desc;

    const price = document.createElement("div");
    price.className = "price-row";
    price.innerHTML = `<strong>${money(product.price)}</strong><span>${money(product.oldPrice)}</span>`;

    const actions = document.createElement("div");
    actions.className = "product-actions";

    const cartButton = document.createElement("button");
    cartButton.className = "button primary";
    cartButton.type = "button";
    cartButton.textContent = "Add";
    cartButton.addEventListener("click", () => addToCart(product.id, 1));

    const wishButton = document.createElement("button");
    wishButton.className = `button ghost${isWishlisted(product.id) ? " is-active" : ""}`;
    wishButton.type = "button";
    wishButton.textContent = isWishlisted(product.id) ? "Saved" : "Save";
    wishButton.addEventListener("click", () => {
      const active = toggleWishlist(product.id);
      wishButton.classList.toggle("is-active", active);
      wishButton.textContent = active ? "Saved" : "Save";
    });

    actions.append(cartButton, wishButton);
    body.append(meta, title, desc, price, actions);
    article.append(media, body);
    return article;
  }

  function categoryLabel(categoryId) {
    return categories().find((category) => category.id === categoryId)?.label || categoryId;
  }

  function emptyState(title, message, action) {
    const wrap = document.createElement("div");
    wrap.className = "empty-state";
    const heading = document.createElement("h2");
    heading.textContent = title;
    const copy = document.createElement("p");
    copy.textContent = message;
    wrap.append(heading, copy);
    if (action) {
      const link = document.createElement("a");
      link.className = "button primary";
      link.href = action.href;
      link.textContent = action.label;
      wrap.appendChild(link);
    }
    return wrap;
  }

  function getRedirect(defaultTarget) {
    const params = new URLSearchParams(location.search);
    const redirect = params.get("redirect");
    if (!redirect || redirect.includes("://") || redirect.startsWith("/")) return defaultTarget;
    return redirect;
  }

  document.addEventListener("DOMContentLoaded", () => {
    migrateLegacyStorage();
    applyTheme();
    renderHeader();
    renderFooter();
    refreshHeaderCounts();
  });

  window.Zenix = {
    keys,
    byId,
    money,
    uid,
    escapeHtml,
    slugFor,
    products,
    categories,
    coupons,
    findProduct,
    categoryLabel,
    getCart,
    setCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    getWishlist,
    setWishlist,
    isWishlisted,
    toggleWishlist,
    cartLines,
    calculateTotals,
    currentUser,
    registerUser,
    loginUser,
    logout,
    updateUserProfile,
    changePassword,
    resetPassword,
    requireAuth,
    validateEmail,
    validatePhone,
    validatePassword,
    orders,
    saveOrder,
    findOrder,
    ordersForCurrentUser,
    read,
    write,
    toast,
    setFieldError,
    clearFormErrors,
    renderHeader,
    refreshHeaderCounts,
    productCard,
    emptyState,
    image,
    getRedirect
  };
})();
