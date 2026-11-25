/* Deux ajouts :
   1. une « feuille de production » sous le titre Travaux : projets, durée et images, calculés depuis config.js,
      dont le compteur tourne à 24 images par seconde ;
   2. un lien direct par projet (monsite/#eveil ouvre la vidéo) et un bouton « Copier le lien ». */
(function () {
  'use strict';
  const S = window.SITE || {};
  const projets = Array.isArray(S.projets) ? S.projets : [];
  if (!projets.length) return;
  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const secondes = (d) => { const p = String(d || '').split(':').map(Number); return p.length === 2 ? p[0] * 60 + p[1] : p[0] || 0; };
  const slug = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const css = document.createElement('style');
  css.textContent = `
.production{display:grid;grid-template-columns:repeat(3,auto);justify-content:start;margin:1.6rem 0 2.2rem;padding:0;border-top:1px solid color-mix(in srgb,currentColor 22%,transparent);border-bottom:1px solid color-mix(in srgb,currentColor 22%,transparent)}
.production>div{padding:1rem 2.4rem 1rem 0;margin-right:2.4rem;border-right:1px dashed color-mix(in srgb,currentColor 28%,transparent)}
.production>div:last-child{margin-right:0;padding-right:0;border-right:0}
.production dt{display:flex;align-items:center;gap:.5rem;font:600 .72rem/1.2 "Funnel Sans",system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;opacity:.65}
.production dt::before{content:"";flex:none;width:.45rem;height:.45rem;border-radius:50%;background:#BF3527}
.production dd{margin:.6rem 0 0;font:800 clamp(1.3rem,4.2vw,2.6rem)/1 "Funnel Display","Funnel Sans",system-ui,sans-serif;font-variant-numeric:tabular-nums;letter-spacing:-.01em}
@media (max-width:640px){.production{grid-template-columns:repeat(3,1fr)}.production>div{padding:.9rem .7rem .9rem 0;margin-right:.7rem}}
.copier{margin-top:.7rem;padding:.45rem .8rem;border:1.5px solid currentColor;border-radius:.5rem;background:transparent;color:inherit;font:600 .8125rem/1 "Funnel Sans",system-ui,sans-serif;cursor:pointer;opacity:.8}
.copier:hover,.copier:focus-visible{opacity:1;background:color-mix(in srgb,currentColor 10%,transparent)}`;
  document.head.append(css);

  /* ---------- Feuille de production ---------- */
  const intro = document.querySelector('#travaux .intro');
  if (intro) {
    const total = projets.reduce((n, p) => n + secondes(p.duree), 0);
    const cellules = [
      ['Projets', projets.length, (v) => String(Math.round(v))],
      ['Durée animée', total, (v) => { v = Math.round(v); return Math.floor(v / 60) + ' min ' + String(v % 60).padStart(2, '0') + ' s'; }],
      ['Images à 24 i/s', total * 24, (v) => Math.round(v).toLocaleString('fr-FR')]
    ];
    const dl = document.createElement('dl');
    dl.className = 'production';
    const valeurs = cellules.map(([nom, , fmt]) => {
      const bloc = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = nom;
      bloc.append(dt, dd);
      dl.append(bloc);
      return dd;
    });
    const afficher = (p) => cellules.forEach(([, v, fmt], i) => { valeurs[i].textContent = fmt(v * p); });
    afficher(1);
    intro.after(dl);
    if (!reduit && 'IntersectionObserver' in window) {
      afficher(0);
      const vue = new IntersectionObserver((e) => {
        if (!e[0].isIntersecting) return;
        vue.disconnect();
        let f = 0;
        const t = setInterval(() => {
          f += 1;
          afficher(1 - Math.pow(1 - f / 30, 3));  // 30 images, ralenti à l'arrivée
          if (f >= 30) clearInterval(t);
        }, 1000 / 24);
      }, { threshold: 0.6 });
      vue.observe(dl);
    }
  }

  /* ---------- Liens directs vers les projets ---------- */
  const liste = document.getElementById('liste-projets');
  const dlg = document.getElementById('visionneuse');
  const entete = document.querySelector('.visionneuse-haut > div');
  if (!liste || !dlg || !entete) return;
  const slugs = projets.map((p) => slug(p.titre || ''));
  const lignes = () => Array.from(liste.querySelectorAll('.ligne'));

  const copier = document.createElement('button');
  copier.type = 'button';
  copier.className = 'copier';
  copier.textContent = 'Copier le lien';
  copier.hidden = true;
  entete.append(copier);
  copier.addEventListener('click', () => {
    const fait = () => { copier.textContent = 'Lien copié'; setTimeout(() => { copier.textContent = 'Copier le lien'; }, 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(fait).catch(() => {});
  });

  liste.addEventListener('click', (e) => {
    const i = lignes().indexOf(e.target.closest('.ligne'));
    if (i < 0) return;
    history.replaceState(null, '', '#' + slugs[i]);
    copier.hidden = false;
  });
  const showreel = document.querySelector('[data-showreel]');
  if (showreel) showreel.addEventListener('click', () => { copier.hidden = true; });
  dlg.addEventListener('close', () => {
    copier.hidden = true;
    if (slugs.includes(location.hash.slice(1))) history.replaceState(null, '', location.pathname + location.search);
  });

  function ouvrirDepuisLien() {
    const i = slugs.indexOf(location.hash.slice(1));
    if (i >= 0 && !dlg.open && lignes()[i]) lignes()[i].click();
  }
  ouvrirDepuisLien();
  window.addEventListener('hashchange', ouvrirDepuisLien);
})();
