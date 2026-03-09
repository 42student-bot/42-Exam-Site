// ============================================================
//  forgot.20260308-1.js — Réinitialisation mot de passe Firebase
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  sendPasswordResetEmail
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

  // ── Scroll check (inchangé) ──────────────────────────────
  const checkScroll = () => {
    const card = document.querySelector(".card");
    if (!card) return;
    document.body.classList.toggle("allow-scroll", card.scrollHeight > window.innerHeight);
  };
  window.addEventListener("load",   checkScroll);
  window.addEventListener("resize", checkScroll);

  // ── Éléments ─────────────────────────────────────────────
  const views           = document.getElementById("views");
  const requestForm     = document.getElementById("requestForm");
  const sentView        = document.getElementById("sentView");
  const forgotEmail     = document.getElementById("forgotEmail");
  const requestMsg      = document.getElementById("requestMsg");
  const sentEmail       = document.getElementById("sentEmail");
  const resendBtn       = document.getElementById("resendBtn");
  const resendMsg       = document.getElementById("resendMsg");
  const backToLoginBtn  = document.getElementById("backToLoginBtn");
  const backToLoginBtn2 = document.getElementById("backToLoginBtn2");

  // ── Helpers (inchangés) ──────────────────────────────────
  const setMsg = (el, msg, ok = false) => {
    if (!el) return;
    el.textContent = msg || "";
    el.classList.toggle("is-ok",  ok);
    el.classList.toggle("is-bad", !ok && !!msg);
  };

  const setHidden = (el, hidden) => {
    if (!el) return;
    el.setAttribute("aria-hidden", hidden ? "true" : "false");
    if ("inert" in el) el.inert = !!hidden;
  };

  const animateSwap = (fromEl, toEl, dataView) => {
    if (!fromEl || !toEl) return;
    toEl.classList.remove("is-enter", "is-exit");
    fromEl.classList.remove("is-enter", "is-exit");
    toEl.classList.add("is-preenter");
    fromEl.classList.add("is-exit");
    window.setTimeout(() => {
      if (views) views.dataset.view = dataView;
      toEl.classList.remove("is-preenter");
      toEl.classList.add("is-enter");
      fromEl.classList.remove("is-exit");
      setHidden(fromEl, true);
      setHidden(toEl, false);
    }, 20);
    window.setTimeout(() => {
      toEl.classList.remove("is-enter");
      fromEl.classList.remove("is-exit");
    }, 1100);
  };

  // ── Animation d'entrée (inchangée) ──────────────────────
  document.documentElement.classList.add("js-viewboot");
  setHidden(sentView, true);
  setHidden(requestForm, true);

  window.requestAnimationFrame(() => {
    document.documentElement.classList.remove("js-viewboot");
    setHidden(requestForm, false);
    requestForm.classList.add("is-preenter");
    window.setTimeout(() => {
      requestForm.classList.remove("is-preenter");
      requestForm.classList.add("is-enter");
      window.setTimeout(() => requestForm.classList.remove("is-enter"), 1100);
    }, 20);
    window.setTimeout(() => forgotEmail?.focus(), 220);
  });

  // ── Soumission : envoi email Firebase ────────────────────
  // On affiche TOUJOURS la vue "sent", que l'email existe ou non
  // (sécurité : ne pas révéler si un compte existe).
  let lastEmail = "";

  requestForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg(requestMsg, "");

    const em = (forgotEmail?.value || "").trim();
    if (!/^\S+@\S+\.\S+$/.test(em)) {
      forgotEmail?.setAttribute("aria-invalid", "true");
      forgotEmail?.focus();
      return setMsg(requestMsg, "Adresse email invalide.", false);
    }
    forgotEmail?.removeAttribute("aria-invalid");
    lastEmail = em;

    setMsg(requestMsg, "Envoi en cours…", true);

    try {
      await sendPasswordResetEmail(auth, em);
    } catch (err) {
      // On absorbe silencieusement auth/user-not-found pour la sécurité.
      // On ne logue que les vraies erreurs réseau.
      if (err.code !== "auth/user-not-found" && err.code !== "auth/invalid-email") {
        console.warn("forgot:", err.code);
      }
    }

    // Transition vers "sent" dans tous les cas
    setMsg(requestMsg, "");
    if (sentEmail) sentEmail.textContent = maskEmail(em);
    requestForm.dataset.lastEmail = em;
    animateSwap(requestForm, sentView, "sent");
    checkScroll();
  });

  // ── Bouton "Renvoyer un lien" ────────────────────────────
  let resendCooldown = false;

  resendBtn?.addEventListener("click", async () => {
    if (resendCooldown) return;
    resendCooldown = true;
    resendBtn.disabled = true;

    try {
      const em = requestForm.dataset.lastEmail || lastEmail;
      if (em) await sendPasswordResetEmail(auth, em);
      setMsg(resendMsg, "Lien renvoyé.", true);
    } catch {
      setMsg(resendMsg, "Lien renvoyé.", true); // même message par sécurité
    }

    window.setTimeout(() => {
      resendCooldown = false;
      resendBtn.disabled = false;
      setMsg(resendMsg, "");
    }, 4000);
  });

  // ── Retour connexion ─────────────────────────────────────
  const goLogin = () => { window.location.href = "index.html"; };
  backToLoginBtn?.addEventListener("click",  goLogin);
  backToLoginBtn2?.addEventListener("click", goLogin);

  // ── Masquage partiel de l'email (inchangé) ───────────────
  function maskEmail(email) {
    const [user, domain] = email.split("@");
    if (!domain) return email;
    const visible = user.length > 2
      ? user[0] + "•".repeat(user.length - 2) + user[user.length - 1]
      : user[0] + "•";
    return `${visible}@${domain}`;
  }
})();
