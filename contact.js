document.addEventListener("DOMContentLoaded", () => {
  const form = Zenix.byId("contactForm");
  const user = Zenix.currentUser();

  if (user) {
    Zenix.byId("contactName").value = user.name || "";
    Zenix.byId("contactEmail").value = user.email || "";
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    Zenix.clearFormErrors(form);
    const name = Zenix.byId("contactName");
    const email = Zenix.byId("contactEmail");
    const subject = Zenix.byId("contactSubject");
    const message = Zenix.byId("contactMessage");
    let ok = true;

    if (name.value.trim().length < 2) {
      Zenix.setFieldError(name, "Enter your name.");
      ok = false;
    }
    if (!Zenix.validateEmail(email.value)) {
      Zenix.setFieldError(email, "Enter a valid email address.");
      ok = false;
    }
    if (subject.value.trim().length < 3) {
      Zenix.setFieldError(subject, "Enter a subject.");
      ok = false;
    }
    if (message.value.trim().length < 10) {
      Zenix.setFieldError(message, "Enter a message with at least 10 characters.");
      ok = false;
    }
    if (!ok) return;

    const messages = Zenix.read(Zenix.keys.contacts, []);
    messages.push({
      id: Zenix.uid("MSG"),
      date: new Date().toISOString(),
      name: name.value.trim(),
      email: email.value.trim(),
      subject: subject.value.trim(),
      message: message.value.trim()
    });
    Zenix.write(Zenix.keys.contacts, messages);
    form.reset();
    Zenix.toast("Message sent.");
  });
});
