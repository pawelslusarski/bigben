// Menu na telefonie
const przelacznik = document.querySelector(".menu-przelacznik");
const nawigacja = document.querySelector(".nawigacja");
if (przelacznik && nawigacja) {
  przelacznik.addEventListener("click", () => {
    const otwarte = nawigacja.toggleAttribute("data-otwarte");
    przelacznik.setAttribute("aria-expanded", String(otwarte));
  });
}

// Baner: kropki + automatyczna zmiana slajdu
const tor = document.querySelector(".baner__tor");
if (tor) {
  const kropki = [...document.querySelectorAll(".baner__kropki button")];
  const ile = kropki.length;
  let biezacy = 0;
  const pokaz = (i) => tor.scrollTo({ left: i * tor.clientWidth, behavior: "smooth" });
  const oznacz = () => {
    biezacy = Math.round(tor.scrollLeft / tor.clientWidth);
    kropki.forEach((k, i) => k.setAttribute("aria-current", String(i === biezacy)));
  };
  kropki.forEach((k, i) => k.addEventListener("click", () => { pokaz(i); zatrzymaj(); }));
  tor.addEventListener("scroll", oznacz, { passive: true });
  let zegar = null;
  const zatrzymaj = () => clearInterval(zegar);
  if (ile > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    zegar = setInterval(() => pokaz((biezacy + 1) % ile), 7000);
    tor.addEventListener("pointerdown", zatrzymaj, { once: true });
    tor.addEventListener("focusin", zatrzymaj, { once: true });
  }
}
