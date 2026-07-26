(function () {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const hideDelayMs = 2000;
  const topThreshold = 12;
  let hideTimer = null;
  let ticking = false;

  function clearHideTimer() {
    if (hideTimer === null) return;
    window.clearTimeout(hideTimer);
    hideTimer = null;
  }

  function showNav() {
    header.classList.remove("is-nav-hidden");
  }

  function hideNav() {
    if (header.classList.contains("is-nav-open")) return;
    if (window.scrollY <= topThreshold) return;
    header.classList.add("is-nav-hidden");
  }

  function scheduleHide() {
    clearHideTimer();
    if (header.classList.contains("is-nav-open")) return;
    // Al inicio de la página la bar queda fija / visible
    if (window.scrollY <= topThreshold) {
      showNav();
      return;
    }
    hideTimer = window.setTimeout(() => {
      hideNav();
      hideTimer = null;
    }, hideDelayMs);
  }

  function onScrollActivity() {
    showNav();
    scheduleHide();

    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        header.classList.toggle("is-scrolled", window.scrollY > topThreshold);
        ticking = false;
      });
    }
  }

  // Inicio de página: sitebar fija y visible
  clearHideTimer();
  showNav();
  header.classList.toggle("is-scrolled", window.scrollY > topThreshold);

  window.addEventListener("scroll", onScrollActivity, { passive: true });
  window.addEventListener("wheel", onScrollActivity, { passive: true });
  window.addEventListener("touchmove", onScrollActivity, { passive: true });

  header.addEventListener("focusin", () => {
    clearHideTimer();
    showNav();
  });
})();

(function () {
  const servicios = document.getElementById("servicios");
  if (!servicios) return;

  function scrollToServicios() {
    servicios.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.querySelectorAll('a[href="#servicios"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      if (link.pathname !== window.location.pathname) return;

      event.preventDefault();
      scrollToServicios();
      history.pushState(null, "", "#servicios");
    });
  });

  if (window.location.hash === "#servicios") {
    requestAnimationFrame(scrollToServicios);
  }

  window.addEventListener("hashchange", () => {
    if (window.location.hash === "#servicios") {
      scrollToServicios();
    }
  });
})();

(function () {
  const items = Array.from(document.querySelectorAll(".services__item"));
  if (!items.length) return;

  function syncRowHeight(item) {
    const row = item.querySelector(".services__row");
    const projects = item.querySelector(".services__projects");
    if (!row || !projects) return;
    const height = Math.round(row.getBoundingClientRect().height);
    if (height > 0) {
      projects.style.setProperty("--services-row-height", `${height}px`);
    }
  }

  function closeItem(item) {
    const trigger = item.querySelector(".services__row");
    const panel = item.querySelector(".services__projects");
    item.classList.remove("is-open");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
    if (panel) panel.hidden = true;
  }

  function openItem(item) {
    items.forEach((other) => {
      if (other !== item) closeItem(other);
    });
    const trigger = item.querySelector(".services__row");
    const panel = item.querySelector(".services__projects");
    syncRowHeight(item);
    item.classList.add("is-open");
    if (trigger) trigger.setAttribute("aria-expanded", "true");
    if (panel) panel.hidden = false;
  }

  items.forEach((item) => {
    const trigger = item.querySelector(".services__row");
    if (!trigger) return;

    syncRowHeight(item);

    trigger.addEventListener("click", () => {
      if (item.classList.contains("is-open")) closeItem(item);
      else openItem(item);
    });
  });

  window.addEventListener(
    "resize",
    () => {
      items.forEach((item) => {
        if (item.classList.contains("is-open")) syncRowHeight(item);
      });
    },
    { passive: true }
  );
})();

(function () {
  const navLinks = Array.from(
    document.querySelectorAll(".site-nav__link[href^='#']")
  ).filter((link) => {
    const id = link.getAttribute("href")?.slice(1);
    return id && document.getElementById(id);
  });

  if (!navLinks.length) return;

  const linksById = new Map(
    navLinks.map((link) => [link.getAttribute("href").slice(1), link])
  );

  const sections = Array.from(linksById.keys())
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  function setActive(id) {
    linksById.forEach((link, sectionId) => {
      link.classList.toggle("is-active", sectionId === id);
    });
  }

  const visible = new Map();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        visible.set(
          entry.target.id,
          entry.isIntersecting ? entry.intersectionRatio : 0
        );
      });

      let bestId = null;
      let bestRatio = 0;

      visible.forEach((ratio, id) => {
        if (ratio > bestRatio) {
          bestRatio = ratio;
          bestId = id;
        }
      });

      if (bestId) setActive(bestId);
      else setActive(null);
    },
    {
      root: null,
      rootMargin: "-20% 0px -45% 0px",
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
    }
  );

  sections.forEach((section) => observer.observe(section));
})();

(function () {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (!header || !toggle || !nav) return;

  const mq = window.matchMedia("(max-width: 768px)");

  function setOpen(open) {
    header.classList.toggle("is-nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    document.body.classList.toggle("nav-lock", open && mq.matches);
    if (open) header.classList.remove("is-nav-hidden");
  }

  function close() {
    setOpen(false);
  }

  toggle.addEventListener("click", () => {
    setOpen(!header.classList.contains("is-nav-open"));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", close);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close();
  });

  function onMqChange() {
    if (!mq.matches) close();
  }

  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", onMqChange);
  } else {
    mq.addListener(onMqChange);
  }
})();

(function () {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const submit = form.querySelector(".contact-form__submit");
  const status = form.querySelector("[data-contact-status]");
  const endpoint =
    form.getAttribute("action") ||
    "https://formsubmit.co/ajax/amenabarestudio@gmail.com";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (form.classList.contains("is-sent") || form.classList.contains("is-sending")) {
      return;
    }

    form.classList.add("is-sending");
    if (submit) {
      submit.disabled = true;
      submit.textContent = "ENVIANDO…";
    }
    if (status) {
      status.hidden = true;
      status.textContent = "ENVIADO";
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error("send-failed");

      form.classList.remove("is-sending");
      form.classList.add("is-sent");
      form.reset();
      if (status) status.hidden = false;
    } catch (error) {
      form.classList.remove("is-sending");
      if (submit) {
        submit.disabled = false;
        submit.textContent = "ENVIAR";
      }
      if (status) {
        status.textContent = "ERROR — INTENTÁ DE NUEVO";
        status.hidden = false;
      }
    }
  });
})();
