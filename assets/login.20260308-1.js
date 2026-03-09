// ============================================================
//  login.20260308-1.js — Connexion avec Firebase Auth
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// ── 🔧 REMPLACE CES VALEURS PAR CELLES DE TA CONSOLE FIREBASE ──
const firebaseConfig = {
  apiKey: "AIzaSyCYrq2c7-yA7lQHJGaiawspnRA5fcFORBc",
  authDomain: "codex-42.firebaseapp.com",
  projectId: "codex-42",
  storageBucket: "codex-42.firebasestorage.app",
  messagingSenderId: "530061034142",
  appId: "1:530061034142:web:5be51b7e29137c4751318f",
  measurementId: "G-KJY2KLD69G"
};
// ────────────────────────────────────────────────────────────

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

(() => {
  // --- Forcer reload si page restaurée depuis bfcache ---
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) window.location.reload();
  });

  window.__APP_LOADED__ = true;
  window.__BUILD__ = "20260308-1";

  const $ = (sel) => document.querySelector(sel);

  const form      = $("#loginForm");
  const loginEl   = $("#login");       // champ identifiant (= email Firebase)
  const password  = $("#password");
  const togglePwd = $("#togglePwd");
  const error     = $("#error");
  const year      = $("#year");
  const dash      = $("#dashboard");
  const userLogin = $("#userLogin");
  const logout    = $("#logout");

  if (year) year.textContent = String(new Date().getFullYear());

  // ── Helpers UI ──────────────────────────────────────────
  const setInvalid = (el, invalid) => {
    if (!el) return;
    if (invalid) el.setAttribute("aria-invalid", "true");
    else         el.removeAttribute("aria-invalid");
  };

  const checkScroll = () => {
    const card = document.querySelector(".card");
    if (!card) return;
    document.body.classList.toggle("allow-scroll", card.scrollHeight > window.innerHeight);
  };
  window.addEventListener("load",   checkScroll);
  window.addEventListener("resize", checkScroll);

  const setMsg = (msg, ok = false) => {
    if (!error) return;
    error.textContent = msg || "";
    error.classList.toggle("is-ok",  ok);
    error.classList.toggle("is-bad", !ok && !!msg);
    if (!msg) {
      setInvalid(loginEl, false);
      setInvalid(password, false);
    }
  };

  // ── Affichage dashboard / formulaire ────────────────────
  const showDash = (user) => {
    if (!dash || !form) return;
    if (userLogin) userLogin.textContent = user.email;
    form.hidden = true;
    dash.hidden = false;
    setMsg("");
  };

  const showForm = () => {
    if (!dash || !form) return;
    dash.hidden = true;
    form.hidden = false;
    if (password) password.value = "";
    setMsg("");
    loginEl?.focus();
  };

  // ── Observateur Firebase Auth ────────────────────────────
  // Dès que l'état d'auth change (connexion / déconnexion / refresh),
  // Firebase rappelle cette fonction — pas besoin de sessionStorage.
  onAuthStateChanged(auth, (user) => {
    if (user) {
      showDash(user);
    } else {
      showForm();
    }
  });

  // ── Toggle mot de passe ──────────────────────────────────
  if (password) {
    password.setAttribute("autocomplete", "current-password");
    password.setAttribute("autocapitalize", "off");
    password.setAttribute("spellcheck", "false");
    password.setAttribute("inputmode", "text");
  }

  const styleEl = document.createElement("style");
  styleEl.textContent = `
    input[type="password"]::-ms-reveal,
    input[type="password"]::-ms-clear { display: none; }
  `;
  document.head.appendChild(styleEl);

  const syncPwdToggleUI = () => {
    if (!togglePwd || !password) return;
    const hidden = password.type === "password";
    togglePwd.setAttribute("aria-pressed", hidden ? "true" : "false");
    togglePwd.setAttribute("aria-label", hidden ? "Afficher le mot de passe" : "Masquer le mot de passe");
    const sr = togglePwd.querySelector(".sr-only");
    if (sr) sr.textContent = hidden ? "Afficher" : "Masquer";
    togglePwd.classList.toggle("is-slashed", hidden);
  };
  syncPwdToggleUI();

  togglePwd?.addEventListener("click", () => {
    password.type = password.type === "password" ? "text" : "password";
    syncPwdToggleUI();
    password.focus();
  });

  // ── Soumission connexion ─────────────────────────────────
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg("");

    const emailVal = (loginEl?.value || "").trim();
    const pwVal    = password?.value || "";

    // Validation front basique (conservée à l'identique)
    if (emailVal.length < 2) {
      setInvalid(loginEl, true);
      loginEl?.focus();
      return setMsg("Identifiant trop court (min 2).", false);
    }
    if (pwVal.length < 6) {
      setInvalid(password, true);
      password?.focus();
      return setMsg("Mot de passe trop court (min 6).", false);
    }

    setInvalid(loginEl, false);
    setInvalid(password, false);
    setMsg("Connexion en cours…", true);

    try {
      await signInWithEmailAndPassword(auth, emailVal, pwVal);
      // onAuthStateChanged prend le relais → showDash()
    } catch (err) {
      const msg = firebaseErrorFr(err.code);
      setMsg(msg, false);
      setInvalid(password, true);
      password?.focus();
    }
  });

  // ── Déconnexion ──────────────────────────────────────────
  logout?.addEventListener("click", async () => {
    await signOut(auth);
    // onAuthStateChanged → showForm()
  });

  // ── Animation d'entrée (inchangée) ──────────────────────
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
      window.setTimeout(() => loginEl?.focus(), 220);
    }
  });

  // ── Prefill depuis register.html ─────────────────────────
  const params     = new URLSearchParams(window.location.search);
  const prefillVal = params.get("prefill");
  if (prefillVal && loginEl && !loginEl.value) {
    loginEl.value = prefillVal;
    history.replaceState(null, "", window.location.pathname);
  }

  // ── Traduction des codes d'erreur Firebase ───────────────
  function firebaseErrorFr(code) {
    const map = {
      "auth/invalid-email":          "Adresse email invalide.",
      "auth/user-not-found":         "Aucun compte trouvé pour cet email.",
      "auth/wrong-password":         "Mot de passe incorrect.",
      "auth/invalid-credential":     "Identifiant ou mot de passe incorrect.",
      "auth/too-many-requests":      "Trop de tentatives. Réessayez plus tard.",
      "auth/user-disabled":          "Ce compte a été désactivé.",
      "auth/network-request-failed": "Erreur réseau. Vérifiez votre connexion.",
    };
    return map[code] || "Erreur de connexion. Réessayez.";
  }
})();
