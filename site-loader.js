(() => {
  const loader = document.querySelector(".site-loader");
  if (loader) {
    const hideLoader = () => {
      window.setTimeout(() => {
        loader.classList.add("is-hidden");
      }, 350);
    };

    if (document.readyState === "complete") {
      hideLoader();
    } else {
      window.addEventListener("load", hideLoader, { once: true });
      // Fallback por si algún asset externo nunca termina de cargar
      window.setTimeout(hideLoader, 4000);
    }

    loader.addEventListener(
      "transitionend",
      () => {
        if (loader.classList.contains("is-hidden")) loader.remove();
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
      track.style.animationDuration = `${duration}s`;
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncMarqueeSpeed, { once: true });
  } else {
    syncMarqueeSpeed();
  }
  window.addEventListener("load", syncMarqueeSpeed, { once: true });
})();
