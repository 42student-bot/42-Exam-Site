(() => {
  // --- Forcer reload si page restaurée depuis bfcache ---
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) window.location.reload();
  });

  window.__APP_LOADED__ = true;
  window.__BUILD__ = "20260308-1";

  // ── Scroll check ──────────────────────────────────────
  const checkScroll = () => {
    const card = document.querySelector(".card");
    if (!card) return;
    document.body.classList.toggle(
      "allow-scroll",
      card.scrollHeight > window.innerHeight
    );
  };
  window.addEventListener("load", checkScroll);
  window.addEventListener("resize", checkScroll);

  // ── Éléments ──────────────────────────────────────────
  const views       = document.getElementById("views");
  const requestForm = document.getElementById("requestForm");
  const sentView    = document.getElementById("sentView");
  const forgotEmail = document.getElementById("forgotEmail");
  const requestMsg  = document.getElementById("requestMsg");
  const sentEmail   = document.getElementById("sentEmail");
  const resendBtn   = document.getElementById("resendBtn");
  const resendMsg   = document.getElementById("resendMsg");
  const backToLoginBtn  = document.getElementById("backToLoginBtn");
  const backToLoginBtn2 = document.getElementById("backToLoginBtn2");

  // ── Helpers messages ──────────────────────────────────
  const setMsg = (el, msg, ok = false) => {
    if (!el) return;
    el.textContent = msg || "";
    el.classList.toggle("is-ok",  ok);
    el.classList.toggle("is-bad", !ok && !!msg);
  };

  // ── Helpers hidden / inert ─────────────────────────────
  const setHidden = (el, hidden) => {
    if (!el) return;
    el.setAttribute("aria-hidden", hidden ? "true" : "false");
    if ("inert" in el) el.inert = !!hidden;
  };

  // ── Animation swap entre deux vues ────────────────────
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

  // ── Animation d'entrée initiale ───────────────────────
  document.documentElement.classList.add("js-viewboot");

  // Initialiser les vues
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

  // ── Soumission du formulaire de demande ───────────────
  requestForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    setMsg(requestMsg, "");

    const em = (forgotEmail?.value || "").trim();

    if (!/^\S+@\S+\.\S+$/.test(em)) {
      forgotEmail?.setAttribute("aria-invalid", "true");
      forgotEmail?.focus();
      return setMsg(requestMsg, "Adresse email invalide.", false);
    }

    forgotEmail?.removeAttribute("aria-invalid");

    // Simuler un envoi (front-only)
    setMsg(requestMsg, "Envoi en cours…", true);

    window.setTimeout(() => {
      // Afficher l'email masqué dans la vue confirmation
      if (sentEmail) sentEmail.textContent = maskEmail(em);

      // Stocker pour le renvoi
      requestForm.dataset.lastEmail = em;

      // Transition vers la vue "sent"
      animateSwap(requestForm, sentView, "sent");
      setMsg(requestMsg, "");

      checkScroll();
    }, 640);
  });

  // ── Bouton "Renvoyer un lien" ──────────────────────────
  let resendCooldown = false;

  resendBtn?.addEventListener("click", () => {
    if (resendCooldown) return;

    resendCooldown = true;
    resendBtn.disabled = true;
    setMsg(resendMsg, "Lien renvoyé.", true);

    window.setTimeout(() => {
      resendCooldown = false;
      resendBtn.disabled = false;
      setMsg(resendMsg, "");
    }, 4000);
  });

  // ── Boutons retour connexion ───────────────────────────
  const goLogin = () => { window.location.href = "index.html"; };
  backToLoginBtn?.addEventListener("click", goLogin);
  backToLoginBtn2?.addEventListener("click", goLogin);

  // ── Utilitaire : masquer partiellement l'email ─────────
  const maskEmail = (email) => {
    const [user, domain] = email.split("@");
    if (!domain) return email;
    const visible = user.length > 2 ? user[0] + "•".repeat(user.length - 2) + user[user.length - 1] : user[0] + "•";
    return `${visible}@${domain}`;
  };

})();
