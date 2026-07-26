(() => {
  const dialog = document.querySelector("[data-project-lightbox]");
  const image = dialog?.querySelector(".project-lightbox__image");
  const closeButton = dialog?.querySelector("[data-lightbox-close]");
  const prevButton = dialog?.querySelector("[data-lightbox-prev]");
  const nextButton = dialog?.querySelector("[data-lightbox-next]");
  const macScreen = document.querySelector("[data-mac-screen]");
  const allTriggers = Array.from(document.querySelectorAll("[data-lightbox-src]")).filter(
    (el) => el !== macScreen
  );

  if (!dialog || !image || !closeButton) return;
  if (!allTriggers.length && !macScreen?.dataset.lightboxSrc) return;

  let activeTriggers = [];
  let currentIndex = 0;
  let macPointerY = 0;
  let macScrolled = false;

  function uniqueBySrc(elements) {
    const list = [];
    const seen = new Set();
    elements.forEach((el) => {
      const src = el.dataset.lightboxSrc;
      if (!src || seen.has(src)) return;
      seen.add(src);
      list.push(el);
    });
    return list;
  }

  function galleryFor(trigger) {
    const scope = trigger?.closest("[data-carousel-scope]");
    const carousel =
      scope?.querySelector("[data-proyectos-carousel]") ||
      trigger?.closest("[data-proyectos-carousel]");

    if (carousel) {
      return uniqueBySrc(
        Array.from(carousel.querySelectorAll(".proyectos-carousel__slide [data-lightbox-src]"))
      );
    }

    const book = trigger?.closest("[data-mardel-book]");
    if (book) {
      return uniqueBySrc(Array.from(book.querySelectorAll("[data-lightbox-src]")));
    }

    return uniqueBySrc(allTriggers);
  }

  function updateNavVisibility() {
    if (activeTriggers.length <= 1) {
      prevButton?.setAttribute("hidden", "");
      nextButton?.setAttribute("hidden", "");
    } else {
      prevButton?.removeAttribute("hidden");
      nextButton?.removeAttribute("hidden");
    }
  }

  function indexForSrc(src) {
    const index = activeTriggers.findIndex((t) => t.dataset.lightboxSrc === src);
    return index >= 0 ? index : 0;
  }

  function showImage(index) {
    if (!activeTriggers.length) {
      image.src = macScreen?.dataset.lightboxSrc || "";
      image.alt = document.querySelector("[data-mac-preview]")?.alt ?? "";
      return;
    }
    currentIndex = (index + activeTriggers.length) % activeTriggers.length;
    const trigger = activeTriggers[currentIndex];
    const preview = trigger.querySelector("img");
    image.src = trigger.dataset.lightboxSrc;
    image.alt = preview?.alt ?? trigger.getAttribute("aria-label") ?? "";
  }

  function openAt(index) {
    showImage(index);
    if (!dialog.open) dialog.showModal();
  }

  function openFrom(trigger) {
    activeTriggers = galleryFor(trigger);
    updateNavVisibility();
    openAt(indexForSrc(trigger.dataset.lightboxSrc));
  }

  const closeDialog = () => dialog.close();
  const showPrev = () => showImage(currentIndex - 1);
  const showNext = () => showImage(currentIndex + 1);

  allTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      const slide = trigger.closest(".proyectos-carousel__slide");
      if (slide && !slide.classList.contains("is-active")) {
        event.preventDefault();
        return;
      }
      openFrom(trigger);
    });
  });

  const isMobileView = () =>
    document.querySelector("[data-mockup-stage]")?.dataset.view === "mobile";

  if (macScreen) {
    macScreen.addEventListener(
      "pointerdown",
      (event) => {
        macPointerY = event.clientY;
        macScrolled = false;
      },
      { passive: true }
    );

    macScreen.addEventListener(
      "scroll",
      () => {
        macScrolled = true;
      },
      { passive: true }
    );

    macScreen.addEventListener("click", (event) => {
      if (isMobileView()) return;
      if (macScrolled) return;
      if (Math.abs(event.clientY - macPointerY) > 8) return;
      const carousel = document.querySelector("[data-proyectos-carousel]");
      const activeSlide = carousel?.querySelector(".proyectos-carousel__slide.is-active");
      const trigger =
        activeSlide?.querySelector("[data-lightbox-src]") ||
        carousel?.querySelector("[data-lightbox-src]");
      if (trigger) {
        openFrom(trigger);
        return;
      }
      activeTriggers = [];
      updateNavVisibility();
      openAt(0);
    });

    macScreen.addEventListener("keydown", (event) => {
      if (isMobileView()) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      const carousel = document.querySelector("[data-proyectos-carousel]");
      const activeSlide = carousel?.querySelector(".proyectos-carousel__slide.is-active");
      const trigger =
        activeSlide?.querySelector("[data-lightbox-src]") ||
        carousel?.querySelector("[data-lightbox-src]");
      if (trigger) openFrom(trigger);
    });
  }

  closeButton.addEventListener("click", closeDialog);
  prevButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    showPrev();
  });
  nextButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    showNext();
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });

  dialog.addEventListener("keydown", (event) => {
    if (!dialog.open) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPrev();
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      showNext();
    }
  });

  dialog.addEventListener("close", () => {
    image.removeAttribute("src");
    image.alt = "";
    activeTriggers = [];
  });
})();
