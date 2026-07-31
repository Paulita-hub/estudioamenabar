(() => {
  const loader = document.querySelector(".site-loader");
  if (loader) {
    let hidden = false;
    const removeLoader = () => {
      if (!loader.isConnected) return;
      loader.remove();
    };
    const hideLoader = () => {
      if (hidden) return;
      hidden = true;
      window.setTimeout(() => {
        loader.classList.add("is-hidden");
        // Si el CSS cacheado no aplica la transición, igual lo sacamos del DOM
        window.setTimeout(removeLoader, 600);
      }, 350);
    };

    if (document.readyState === "complete") {
      hideLoader();
    } else {
      window.addEventListener("load", hideLoader, { once: true });
      // Fallback por si algún asset externo nunca termina de cargar
      window.setTimeout(hideLoader, 2500);
    }

    loader.addEventListener(
      "transitionend",
      (event) => {
        if (event.target === loader && loader.classList.contains("is-hidden")) {
          removeLoader();
        }
      },
      { once: true },
    );
  }

  // Misma velocidad lineal en todos los marquees (px/s), sin importar el largo del texto
  const syncMarqueeSpeed = () => {
    const pxPerSecond = 36;
    document.querySelectorAll(".marquee__track").forEach((track) => {
      const half = track.scrollWidth / 2;
      if (!half) return;
      const duration = Math.max(18, half / pxPerSecond);
      track.style.setProperty("--marquee-duration", `${duration}s`);
      track.style.removeProperty("animation-duration");
    });
  };

  const setupMarqueeHover = () => {
    if (!window.matchMedia("(hover: hover)").matches) return;

    const bindMarquee = (marquee) => {
      if (marquee.dataset.marqueeHoverBound) return;
      marquee.dataset.marqueeHoverBound = "1";
      const track = marquee.querySelector(".marquee__track");
      if (!track) return;

      const setRate = (rate) => {
        const apply = () => {
          const animations = track.getAnimations();
          if (!animations.length) return false;
          animations.forEach((animation) => {
            animation.playbackRate = rate;
          });
          return true;
        };
        if (!apply()) requestAnimationFrame(apply);
      };

      marquee.addEventListener("pointerenter", () => setRate(0.35));
      marquee.addEventListener("pointerleave", () => setRate(1));
    };

    // Home + páginas de proyecto (project-intro__marquee)
    document
      .querySelectorAll(".marquee, .project-intro__marquee")
      .forEach(bindMarquee);
  };

  const getLogoInkBounds = (logo) => {
    try {
      const width = logo.naturalWidth;
      const height = logo.naturalHeight;
      if (!width || !height) return null;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(logo, 0, 0);
      const { data } = ctx.getImageData(0, 0, width, height);

      let minX = width;
      let maxX = 0;
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          if (data[(y * width + x) * 4 + 3] > 8) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
          }
        }
      }
      if (maxX < minX) return null;
      return { minX, maxX, width };
    } catch (_) {
      return null;
    }
  };

  const fitHeroSubtitle = () => {
    const logo = document.querySelector(".hero__logo-img");
    const subtitle = document.querySelector(".hero__subtitle");
    const logoBox = document.querySelector(".hero__logo");
    if (!subtitle) return;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const breaks = subtitle.querySelectorAll(".hero__subtitle-br");

    let offsetLeft = 0;
    let targetWidth = 0;

    if (isMobile && logoBox) {
      const boxRect = logoBox.getBoundingClientRect();
      // Mismo margen izq/der respecto al círculo
      targetWidth = boxRect.width;
    } else if (logo) {
      const logoRect = logo.getBoundingClientRect();
      if (!logoRect.width) return;

      const ink = getLogoInkBounds(logo);
      const scale =
        logoRect.width / (ink?.width || logo.naturalWidth || logoRect.width);
      offsetLeft = ink ? ink.minX * scale : 0;
      targetWidth = ink
        ? (ink.maxX - ink.minX + 1) * scale
        : logoRect.width;
    }

    if (!targetWidth) return;

    subtitle.style.setProperty("display", "block");
    subtitle.style.setProperty("box-sizing", "border-box");
    subtitle.style.setProperty("max-width", "none");
    subtitle.style.setProperty("font-weight", "700");
    subtitle.style.setProperty("letter-spacing", "normal");

    if (isMobile) {
      // nowrap: solo los <br> parten líneas ("desarrollo web" no se parte)
      subtitle.style.setProperty("position", "absolute");
      subtitle.style.setProperty("white-space", "nowrap");
      subtitle.style.setProperty("text-align", "left");
      subtitle.style.setProperty("margin-left", "0");
      subtitle.style.setProperty("left", "0");
      subtitle.style.setProperty("top", "50%");
      subtitle.style.setProperty("transform", "translateY(-50%)");
      breaks.forEach((br) => br.style.setProperty("display", "block"));
    } else {
      // Desktop: una línea contenida en el ancho de tinta del logo
      subtitle.style.setProperty("position", "relative");
      subtitle.style.setProperty("white-space", "nowrap");
      subtitle.style.setProperty("text-align", "left");
      subtitle.style.setProperty("margin-left", `${offsetLeft}px`);
      subtitle.style.setProperty("top", "auto");
      subtitle.style.setProperty("left", "auto");
      subtitle.style.setProperty("right", "auto");
      subtitle.style.setProperty("transform", "none");
      subtitle.style.setProperty("overflow", "hidden");
      breaks.forEach((br) => br.style.setProperty("display", "none"));
    }

    // max-content: scrollWidth = línea más larga (no el ancho forzado)
    subtitle.style.setProperty("width", "max-content");

    let low = 12;
    let high = Math.min(isMobile ? 200 : 160, targetWidth / (isMobile ? 3 : 5));
    for (let i = 0; i < 24; i += 1) {
      const mid = (low + high) / 2;
      subtitle.style.fontSize = `${mid}px`;
      if (subtitle.scrollWidth <= targetWidth + 0.5) low = mid;
      else high = mid;
    }
    const subtitleSize = low;
    // Servicios más chicos que el subtítulo en mobile; en desktop mismo size
    const servicesSize = isMobile ? subtitleSize / 1.286 : subtitleSize;
    subtitle.style.fontSize = `${subtitleSize}px`;
    subtitle.style.setProperty("width", `${targetWidth}px`);
    document.documentElement.style.setProperty(
      "--text-hero-subtitle",
      `${servicesSize}px`
    );
  };

  const initMarquee = () => {
    syncMarqueeSpeed();
    setupMarqueeHover();
  };

  const initHeroSubtitle = () => {
    const logo = document.querySelector(".hero__logo-img");
    const run = () => {
      fitHeroSubtitle();
      if (document.fonts?.ready) {
        document.fonts.ready.then(fitHeroSubtitle).catch(() => {});
      }
    };
    if (logo && !logo.complete) {
      logo.addEventListener("load", run, { once: true });
    }
    run();
  };

  const initGlassCursor = () => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!finePointer.matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cursor = document.createElement("div");
    cursor.className = "glass-cursor";
    cursor.setAttribute("aria-hidden", "true");
    document.body.appendChild(cursor);
    document.documentElement.classList.add("has-glass-cursor");

    let x = 0;
    let y = 0;
    let visible = false;

    const interactiveSelector =
      "a, button, [role='button'], input, textarea, select, label, summary, .nav-toggle, .proyectos-carousel__btn, .proyectos-carousel__dot, .project-view-toggle__btn";

    const move = (clientX, clientY) => {
      x = clientX;
      y = clientY;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      if (!visible) {
        visible = true;
        cursor.classList.add("is-visible");
      }
    };

    window.addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType && event.pointerType !== "mouse") return;
        move(event.clientX, event.clientY);
      },
      { passive: true }
    );

    document.addEventListener("pointerover", (event) => {
      if (event.target?.closest?.(interactiveSelector)) {
        cursor.classList.add("is-hover");
      }
    });

    document.addEventListener("pointerout", (event) => {
      if (event.target?.closest?.(interactiveSelector)) {
        cursor.classList.remove("is-hover");
      }
    });

    document.addEventListener("pointerdown", () => {
      cursor.classList.add("is-down");
    });
    document.addEventListener("pointerup", () => {
      cursor.classList.remove("is-down");
    });

    document.addEventListener("mouseleave", () => {
      visible = false;
      cursor.classList.remove("is-visible", "is-hover", "is-down");
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMarquee, { once: true });
    document.addEventListener("DOMContentLoaded", initHeroSubtitle, { once: true });
    document.addEventListener("DOMContentLoaded", initGlassCursor, { once: true });
  } else {
    initMarquee();
    initHeroSubtitle();
    initGlassCursor();
  }
  window.addEventListener("load", initMarquee, { once: true });
  window.addEventListener("load", initHeroSubtitle, { once: true });
  window.addEventListener("resize", fitHeroSubtitle);
})();
