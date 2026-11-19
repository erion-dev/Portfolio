/* Lecture d'animateur dans la visionneuse : règle de temps à 24 images/s,
   pas à pas (← →) et « papier calque » (image précédente en bleu, suivante en rouge). */
(function () {
  'use strict';
  const ecran = document.getElementById('visionneuse-ecran');
  const dlg = document.getElementById('visionneuse');
  if (!ecran || !dlg) return;
  const FPS = 24;
  const num = (n) => String(n).padStart(4, '0');

  const css = document.createElement('style');
  css.textContent = `
#visionneuse-ecran{position:relative}
.lecture{display:flex;align-items:center;gap:.6rem;margin-top:.8rem;font:600 .8125rem/1 "Funnel Sans",system-ui,sans-serif}
.lecture button{flex:none;display:inline-flex;align-items:center;justify-content:center;min-width:2.25rem;height:2.25rem;padding:0 .7rem;border:1.5px solid currentColor;border-radius:.5rem;background:transparent;color:inherit;font:inherit;cursor:pointer;opacity:.8}
.lecture button:hover,.lecture button:focus-visible{opacity:1;background:color-mix(in srgb,currentColor 10%,transparent)}
.lecture button[aria-pressed="true"]{opacity:1;color:#BF3527;border-color:#BF3527;background:color-mix(in srgb,#BF3527 14%,transparent)}
.regle{position:relative;flex:1;min-width:0;height:2.25rem;border-radius:.5rem;overflow:hidden;cursor:ew-resize;touch-action:none;background:color-mix(in srgb,currentColor 7%,transparent)}
.regle canvas{position:absolute;inset:0;width:100%;height:100%}
.regle .tete{position:absolute;top:0;bottom:0;width:2px;margin-left:-1px;background:#BF3527}
.regle .tete::before{content:"";position:absolute;top:0;left:-4px;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid #BF3527}
.lecture .num{flex:none;min-width:3.2rem;text-align:right;font-variant-numeric:tabular-nums;letter-spacing:.04em}
.calque-toile{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;mix-blend-mode:multiply;opacity:.55}`;
  document.head.append(css);

  const fleche = (d) => '<svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true"><path d="' + d + '" fill="currentColor"/></svg>';

  function equiper(v) {
    document.querySelectorAll('.lecture').forEach((b) => b.remove());
    const bar = document.createElement('div');
    bar.className = 'lecture';
    bar.innerHTML =
      '<button type="button" data-pas="-1" title="Image précédente (←)" aria-label="Image précédente">' + fleche('M9 1L1 6l8 5z') + '</button>' +
      '<button type="button" data-pas="1" title="Image suivante (→)" aria-label="Image suivante">' + fleche('M1 1l8 5-8 5z') + '</button>' +
      '<div class="regle" aria-hidden="true"><canvas></canvas><span class="tete"></span></div>' +
      '<output class="num" aria-label="Numéro de l\'image">0001</output>' +
      '<button type="button" class="calque" aria-pressed="false" title="Papier calque : image précédente en bleu, suivante en rouge">Calque</button>';
    ecran.after(bar);
    const regle = bar.querySelector('.regle'), toile = regle.querySelector('canvas');
    const tete = bar.querySelector('.tete'), sortie = bar.querySelector('.num');
    const bCalque = bar.querySelector('.calque');

    const total = () => Math.max(1, Math.round((v.duration || 0) * FPS));
    const image = () => Math.floor(v.currentTime * FPS + 0.001);
    const aller = (f) => { v.pause(); v.currentTime = (Math.min(total() - 1, Math.max(0, f)) + 0.5) / FPS; };

    /* Règle : un trait toutes les 6 images, un trait long à chaque seconde. */
    function tracer() {
      const r = regle.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      if (r.width < 2 || !v.duration) return;
      toile.width = r.width * d;
      toile.height = r.height * d;
      const c = toile.getContext('2d');
      c.scale(d, d);
      c.fillStyle = c.strokeStyle = getComputedStyle(bar).color;
      c.font = '600 10px "Funnel Sans", system-ui, sans-serif';
      c.globalAlpha = 0.5;
      const n = total(), px = r.width / n, pas = px * FPS > 26 ? 1 : 5;
      for (let f = 0; f < n; f += 6) {
        const sec = f % FPS === 0, x = Math.round(f * px) + 0.5;
        c.beginPath();
        c.moveTo(x, r.height);
        c.lineTo(x, r.height - (sec ? 12 : 5));
        c.stroke();
        if (sec && (f / FPS) % pas === 0) c.fillText(String(f / FPS), x + 3, 11);
      }
    }
    if ('ResizeObserver' in window) new ResizeObserver(tracer).observe(regle);

    function boucle() {
      if (!bar.isConnected) return;
      tete.style.left = (v.duration ? (v.currentTime / v.duration) * 100 : 0) + '%';
      sortie.textContent = num(image() + 1);
      requestAnimationFrame(boucle);
    }
    requestAnimationFrame(boucle);

    const depuis = (e) => {
      const r = regle.getBoundingClientRect();
      aller(Math.floor(Math.min(0.999, Math.max(0, (e.clientX - r.left) / r.width)) * total()));
    };
    regle.addEventListener('pointerdown', (e) => { regle.setPointerCapture(e.pointerId); depuis(e); });
    regle.addEventListener('pointermove', (e) => { if (regle.hasPointerCapture(e.pointerId)) depuis(e); });
    bar.querySelectorAll('[data-pas]').forEach((b) => {
      b.addEventListener('click', () => aller(image() + Number(b.dataset.pas)));
    });

    /* Papier calque : deux copies de la vidéo, calées sur l'image d'avant et l'image d'après. */
    let actif = false;
    const calques = [['#2f6fed', -1], ['#BF3527', 1]].map(([couleur, pas]) => {
      const t = document.createElement('canvas');
      t.className = 'calque-toile';
      t.hidden = true;
      const g = document.createElement('video');
      g.muted = true;
      g.preload = 'metadata';
      g.playsInline = true;
      ecran.append(t);
      const k = { t, g, couleur, pas };
      g.addEventListener('seeked', () => calquer(k));
      return k;
    });
    function effacer(k) { k.t.width = ecran.clientWidth; k.t.height = ecran.clientHeight; }
    function calquer(k) {
      effacer(k);
      if (!actif || !k.g.videoWidth) return;
      const w = k.t.width, h = k.t.height, s = Math.min(w / k.g.videoWidth, h / k.g.videoHeight);
      const dw = k.g.videoWidth * s, dh = k.g.videoHeight * s, dx = (w - dw) / 2, dy = (h - dh) / 2;
      const c = k.t.getContext('2d');
      c.drawImage(k.g, dx, dy, dw, dh);
      c.globalCompositeOperation = 'multiply';
      c.fillStyle = k.couleur;
      c.fillRect(dx, dy, dw, dh);
    }
    function synchro() {
      calques.forEach((k) => {
        k.t.hidden = !actif || !v.paused;
        if (!actif || !v.paused) return;
        const f = image() + k.pas;
        if (f < 0 || f >= total()) effacer(k);
        else k.g.currentTime = (f + 0.5) / FPS;
      });
    }
    function source() {
      const s = v.currentSrc || v.src;
      calques.forEach((k) => { if (k.g.src !== s) k.g.src = s; });
      tracer();
    }
    bCalque.addEventListener('click', () => {
      actif = !actif;
      bCalque.setAttribute('aria-pressed', String(actif));
      if (actif) v.pause();
      synchro();
    });
    ['seeked', 'pause', 'play'].forEach((n) => v.addEventListener(n, synchro));
    v.addEventListener('loadedmetadata', source);
    if (v.readyState >= 1) source();
  }

  new MutationObserver(() => {
    const v = ecran.querySelector('video');
    if (!v) { document.querySelectorAll('.lecture').forEach((b) => b.remove()); return; }
    if (!v.dataset.equipe) { v.dataset.equipe = '1'; equiper(v); }
  }).observe(ecran, { childList: true });

  /* ← et → avancent d'une image tant que la visionneuse est ouverte. */
  document.addEventListener('keydown', (e) => {
    if (!dlg.open || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    const b = document.querySelector('.lecture [data-pas="' + (e.key === 'ArrowRight' ? 1 : -1) + '"]');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    b.click();
  }, true);
})();
