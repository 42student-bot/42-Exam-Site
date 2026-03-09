(() => {
  // --- Forcer reload si page restaurée depuis bfcache ---
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) window.location.reload();
  });

  // --- Optionnel : vider le sessionStorage / localStorage pour zéro état persistant ---
  // sessionStorage.clear();
  // localStorage.clear();

  window.__APP_LOADED__ = true;
  window.__BUILD__ = "20260308-1";
  
  const $ = (sel) => document.querySelector(sel);

  const form = $("#loginForm");
  const login = $("#login");
  const password = $("#password");
  const remember = $("#remember");
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

  forgot?.addEventListener("click", (e) => {
    e.preventDefault();
    setMsg("Fonction indisponible.", false);
  });

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

  // --- No-flash initial state for view animations ---
  document.documentElement.classList.add("js-viewboot");

  // --- Views: login/register ---
  const views = document.querySelector(".views");
  const loginForm = document.querySelector("#loginForm");
  const registerForm = document.querySelector("#registerForm");
  const openRegister = document.querySelector("#openRegister");
  const backToLogin = document.querySelector("#backToLogin");
  const registerMsg = document.querySelector("#registerMsg");

  const firstName = document.querySelector("#firstName");
  const lastName = document.querySelector("#lastName");
  const birthdate = document.querySelector("#birthdate");
  const email = document.querySelector("#email");
  const regPassword = document.querySelector("#regPassword");

  const setHidden = (el, hidden) => {
    if (!el) return;
    el.style.display = hidden ? "none" : "block"; // <-- ajouté
    el.setAttribute("aria-hidden", hidden ? "true" : "false");
    if ("inert" in el) el.inert = !!hidden;
  };

  const setRegisterMsg = (msg, ok = false) => {
    if (!registerMsg) return;
    registerMsg.textContent = msg || "";
    registerMsg.classList.toggle("is-ok", ok);
    registerMsg.classList.toggle("is-bad", !ok && !!msg);
  };

  const animateSwap = (fromEl, toEl) => {
    if (!fromEl || !toEl) return;

    // Ensure destination starts hidden (prevents "all appears then disappears" flash)
    toEl.classList.remove("is-enter", "is-exit");
    fromEl.classList.remove("is-enter", "is-exit");

    toEl.classList.add("is-preenter");
    fromEl.classList.add("is-exit");

    window.setTimeout(() => {
      toEl.classList.remove("is-preenter");
      toEl.classList.add("is-enter");
      fromEl.classList.remove("is-exit");
    }, 20);

    window.setTimeout(() => {
      toEl.classList.remove("is-enter");
      fromEl.classList.remove("is-exit");
    }, 1100);
  };

  const showLogin = () => {
    document.body.classList.add("no-scroll"); // Bloque le scroll sur connexion
    views.dataset.view = "login";
    setHidden(registerForm, true);
    setHidden(loginForm, false);
    animateSwap(registerForm, loginForm);
  };
  
  const showRegister = () => {
    document.body.classList.remove("no-scroll"); // Autorise le scroll si nécessaire
    views.dataset.view = "register";
    setHidden(loginForm, true);
    setHidden(registerForm, false);
    animateSwap(loginForm, registerForm);
  };

  // init if register exists
  if (views && registerForm && loginForm) {
    // Hide both first; we'll reveal via animation to avoid initial flash
    setHidden(registerForm, true);
    setHidden(loginForm, true);

    // After layout is ready, animate login in
    window.requestAnimationFrame(() => {
      document.documentElement.classList.remove("js-viewboot");
      setHidden(loginForm, false);
      loginForm.classList.add("is-preenter");
      window.setTimeout(() => {
        loginForm.classList.remove("is-preenter");
        loginForm.classList.add("is-enter");
        window.setTimeout(() => loginForm.classList.remove("is-enter"), 1100);
      }, 20);
      window.setTimeout(() => login?.focus(), 220);
    });
  }

  openRegister?.addEventListener("click", showRegister);
  // Lien "Créer un compte"
  const goRegister = document.getElementById("goRegister");
  if (goRegister) {
    goRegister.addEventListener("click", (e) => {
      e.preventDefault();   // bloque le # href
      e.stopPropagation();  // empêche d’autres handlers
      showRegister();       // ouvre le formulaire
    });
  }
  backToLogin?.addEventListener("click", showLogin);

  registerForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    setRegisterMsg("");

    const fn = (firstName?.value || "").trim();
    const ln = (lastName?.value || "").trim();
    const bd = (birthdate?.value || "").trim();
    const em = (email?.value || "").trim();
    const pw = regPassword?.value || "";

    if (fn.length < 2) return setRegisterMsg("Prénom trop court (min 2).", false);
    if (ln.length < 2) return setRegisterMsg("Nom trop court (min 2).", false);
    if (!bd) return setRegisterMsg("Date de naissance requise.", false);
    if (!/^\S+@\S+\.\S+$/.test(em)) return setRegisterMsg("Email invalide.", false);
    if (pw.length < 6) return setRegisterMsg("Mot de passe trop court (min 6).", false);

    // front-only: prefill login with email and go back
    if (login) login.value = em;
    setRegisterMsg("Compte créé. Vous pouvez vous connecter.", true);

    window.setTimeout(() => {
      regPassword.value = "";
      showLogin();
    }, 520);
  });
})();
