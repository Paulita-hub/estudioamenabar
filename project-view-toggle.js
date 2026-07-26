(function () {
  const toggle = document.querySelector(".project-view-toggle");
  const stage = document.querySelector("[data-mockup-stage]");
  const frame = document.querySelector("[data-mac-frame]");
  const macPreview = document.querySelector("[data-mac-preview]");
  const macScreen = document.querySelector("[data-mac-screen]");
  if (!toggle || !stage || !frame) return;

  const track = toggle.querySelector(".project-view-toggle__track");
  const buttons = Array.from(toggle.querySelectorAll("[data-view]"));
  if (!buttons.length) return;

  const desktopSrc = frame.dataset.frameDesktop || frame.getAttribute("src");
  const mobileSrc = frame.dataset.frameMobile;
  if (!mobileSrc) return;

  const dualTriggers = Array.from(
    document.querySelectorAll("[data-src-desktop][data-src-mobile]")
  );

  function applySlideSources(view) {
    const isMobile = view === "mobile";
    dualTriggers.forEach((trigger) => {
      const src = isMobile ? trigger.dataset.srcMobile : trigger.dataset.srcDesktop;
      if (!src) return;
      if ("lightboxSrc" in trigger.dataset || trigger.hasAttribute("data-lightbox-src")) {
        trigger.dataset.lightboxSrc = src;
      }
      if (trigger === macPreview || trigger.matches?.("img[data-mac-preview]")) return;
      const img = trigger.querySelector("img");
      if (img) img.src = src;
    });
  }

  function syncActivePreview() {
    if (!macPreview) return;
    const view = stage.dataset.view || "desktop";
    const isMobile = view === "mobile";
    const active = document.querySelector(
      ".proyectos-carousel__slide.is-active [data-lightbox-src]"
    );
    const src =
      active?.dataset.lightboxSrc ||
      (isMobile
        ? macPreview.dataset.srcMobile || macScreen?.dataset.srcMobile
        : macPreview.dataset.srcDesktop || macScreen?.dataset.srcDesktop) ||
      macPreview.getAttribute("src");
    if (!src) return;

    if (macScreen) macScreen.dataset.lightboxSrc = src;

    if (macPreview.getAttribute("src") === src) {
      if (macScreen) macScreen.scrollTop = 0;
      return;
    }

    macPreview.style.opacity = "0.35";
    window.setTimeout(() => {
      macPreview.onload = () => {
        if (macScreen) macScreen.scrollTop = 0;
        macPreview.style.opacity = "1";
        macPreview.onload = null;
      };
      macPreview.src = src;
      if (macPreview.complete) {
        if (macScreen) macScreen.scrollTop = 0;
        macPreview.style.opacity = "1";
        macPreview.onload = null;
      }
    }, 80);
  }

  function setView(view) {
    const isMobile = view === "mobile";
    stage.dataset.view = view;
    if (track) track.dataset.view = view;
    frame.src = isMobile ? mobileSrc : desktopSrc;
    frame.alt = isMobile ? "Mockup mobile del proyecto" : "Mockup web del proyecto";

    applySlideSources(view);
    syncActivePreview();

    const screen = document.querySelector("[data-mac-screen]");
    if (screen) {
      if (isMobile) {
        screen.removeAttribute("role");
        screen.setAttribute("aria-label", "Vista mobile del sitio — scrollear para ver más");
      } else {
        screen.setAttribute("role", "button");
        screen.setAttribute("aria-label", "Ampliar captura del sitio");
      }
    }

    buttons.forEach((btn) => {
      const active = btn.dataset.view === view;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  buttons.forEach((btn) => {
    btn.setAttribute("aria-pressed", btn.classList.contains("is-active") ? "true" : "false");
    btn.addEventListener("click", () => setView(btn.dataset.view));
  });
})();
