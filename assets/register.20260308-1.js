(() => {
  // --- Forcer reload si page restaurée depuis bfcache ---
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) window.location.reload();
  });

  window.__APP_LOADED__ = true;
  window.__BUILD__ = "20260308-1";

  // ── Activer scroll sur cette page ──────────────────────
  // On force les overflows ici car styles.20260308-1.css pose
  // overflow:hidden sur html, body et main.shell.
  const enableScroll = () => {
    document.documentElement.style.overflow  = "auto";
    document.documentElement.style.height    = "auto";
    document.body.style.overflow  = "auto";
    document.body.style.height    = "auto";
    document.body.style.minHeight = "100dvh";
    document.body.classList.add("page-register");
    document.body.classList.remove("no-scroll");
    const shell = document.querySelector("main.shell");
    if (shell) {
      shell.style.overflow = "visible";
      shell.style.height   = "auto";
    }
  };

  // Appliquer immédiatement et à chaque resize (clavier virtuel)
  enableScroll();
  window.addEventListener("resize", enableScroll);

  // ── Scroll check ──────────────────────────────────────
  const checkScroll = () => {
    const card = document.querySelector(".card");
    if (!card) return;
    // Toujours autoriser le scroll sur la page inscription
    document.body.style.overflowY = "auto";
  };
  window.addEventListener("load", checkScroll);
  window.addEventListener("resize", checkScroll);

  // ── Éléments ──────────────────────────────────────────
  const registerForm = document.querySelector("#registerForm");
  const registerMsg  = document.querySelector("#registerMsg");
  const backToLogin  = document.querySelector("#backToLogin");
  const firstName    = document.querySelector("#firstName");
  const lastName     = document.querySelector("#lastName");
  const birthdate    = document.querySelector("#birthdate");
  const email        = document.querySelector("#email");
  const regPassword  = document.querySelector("#regPassword");

  const setRegisterMsg = (msg, ok = false) => {
    if (!registerMsg) return;
    registerMsg.textContent = msg || "";
    registerMsg.classList.toggle("is-ok",  ok);
    registerMsg.classList.toggle("is-bad", !ok && !!msg);
  };

  // ── Animation d'entrée ────────────────────────────────
  document.documentElement.classList.add("js-viewboot");

  window.requestAnimationFrame(() => {
    document.documentElement.classList.remove("js-viewboot");
    // Re-forcer le scroll après le premier frame (le CSS peut le remettre)
    enableScroll();
    if (registerForm) {
      registerForm.classList.add("is-preenter");
      window.setTimeout(() => {
        registerForm.classList.remove("is-preenter");
        registerForm.classList.add("is-enter");
        window.setTimeout(() => registerForm.classList.remove("is-enter"), 1100);
      }, 20);
      window.setTimeout(() => firstName?.focus(), 220);
    }
  });

  // ── Bouton retour ─────────────────────────────────────
  backToLogin?.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // ── Soumission ────────────────────────────────────────
  registerForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    setRegisterMsg("");

    const fn = (firstName?.value  || "").trim();
    const ln = (lastName?.value   || "").trim();
    const bd = (birthdate?.value  || "").trim();
    const em = (email?.value      || "").trim();
    const pw = regPassword?.value || "";

    if (fn.length < 2) return setRegisterMsg("Prénom trop court (min 2).", false);
    if (ln.length < 2) return setRegisterMsg("Nom trop court (min 2).", false);
    if (!bd)           return setRegisterMsg("Date de naissance requise.", false);
    if (!/^\S+@\S+\.\S+$/.test(em)) return setRegisterMsg("Email invalide.", false);
    if (pw.length < 6) return setRegisterMsg("Mot de passe trop court (min 6).", false);

    setRegisterMsg("Compte créé. Vous pouvez vous connecter.", true);

    window.setTimeout(() => {
      if (regPassword) regPassword.value = "";
      const loginUrl = new URL("index.html", window.location.href);
      loginUrl.searchParams.set("prefill", em);
      window.location.href = loginUrl.toString();
    }, 520);
  });
})();
