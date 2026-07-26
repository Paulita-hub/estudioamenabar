(function () {
  const book = document.querySelector("[data-mardel-book]");
  const carousel = document.querySelector("[data-proyectos-carousel][data-mardel-player]");
  if (!book) return;

  const flipPages = Array.from(book.querySelectorAll(".mardel-pages__page--flip"));
  const maxFlip = flipPages.length;
  let current = -1;
  let turnTimer = 0;

  book.classList.add("mardel-pages--controlled");

  function applyZIndexes(activeIndex, turningIndex) {
    const total = flipPages.length;
    flipPages.forEach((page, i) => {
      const flipped = i < activeIndex;
      let z;
      if (i === turningIndex) {
        z = total + 20;
      } else if (flipped) {
        z = i + 1;
      } else {
        z = total - i + 10;
      }
      page.style.setProperty("--mardel-z", String(z));
    });
  }

  function setStep(index, { animate = true } = {}) {
    const next = Math.max(0, Math.min(maxFlip, index));
    if (next === current) {
      applyZIndexes(current, -1);
      book.classList.toggle("is-cover-only", current === 0);
      book.classList.toggle("is-back-cover", current === maxFlip);
      return;
    }

    const turningIndex = animate && current >= 0 ? (next > current ? next - 1 : current - 1) : -1;

    applyZIndexes(next, turningIndex);
    window.clearTimeout(turnTimer);
    if (turningIndex >= 0) {
      turnTimer = window.setTimeout(() => {
        applyZIndexes(next, -1);
      }, 720);
    }

    current = next;
    book.classList.toggle("is-cover-only", current === 0);
    book.classList.toggle("is-back-cover", current === maxFlip);

    flipPages.forEach((page, i) => {
      page.classList.toggle("is-flipped", i < current);
    });
  }

  setStep(0, { animate: false });

  if (!carousel) return;

  carousel.addEventListener("proyectos-carousel:change", (event) => {
    const index = Number(event.detail?.index);
    if (!Number.isNaN(index)) setStep(index);
  });
})();
