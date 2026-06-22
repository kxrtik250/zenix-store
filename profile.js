document.addEventListener("DOMContentLoaded", () => {
  let user = Zenix.requireAuth();
  if (!user) return;

  const summary = Zenix.byId("profileSummary");
  const profileForm = Zenix.byId("profileForm");
  const passwordForm = Zenix.byId("passwordForm");

  function initials(name) {
    return String(name || "Z")
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  function renderSummary() {
    const orderCount = Zenix.ordersForCurrentUser().length;
    summary.replaceChildren();
    const avatar = document.createElement("div");
    avatar.className = "profile-avatar";
    avatar.textContent = initials(user.name);
    const name = document.createElement("h2");
    name.textContent = user.name;
    const email = document.createElement("p");
    email.className = "helper-text";
    email.textContent = user.email;
    const details = document.createElement("div");
    details.className = "summary-list";
    [
      ["Role", user.role],
      ["Orders", String(orderCount)],
      ["Member since", new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(user.createdAt))]
    ].forEach(([label, value]) => {
      const row = document.createElement("div");
      row.className = "summary-row";
      const left = document.createElement("span");
      left.textContent = label;
      const right = document.createElement("strong");
      right.textContent = value;
      row.append(left, right);
      details.appendChild(row);
    });
    summary.append(avatar, name, email, details);
  }

  function fillForm() {
    Zenix.byId("profileName").value = user.name || "";
    Zenix.byId("profilePhone").value = user.phone || "";
    Zenix.byId("profileAddress").value = user.address || "";
    Zenix.byId("profileCity").value = user.city || "";
    Zenix.byId("profilePincode").value = user.pincode || "";
  }

  profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    Zenix.clearFormErrors(profileForm);
    const phone = Zenix.byId("profilePhone");
    const pincode = Zenix.byId("profilePincode");
    let ok = true;
    if (phone.value.trim() && !Zenix.validatePhone(phone.value)) {
      Zenix.setFieldError(phone, "Enter a valid phone number.");
      ok = false;
    }
    if (pincode.value.trim() && !/^[1-9][0-9]{5}$/.test(pincode.value.trim())) {
      Zenix.setFieldError(pincode, "Enter a valid 6 digit PIN code.");
      ok = false;
    }
    if (!ok) return;

    const result = Zenix.updateUserProfile({
      name: Zenix.byId("profileName").value,
      phone: phone.value,
      address: Zenix.byId("profileAddress").value,
      city: Zenix.byId("profileCity").value,
      pincode: pincode.value
    });
    if (!result.ok) {
      Zenix.toast(result.message, "error");
      return;
    }
    user = result.user;
    renderSummary();
    Zenix.toast("Profile saved.");
  });

  passwordForm.addEventListener("submit", (event) => {
    event.preventDefault();
    Zenix.clearFormErrors(passwordForm);
    const currentPassword = Zenix.byId("currentPassword");
    const newPassword = Zenix.byId("newPassword");
    const result = Zenix.changePassword(currentPassword.value, newPassword.value);
    if (!result.ok) {
      Zenix.setFieldError(newPassword, result.message);
      Zenix.toast(result.message, "error");
      return;
    }
    passwordForm.reset();
    Zenix.toast("Password updated.");
  });

  Zenix.byId("logoutBtn").addEventListener("click", () => {
    Zenix.logout();
    Zenix.toast("Signed out.");
    window.location.href = "index.html";
  });

  renderSummary();
  fillForm();
});
