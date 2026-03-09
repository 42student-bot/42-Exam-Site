// ============================================================
//  register.20260308-1.js — Inscription Firebase + OTP email
// ============================================================
import { initializeApp }    from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile }
                             from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp }
                             from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getFunctions, httpsCallable }
                             from "https://www.gstatic.com/firebasejs/11.6.0/firebase-functions.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCYrq2c7-yA7lQHJGaiawspnRA5fcFORBc",
  authDomain:        "codex-42.firebaseapp.com",
  projectId:         "codex-42",
  storageBucket:     "codex-42.firebasestorage.app",
  messagingSenderId: "530061034142",
  appId:             "1:530061034142:web:5be51b7e29137c4751318f",
  measurementId:     "G-KJY2KLD69G"
};

const app       = initializeApp(firebaseConfig);
const auth      = getAuth(app);
const db        = getFirestore(app);
const functions = getFunctions(app, "europe-west1");

let _otpCode     = "";
let _otpEmail    = "";
let _pendingData = null;
let _resendCooldown = false;

const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

const sendOtpEmail = async (email, code) => {
  try {
    const fn = httpsCallable(functions, "sendOtpEmail");
    await fn({ email, code });
  } catch {
    console.info(`%c📧 Code OTP pour ${email} : ${code}`, "color:#8caaff;font-size:14px;font-weight:bold");
  }
};

(() => {
  window.addEventListener("pageshow", (e) => { if (e.persisted) window.location.reload(); });
  window.__APP_LOADED__ = true;
  window.__BUILD__ = "20260308-1";

  // ── Forcer scroll libre — le CSS inline le fait déjà,
  //    mais on réapplique en JS pour couvrir tout ce que
  //    styles.20260308-1.css pourrait remettre à runtime.
  const forceScroll = () => {
    document.documentElement.style.cssText +=
      ";overflow-y:auto!important;height:auto!important";
    document.body.style.cssText +=
      ";overflow-y:auto!important;height:auto!important";
    const shell = document.querySelector("main.shell");
    if (shell) shell.style.cssText +=
      ";overflow:visible!important;height:auto!important;display:flex!important";
    const card = document.querySelector(".card");
    if (card) card.style.cssText += ";overflow:visible!important;height:auto!important";
  };
  forceScroll();
  // Réappliquer après que tous les scripts externes aient tourné
  window.addEventListener("load", forceScroll);

  // ── Éléments formulaire ─────────────────────────────────
  const registerForm    = document.querySelector("#registerForm");
  const registerMsg     = document.querySelector("#registerMsg");
  const backToLogin     = document.querySelector("#backToLogin");
  const firstNameEl     = document.querySelector("#firstName");
  const lastNameEl      = document.querySelector("#lastName");
  const birthdateEl     = document.querySelector("#birthdate");
  const emailEl         = document.querySelector("#email");
  const regPasswordEl   = document.querySelector("#regPassword");
  const regPasswordConf = document.querySelector("#regPasswordConfirm");
  const submitBtn       = document.querySelector("#submitBtn");
  const confirmStatus   = document.querySelector("#confirmStatus");
  const pwdHints        = document.querySelector("#pwdHints");

  // ── Éléments vue vérification ───────────────────────────
  const regViews        = document.getElementById("regViews");
  const verifyView      = document.getElementById("verifyView");
  const verifyEmailDisp = document.getElementById("verifyEmailDisplay");
  const otpCells        = Array.from(document.querySelectorAll(".otp-cell"));
  const verifyMsg       = document.getElementById("verifyMsg");
  const verifyBtn       = document.getElementById("verifyBtn");
  const resendCodeBtn   = document.getElementById("resendCodeBtn");

  // ── Date max : aujourd'hui - 16 ans ─────────────────────
  if (birthdateEl) {
    const now = new Date();
    birthdateEl.setAttribute("max",
      `${now.getFullYear()-16}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`
    );
  }

  // ── Capitalisation automatique prénom / nom ─────────────
  const capitalizeWords = (s) =>
    s.replace(/(^|\s)(\S)/g, (_, sp, ch) => sp + ch.toUpperCase());

  [firstNameEl, lastNameEl].forEach(input => {
    if (!input) return;
    input.addEventListener("input", () => {
      const pos = input.selectionStart;
      input.value = capitalizeWords(input.value);
      try { input.setSelectionRange(pos, pos); } catch {}
    });
  });

  // ── Règles mot de passe ─────────────────────────────────
  const rules = {
    len:     { el: document.getElementById("rule-len"),     test: p => p.length >= 8 },
    upper:   { el: document.getElementById("rule-upper"),   test: p => /[A-Z]/.test(p) },
    digit:   { el: document.getElementById("rule-digit"),   test: p => /\d/.test(p) },
    special: { el: document.getElementById("rule-special"), test: p => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p) },
  };
  const sbars = ["sbar1","sbar2","sbar3","sbar4"].map(id => document.getElementById(id));

  const evalPassword = (pw) => {
    let score = 0;
    Object.values(rules).forEach(r => {
      const ok = r.test(pw);
      r.el?.classList.toggle("is-ok", ok);
      if (ok) score++;
    });
    return score;
  };

  const updateStrengthBars = (score) => {
    sbars.forEach((b, i) => {
      b.className = "pwd-strength__bar";
      if (i < score) b.classList.add(`s${score}`);
    });
  };

  // ── Ouvrir les hints + scroller pour les rendre visibles ─
  const openHints = () => {
    if (pwdHints?.classList.contains("is-open")) return;
    pwdHints?.classList.add("is-open");
    window.setTimeout(() => {
      const card = pwdHints?.closest(".card");
      if (card) {
        const fieldTop = pwdHints.getBoundingClientRect().top;
        const cardTop  = card.getBoundingClientRect().top;
        const scrollPos = card.scrollTop + (fieldTop - cardTop) - 12; // marge
        card.scrollTo({ top: scrollPos, behavior: "smooth" });
      }
    }, 400);
  };

  regPasswordEl?.addEventListener("focus", openHints);
  regPasswordEl?.addEventListener("input", () => {
    openHints();
    updateStrengthBars(evalPassword(regPasswordEl.value));
    checkConfirm();
    checkFormReady();
  });

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (pwdHints?.classList.contains("is-open")) {
        const card = pwdHints.closest(".card");
        if (!card) return;
        const fieldTop = pwdHints.getBoundingClientRect().top;
        const cardTop  = card.getBoundingClientRect().top;
        card.scrollTo({ top: card.scrollTop + (fieldTop - cardTop) - 12, behavior: "smooth" });
      }
    }, 100);
  });
  // ── Confirmation mot de passe ───────────────────────────
  const checkConfirm = () => {
    if (!regPasswordConf || !confirmStatus) return;
    const pw  = regPasswordEl?.value  || "";
    const pw2 = regPasswordConf.value || "";
    if (!pw2) {
      confirmStatus.textContent = "";
      confirmStatus.className = "confirm-status";
      return;
    }
    if (pw === pw2) {
      confirmStatus.textContent = "✓ Les mots de passe correspondent";
      confirmStatus.className   = "confirm-status match";
    } else {
      confirmStatus.textContent = "✗ Ne correspondent pas";
      confirmStatus.className   = "confirm-status no-match";
    }
  };
  regPasswordConf?.addEventListener("input", () => { checkConfirm(); checkFormReady(); });

  // ── Âge minimum 16 ans ──────────────────────────────────
  const isAgeValid = (bd) => {
    if (!bd) return false;
    const limit = new Date();
    limit.setFullYear(limit.getFullYear() - 16);
    return new Date(bd) <= limit;
  };
  birthdateEl?.addEventListener("change", checkFormReady);

  // ── Bouton actif uniquement quand tout est valide ────────
  const isPasswordStrong = (pw) => Object.values(rules).every(r => r.test(pw));

  const checkFormReady = () => {
    if (!submitBtn) return;
    const ready =
      (firstNameEl?.value||"").trim().length >= 2 &&
      (lastNameEl?.value||"").trim().length  >= 2 &&
      isAgeValid(birthdateEl?.value||"") &&
      /^\S+@\S+\.\S+$/.test((emailEl?.value||"").trim()) &&
      isPasswordStrong(regPasswordEl?.value||"") &&
      (regPasswordEl?.value||"") === (regPasswordConf?.value||"");
    submitBtn.disabled     = !ready;
    submitBtn.ariaDisabled = !ready ? "true" : "false";
  };

  [firstNameEl, lastNameEl, emailEl].forEach(el =>
    el?.addEventListener("input", checkFormReady)
  );

  // ── Messages ─────────────────────────────────────────────
  const setRegisterMsg = (msg, ok = false) => {
    if (!registerMsg) return;
    registerMsg.textContent = msg || "";
    registerMsg.classList.toggle("is-ok",  ok);
    registerMsg.classList.toggle("is-bad", !ok && !!msg);
  };

  // ── Animation swap vues ──────────────────────────────────
  const setHidden = (el, hidden) => {
    if (!el) return;
    el.setAttribute("aria-hidden", hidden ? "true" : "false");
    if ("inert" in el) el.inert = !!hidden;
  };

  const animateSwap = (fromEl, toEl, dataView) => {
    if (!fromEl || !toEl) return;
    toEl.classList.remove("is-enter","is-exit");
    fromEl.classList.remove("is-enter","is-exit");
    toEl.classList.add("is-preenter");
    fromEl.classList.add("is-exit");
    window.setTimeout(() => {
      if (regViews) regViews.dataset.view = dataView;
      toEl.classList.remove("is-preenter");
      toEl.classList.add("is-enter");
      fromEl.classList.remove("is-exit");
      setHidden(fromEl, true);
      setHidden(toEl, false);
      // Remonter en haut de la page après la transition
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 20);
    window.setTimeout(() => {
      toEl.classList.remove("is-enter");
      fromEl.classList.remove("is-exit");
    }, 1100);
  };

  // ── Animation d'entrée initiale ──────────────────────────
  document.documentElement.classList.add("js-viewboot");
  setHidden(verifyView, true);

  window.requestAnimationFrame(() => {
    document.documentElement.classList.remove("js-viewboot");
    forceScroll(); // réappliquer après rAF
    if (registerForm) {
      registerForm.classList.add("is-preenter");
      window.setTimeout(() => {
        registerForm.classList.remove("is-preenter");
        registerForm.classList.add("is-enter");
        window.setTimeout(() => registerForm.classList.remove("is-enter"), 1100);
      }, 20);
      window.setTimeout(() => firstNameEl?.focus(), 220);
    }
  });

  // ── Navigation ───────────────────────────────────────────
  backToLogin?.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // ── Soumission ────────────────────────────────────────────
  registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setRegisterMsg("");

    const fn  = (firstNameEl?.value||"").trim();
    const ln  = (lastNameEl?.value||"").trim();
    const bd  = (birthdateEl?.value||"").trim();
    const em  = (emailEl?.value||"").trim();
    const pw  = regPasswordEl?.value||"";
    const pw2 = regPasswordConf?.value||"";

    if (fn.length < 2)           return setRegisterMsg("Prénom trop court (min 2).", false);
    if (ln.length < 2)           return setRegisterMsg("Nom trop court (min 2).", false);
    if (!isAgeValid(bd))         return setRegisterMsg("Âge invalide — minimum requis : 16 ans.", false);
    if (!/^\S+@\S+\.\S+$/.test(em)) return setRegisterMsg("Adresse email invalide.", false);
    if (!isPasswordStrong(pw))   return setRegisterMsg("Le mot de passe ne respecte pas les critères.", false);
    if (pw !== pw2)              return setRegisterMsg("Les mots de passe ne correspondent pas.", false);

    setRegisterMsg("Envoi du code de vérification…", true);
    submitBtn.disabled = true;

    _otpCode     = generateOTP();
    _otpEmail    = em;
    _pendingData = { fn, ln, bd, em, pw };

    await sendOtpEmail(em, _otpCode);
    setRegisterMsg("");

    if (verifyEmailDisp) verifyEmailDisp.textContent = em;
    animateSwap(registerForm, verifyView, "verify");
    window.setTimeout(() => otpCells[0]?.focus(), 380);
  });

  // ── Cellules OTP ─────────────────────────────────────────
  otpCells.forEach((cell, idx) => {
    cell.addEventListener("input", () => {
      cell.value = cell.value.replace(/\D/g,"").slice(-1);
      cell.classList.toggle("filled", !!cell.value);
      if (cell.value && idx < otpCells.length - 1) otpCells[idx+1].focus();
      checkOtpReady();
    });
    cell.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !cell.value && idx > 0) {
        otpCells[idx-1].value = "";
        otpCells[idx-1].classList.remove("filled");
        otpCells[idx-1].focus();
        checkOtpReady();
      }
    });
    cell.addEventListener("paste", (e) => {
      e.preventDefault();
      const text = (e.clipboardData||window.clipboardData).getData("text").replace(/\D/g,"");
      text.split("").slice(0,6).forEach((ch, i) => {
        if (otpCells[i]) { otpCells[i].value = ch; otpCells[i].classList.toggle("filled", !!ch); }
      });
      otpCells[Math.min(text.length, 5)]?.focus();
      checkOtpReady();
    });
  });

  const checkOtpReady = () => {
    if (verifyBtn) verifyBtn.disabled = !otpCells.every(c => c.value.length === 1);
  };

  // ── Validation OTP ────────────────────────────────────────
  const setVerifyMsg = (msg, ok = false) => {
    if (!verifyMsg) return;
    verifyMsg.textContent = msg || "";
    verifyMsg.className   = "verify-msg" + (msg ? (ok ? " is-ok" : " is-bad") : "");
  };

  verifyBtn?.addEventListener("click", async () => {
    const entered = otpCells.map(c => c.value).join("");
    if (entered !== _otpCode) {
      otpCells.forEach(c => {
        c.classList.add("is-error");
        window.setTimeout(() => c.classList.remove("is-error"), 500);
      });
      return setVerifyMsg("Code incorrect. Vérifiez et réessayez.", false);
    }

    setVerifyMsg("Code correct ! Création du compte…", true);
    verifyBtn.disabled = true;

    try {
      const { fn, ln, bd, em, pw } = _pendingData;
      const { user } = await createUserWithEmailAndPassword(auth, em, pw);
      await updateProfile(user, { displayName: `${fn} ${ln}` });
      await setDoc(doc(db, "users", user.uid), {
        firstName: fn, lastName: ln, birthdate: bd,
        email: em, displayName: `${fn} ${ln}`,
        emailVerified: true, createdAt: serverTimestamp()
      });
      setVerifyMsg("Compte créé ! Redirection…", true);
      window.setTimeout(() => {
        const url = new URL("index.html", window.location.href);
        url.searchParams.set("prefill", em);
        window.location.href = url.toString();
      }, 800);
    } catch (err) {
      setVerifyMsg(firebaseErrorFr(err.code), false);
      verifyBtn.disabled = false;
    }
  });

  // ── Renvoyer le code ──────────────────────────────────────
  resendCodeBtn?.addEventListener("click", async () => {
    if (_resendCooldown) return;
    _resendCooldown = true;
    resendCodeBtn.disabled = true;
    setVerifyMsg("Envoi en cours…", true);
    _otpCode = generateOTP();
    await sendOtpEmail(_otpEmail, _otpCode);
    otpCells.forEach(c => { c.value = ""; c.classList.remove("filled"); });
    if (verifyBtn) verifyBtn.disabled = true;
    setVerifyMsg("Nouveau code envoyé !", true);
    otpCells[0]?.focus();
    window.setTimeout(() => {
      _resendCooldown = false;
      resendCodeBtn.disabled = false;
      setVerifyMsg("");
    }, 30000);
  });

  // ── Erreurs Firebase ──────────────────────────────────────
  function firebaseErrorFr(code) {
    const map = {
      "auth/email-already-in-use":   "Un compte existe déjà avec cet email.",
      "auth/invalid-email":          "Adresse email invalide.",
      "auth/weak-password":          "Mot de passe trop faible.",
      "auth/network-request-failed": "Erreur réseau. Vérifiez votre connexion.",
      "auth/too-many-requests":      "Trop de tentatives. Réessayez plus tard.",
    };
    return map[code] || "Erreur lors de la création du compte. Réessayez.";
  }
})();
