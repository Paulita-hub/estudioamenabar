(function () {
  function slideSrc(slide) {
    const trigger = slide.querySelector("[data-lightbox-src]");
    if (trigger?.dataset.lightboxSrc) return trigger.dataset.lightboxSrc;
    return slide.querySelector("img")?.currentSrc || slide.querySelector("img")?.src || "";
  }

  function initCarousel(root) {
    const track = root.querySelector(".proyectos-carousel__track");
    const slides = Array.from(root.querySelectorAll(".proyectos-carousel__slide"));
    const dots = Array.from(root.querySelectorAll(".proyectos-carousel__dot"));
    const prevBtn = root.querySelector("[data-carousel-prev]");
    const nextBtn = root.querySelector("[data-carousel-next]");
    const scope = root.closest("[data-carousel-scope]") || document;
    const macPreview = scope.querySelector("[data-mac-preview]");
    const macScreen = scope.querySelector("[data-mac-screen]");
    const duoPreview = scope.querySelector("[data-duo-preview]");
    const count = slides.length;
    if (!track || !count) return;

    let activeIndex = root.hasAttribute("data-flat-carousel")
      ? 0
      : Math.min(2, count - 1);
    const flat = root.hasAttribute("data-flat-carousel");

    function resetMacScroll() {
      if (macScreen) macScreen.scrollTop = 0;
    }

    function syncPreview(img) {
      if (!img) return;
      const src = slideSrc(slides[activeIndex]);
      if (!src) return;
      const zoom = img.closest("[data-lightbox-src]");
      if (zoom) zoom.dataset.lightboxSrc = src;
      if (img.getAttribute("src") === src) {
        resetMacScroll();
        return;
      }
      img.style.opacity = "0.35";
      window.setTimeout(() => {
        img.onload = () => {
          resetMacScroll();
          img.style.opacity = "1";
          img.onload = null;
        };
        img.src = src;
        if (img.complete) {
          resetMacScroll();
          img.style.opacity = "1";
          img.onload = null;
        }
      }, 100);
    }

    function update() {
      track.style.transform = `translate3d(${(-activeIndex * 100) / count}%, 0, 0)`;

      slides.forEach((slide, i) => {
        const isActive = i === activeIndex;
        slide.classList.toggle("is-active", isActive);
        slide.style.setProperty("--carousel-rotate", flat ? "0deg" : `${(activeIndex - i) * 60}deg`);
        slide.style.setProperty("--carousel-scale", flat ? (isActive ? "1" : "0.92") : isActive ? "1" : "0.85");
        slide.style.setProperty("--carousel-opacity", isActive ? "1" : "0");
        slide.style.setProperty("--carousel-blur", isActive ? "0px" : "2px");
        slide.setAttribute("aria-hidden", isActive ? "false" : "true");
      });

      dots.forEach((dot, i) => {
        const isActive = i === activeIndex;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-selected", String(isActive));
      });

      if (prevBtn) prevBtn.disabled = activeIndex === 0;
      if (nextBtn) nextBtn.disabled = activeIndex === count - 1;

      syncPreview(macPreview);
      syncPreview(duoPreview);
      root.dispatchEvent(
        new CustomEvent("proyectos-carousel:change", {
          detail: { index: activeIndex },
          bubbles: true,
        })
      );
    }

    function goTo(index) {
      activeIndex = Math.max(0, Math.min(count - 1, index));
      update();
    }

    prevBtn?.addEventListener("click", () => goTo(activeIndex - 1));
    nextBtn?.addEventListener("click", () => goTo(activeIndex + 1));

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        const index = Number(dot.dataset.slide);
        if (!Number.isNaN(index)) goTo(index);
      });
    });

    slides.forEach((slide, i) => {
      const media = slide.querySelector(".proyecto-card__media, .proyecto-card__poster");
      media?.addEventListener("click", (event) => {
        if (i !== activeIndex) {
          event.preventDefault();
          event.stopPropagation();
          goTo(i);
        }
      });
    });

    slides.forEach((slide, i) => {
      const link = slide.querySelector(".proyecto-card-link");
      link?.addEventListener("click", (event) => {
        if (i !== activeIndex) {
          event.preventDefault();
          goTo(i);
        }
      });
    });

    update();
  }

  document.querySelectorAll("[data-proyectos-carousel]").forEach(initCarousel);
})();
