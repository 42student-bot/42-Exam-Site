(() => {
  // --- Forcer reload si page restaurée depuis bfcache ---
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) window.location.reload();
  });

  window.__APP_LOADED__ = true;
  window.__BUILD__ = "20260308-1";

  const $ = (sel) => document.querySelector(sel);

  const form = $("#loginForm");
  const login = $("#login");
  const password = $("#password");
  const togglePwd = $("#togglePwd");
  const error = $("#error");
  const year = $("#year");

  const dash = $("#dashboard");
  const userLogin = $("#userLogin");
  const logout = $("#logout");
  const forgot = $("#forgot");

  const STORAGE_KEY = "examen42_auth";
  const PERSIST_LOGIN = false;

  if (year) year.textContent = String(new Date().getFullYear());

  const setInvalid = (el, invalid) => {
    if (!el) return;
    if (invalid) el.setAttribute("aria-invalid", "true");
    else el.removeAttribute("aria-invalid");
  };

  const checkScroll = () => {
    const card = document.querySelector(".card");
    if (!card) return;
    if (card.scrollHeight > window.innerHeight) {
      document.body.classList.add("allow-scroll");
    } else {
      document.body.classList.remove("allow-scroll");
    }
  };

  window.addEventListener("load", checkScroll);
  window.addEventListener("resize", checkScroll);

  const setMsg = (msg, ok = false) => {
    if (!error) return;
    error.textContent = msg || "";
    error.classList.toggle("is-ok", ok);
    error.classList.toggle("is-bad", !ok && !!msg);
    document.body.classList.add("no-scroll");
    if (!msg) {
      setInvalid(login, false);
      setInvalid(password, false);
    }
  };

  const readAuth = () => {
    const raw =
      sessionStorage.getItem(STORAGE_KEY) ||
      (PERSIST_LOGIN ? localStorage.getItem(STORAGE_KEY) : null);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  };

  const setAuthed = ({ login: l } = {}) => {
    if (!dash || !form) return;

    if (!l) {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);

      dash.hidden = true;
      form.hidden = false;

      password.value = "";
      setMsg("");
      login?.focus();
      return;
    }

    const payload = { login: l, at: Date.now() };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    localStorage.removeItem(STORAGE_KEY);

    if (userLogin) userLogin.textContent = l;

    form.hidden = true;
    dash.hidden = false;
    setMsg("");
  };

  if (password) {
    password.setAttribute("autocomplete", "current-password");
    password.setAttribute("autocapitalize", "off");
    password.setAttribute("spellcheck", "false");
    password.setAttribute("inputmode", "text");
  }

  const style = document.createElement("style");
  style.textContent = `
    input[type="password"]::-ms-reveal,
    input[type="password"]::-ms-clear { display: none; }
  `;
  document.head.appendChild(style);

  const existing = readAuth();
  if (existing?.login) setAuthed({ login: existing.login });

  const syncPwdToggleUI = () => {
    if (!togglePwd || !password) return;
    const hidden = password.type === "password";

    togglePwd.setAttribute("aria-pressed", hidden ? "true" : "false");
    togglePwd.setAttribute(
      "aria-label",
      hidden ? "Afficher le mot de passe" : "Masquer le mot de passe"
    );

    const sr = togglePwd.querySelector(".sr-only");
    if (sr) sr.textContent = hidden ? "Afficher" : "Masquer";

    togglePwd.classList.toggle("is-slashed", hidden);
  };

  syncPwdToggleUI();

  togglePwd?.addEventListener("click", () => {
    const makeVisible = password.type === "password";
    password.type = makeVisible ? "text" : "password";
    syncPwdToggleUI();
    password.focus();
  });

  // "Mot de passe oublié ?" → navigation vers forgot.html (href natif, pas de JS)

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    setMsg("");

    const l = (login?.value || "").trim();
    const p = password?.value || "";

    if (l.length < 2) {
      setInvalid(login, true);
      login?.focus();
      return setMsg("Identifiant trop court (min 2).", false);
    }
    if (p.length < 6) {
      setInvalid(password, true);
      password?.focus();
      return setMsg("Mot de passe trop court (min 6).", false);
    }

    setInvalid(login, false);
    setInvalid(password, false);

    setMsg("Connexion réussie.", true);
    setTimeout(() => setAuthed({ login: l }), 120);
  });

  logout?.addEventListener("click", () => setAuthed());

  // --- Animation d'entrée du formulaire ---
  document.documentElement.classList.add("js-viewboot");

  const loginForm = document.querySelector("#loginForm");

  window.requestAnimationFrame(() => {
    document.documentElement.classList.remove("js-viewboot");
    if (loginForm) {
      loginForm.classList.add("is-preenter");
      window.setTimeout(() => {
        loginForm.classList.remove("is-preenter");
        loginForm.classList.add("is-enter");
        window.setTimeout(() => loginForm.classList.remove("is-enter"), 1100);
      }, 20);
      window.setTimeout(() => login?.focus(), 220);
    }
  });

  // Prefill login depuis register.html (param ?prefill=email)
  const params = new URLSearchParams(window.location.search);
  const prefillVal = params.get("prefill");
  if (prefillVal && login && !login.value) {
    login.value = prefillVal;
    // Nettoyer l'URL sans recharger
    history.replaceState(null, "", window.location.pathname);
  }
})();
