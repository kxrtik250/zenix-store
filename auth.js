document.addEventListener("DOMContentLoaded", () => {
  const loginForm = Zenix.byId("loginForm");
  const registerForm = Zenix.byId("registerForm");
  const forgotForm = Zenix.byId("forgotForm");

  function requireValue(field, message) {
    if (field.value.trim()) return true;
    Zenix.setFieldError(field, message);
    return false;
  }

  loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    Zenix.clearFormErrors(loginForm);
    const email = Zenix.byId("loginEmail");
    const password = Zenix.byId("loginPassword");
    let ok = true;

    if (!Zenix.validateEmail(email.value)) {
      Zenix.setFieldError(email, "Enter a valid email address.");
      ok = false;
    }
    if (!requireValue(password, "Enter your password.")) ok = false;
    if (!ok) return;

    const result = Zenix.loginUser(email.value, password.value);
    if (!result.ok) {
      Zenix.setFieldError(password, result.message);
      Zenix.toast(result.message, "error");
      return;
    }

    Zenix.toast("Signed in successfully.");
    window.location.href = Zenix.getRedirect("profile.html");
  });

  registerForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    Zenix.clearFormErrors(registerForm);
    const name = Zenix.byId("registerName");
    const email = Zenix.byId("registerEmail");
    const password = Zenix.byId("registerPassword");
    const confirm = Zenix.byId("registerConfirm");
    let ok = true;

    if (name.value.trim().length < 2) {
      Zenix.setFieldError(name, "Enter your full name.");
      ok = false;
    }
    if (!Zenix.validateEmail(email.value)) {
      Zenix.setFieldError(email, "Enter a valid email address.");
      ok = false;
    }
    if (!Zenix.validatePassword(password.value)) {
      Zenix.setFieldError(password, "Use at least 8 characters with a letter and a number.");
      ok = false;
    }
    if (confirm.value !== password.value) {
      Zenix.setFieldError(confirm, "Passwords do not match.");
      ok = false;
    }
    if (!ok) return;

    const result = Zenix.registerUser({
      name: name.value,
      email: email.value,
      password: password.value
    });
    if (!result.ok) {
      Zenix.setFieldError(email, result.message);
      Zenix.toast(result.message, "error");
      return;
    }

    Zenix.toast("Account created.");
    window.location.href = Zenix.getRedirect("profile.html");
  });

  forgotForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    Zenix.clearFormErrors(forgotForm);
    const email = Zenix.byId("forgotEmail");
    const password = Zenix.byId("forgotPassword");
    const confirm = Zenix.byId("forgotConfirm");
    let ok = true;

    if (!Zenix.validateEmail(email.value)) {
      Zenix.setFieldError(email, "Enter a valid email address.");
      ok = false;
    }
    if (!Zenix.validatePassword(password.value)) {
      Zenix.setFieldError(password, "Use at least 8 characters with a letter and a number.");
      ok = false;
    }
    if (confirm.value !== password.value) {
      Zenix.setFieldError(confirm, "Passwords do not match.");
      ok = false;
    }
    if (!ok) return;

    const result = Zenix.resetPassword(email.value, password.value);
    if (!result.ok) {
      Zenix.setFieldError(email, result.message);
      Zenix.toast(result.message, "error");
      return;
    }

    Zenix.toast("Password updated. You can sign in now.");
    window.location.href = "login.html";
  });
});
