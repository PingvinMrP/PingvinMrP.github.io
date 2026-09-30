/* Почта для Python — режим презентации */
(function () {
  "use strict";
  const P = window.PP, { $, $$, esc } = P;
  P.initChrome();

  $$("pre[data-py]").forEach(p => { p.innerHTML = P.hlPy(p.textContent); });
  $$("pre[data-json]").forEach(p => { p.innerHTML = P.hlJson(p.textContent); });

  /* интерактивный адрес */
  const URLP = [
    ["https://", "var(--stamp)", "протокол", "Способ доставки. s в https значит «защищённый»: письмо едет в запечатанном конверте."],
    ["jsonplaceholder.typicode.com", "var(--accent)", "домен", "Имя сервера — город и почтовое отделение."],
    ["/posts", "var(--ok)", "путь", "Раздел на сервере — улица."],
    ["/1", "var(--info)", "номер", "Конкретная запись — квартира."],
    ["?_limit=2", "var(--warn)", "параметры", "Уточнение запроса: «только первые две записи». В Python передаётся через params=."]
  ];
  $("#sUrl").innerHTML = URLP.map((u, i) => '<span class="up" tabindex="0" role="button" data-i="' + i + '" style="--c:' + u[1] + ';--row:' + (i % 3) + '">' + esc(u[0]) + "<small>" + esc(u[2]) + "</small></span>").join("");
  $$("#sUrl .up").forEach(el => {
    const act = e => { if (e) e.stopPropagation(); $$("#sUrl .up").forEach(x => x.classList.toggle("on", x === el)); const u = URLP[+el.dataset.i]; $("#sUrlExpl").innerHTML = "<b>" + esc(u[2]) + ".</b> " + esc(u[3]); $("#sUrlExpl").style.borderLeftColor = u[1]; };
    el.addEventListener("click", act);
    el.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); act(e); } });
  });

  const slides = $$(".slide");
  let i = 0;
  const startHash = parseInt((location.hash || "").replace("#s", ""), 10);
  if (startHash > 0 && startHash <= slides.length) i = startHash - 1;

  function show(n, dir) {
    i = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach((s, k) => { s.classList.toggle("on", k === i); s.classList.toggle("prev", k < i); });
    const frags = $$(".frag", slides[i]);
    frags.forEach(f => f.classList.toggle("shown", dir === "back"));
    $("#deckBar").style.width = ((i + 1) / slides.length * 100) + "%";
    $("#deckCount").textContent = (i + 1) + " / " + slides.length;
    $("#notes").innerHTML = "<b>Заметки для докладчика</b>" + esc(slides[i].dataset.notes || "Без заметок.");
    try { history.replaceState(null, "", "#s" + (i + 1)); } catch (e) { }
    if (i === slides.length - 1) { P.badge("slides"); P.addXP(10, "Презентация просмотрена", "slides"); }
  }
  function next() {
    const hidden = $$(".frag:not(.shown)", slides[i]);
    if (hidden.length) { hidden[0].classList.add("shown"); return; }
    if (i < slides.length - 1) show(i + 1, "fwd");
  }
  function prev() {
    const shown = $$(".frag.shown", slides[i]);
    if (shown.length) { shown[shown.length - 1].classList.remove("shown"); return; }
    if (i > 0) show(i - 1, "back");
  }
  $("#nextBtn").addEventListener("click", next);
  $("#prevBtn").addEventListener("click", prev);
  $("#notesBtn").addEventListener("click", () => { $("#notes").hidden = !$("#notes").hidden; });
  function fs() {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(() => { });
    } catch (e) { }
  }
  $("#fsBtn").addEventListener("click", fs);
  document.addEventListener("keydown", e => {
    if (e.target.closest && e.target.closest("input,textarea")) return;
    if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); next(); }
    else if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); prev(); }
    else if (e.key === "Home") show(0);
    else if (e.key === "End") show(slides.length - 1, "back");
    else if (e.key.toLowerCase() === "f" || e.key.toLowerCase() === "а") fs();
    else if (e.key.toLowerCase() === "n" || e.key.toLowerCase() === "т") $("#notes").hidden = !$("#notes").hidden;
  });
  /* свайп на телефоне */
  let tx = null;
  $("#stage").addEventListener("touchstart", e => { tx = e.touches[0].clientX; }, { passive: true });
  $("#stage").addEventListener("touchend", e => { if (tx == null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) dx < 0 ? next() : prev(); tx = null; });

  show(i, "fwd");
})();
