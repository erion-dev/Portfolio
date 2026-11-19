/* Remplit la page à partir de js/config.js et gère l'aperçu des projets et la visionneuse. */
(function () {
  'use strict';

  const S = window.SITE || {};
  const $ = (sel, el) => (el || document).querySelector(sel);
  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Textes ---------- */
  document.querySelectorAll('[data-champ]').forEach((el) => {
    const v = S[el.dataset.champ];
    if (typeof v === 'string' && v) el.textContent = v;
  });
  if (S.nom) document.title = S.nom + ', ' + (S.metier || 'animation 2D').toLowerCase();
  $('[data-annee]').textContent = String(new Date().getFullYear());

  /* ---------- Durées : minutes:secondes → nombre d'images à 24 i/s ---------- */
  function secondes(d) {
    const p = String(d || '').split(':').map(Number);
    return p.length === 2 ? p[0] * 60 + p[1] : p[0] || 0;
  }
  const enImages = (d) => (secondes(d) * 24).toLocaleString('fr-FR') + ' images';

  /* ---------- Lecteurs ---------- */
  function boucle(p, o) {
    const c = document.createElement('canvas');
    c.className = 'boucle';
    c.setAttribute('aria-hidden', 'true');
    new Dessins.Boucle(c, p.motif, p.couleur, o);
    return c;
  }

  // Extrait silencieux pour l'aperçu et les vignettes
  function extrait(p) {
    if (p.extrait || p.video) {
      const v = document.createElement('video');
      v.src = p.extrait || p.video;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.preload = 'metadata';
      v.setAttribute('aria-hidden', 'true');
      if (p.image) v.poster = p.image;
      surveillerVideo(v);
      return v;
    }
    if (p.image) {
      const i = new Image();
      i.src = p.image;
      i.alt = '';
      i.loading = 'lazy';
      return i;
    }
    return boucle(p);
  }

  // Les extraits ne jouent que lorsqu'ils sont à l'écran.
  const videosVisibles = 'IntersectionObserver' in window
    ? new IntersectionObserver((entrees) => {
        entrees.forEach((e) => {
          const v = e.target;
          if (e.isIntersecting && !reduit) v.play().catch(() => {});
          else v.pause();
        });
      })
    : null;
  function surveillerVideo(v) {
    if (videosVisibles) videosVisibles.observe(v);
  }

  // Lecteur complet pour la visionneuse
  function lecteur(src, p) {
    if (src.vimeo || src.youtube) {
      const f = document.createElement('iframe');
      f.src = src.vimeo
        ? 'https://player.vimeo.com/video/' + encodeURIComponent(src.vimeo) + '?autoplay=1&title=0&byline=0&portrait=0'
        : 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(src.youtube) + '?autoplay=1&rel=0';
      f.allow = 'autoplay; fullscreen; picture-in-picture';
      f.allowFullscreen = true;
      f.title = p.titre || 'Vidéo';
      return f;
    }
    if (src.video) {
      const v = document.createElement('video');
      v.src = src.video;
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      if (p.image) v.poster = p.image;
      return v;
    }
    const cadre = document.createElement('div');
    cadre.className = 'lecteur-attente';
    cadre.append(boucle(p, { jetable: true }));
    const note = document.createElement('p');
    note.className = 'bientot';
    note.textContent = 'Vidéo bientôt en ligne';
    cadre.append(note);
    return cadre;
  }

  /* ---------- Visionneuse ---------- */
  const dlg = $('#visionneuse');
  const ecranDlg = $('#visionneuse-ecran');
  let declencheur = null;

  function ouvrir(src, p, titre, meta) {
    $('#visionneuse-titre').textContent = titre;
    $('#visionneuse-meta').textContent = meta || '';
    $('#visionneuse-texte').textContent = p.description || '';
    $('#visionneuse-texte').hidden = !p.description;
    ecranDlg.replaceChildren(lecteur(src, p));
    document.querySelectorAll('.apercu-ecran video, .ligne-vignette video').forEach((v) => v.pause());
    declencheur = document.activeElement;
    // Une image d'impact, comme dans un combat d'anime, puis la visionneuse s'ouvre.
    const effet = window.Effets ? Effets.impact() : Promise.resolve();
    effet.then(() => {
      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');
    });
  }
  dlg.addEventListener('close', () => {
    ecranDlg.replaceChildren();
    if (declencheur && declencheur.focus) declencheur.focus();
  });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  $('[data-fermer]').addEventListener('click', () => dlg.close());

  const metaProjet = (p) => [p.type, p.client, p.annee].filter(Boolean).join(', ');

  // Sans showreel renseigné, le bouton enchaîne les vidéos des projets les unes après les autres.
  function lecteurEnchaine(liste) {
    const v = document.createElement('video');
    v.controls = true;
    v.playsInline = true;
    let i = 0;
    const jouer = () => {
      const p = liste[i];
      v.src = p.video;
      v.poster = p.image || '';
      $('#visionneuse-texte').textContent = (i + 1) + ' sur ' + liste.length + '\u00a0: ' + p.titre + (p.type ? ', ' + p.type.toLowerCase() : '');
      v.play().catch(() => {});
    };
    v.addEventListener('ended', () => {
      if (i < liste.length - 1) { i += 1; jouer(); }
    });
    jouer();
    return v;
  }

  $('[data-showreel]').addEventListener('click', () => {
    const sr = S.showreel || {};
    const meta = [S.nom, new Date().getFullYear()].filter(Boolean).join(', ');
    const videos = (S.projets || []).filter((p) => p.video);
    if (!sr.video && !sr.vimeo && !sr.youtube && videos.length) {
      ouvrir({}, {}, 'Showreel', meta);
      $('#visionneuse-texte').hidden = false;
      ecranDlg.replaceChildren(lecteurEnchaine(videos));
      return;
    }
    ouvrir(sr, { titre: 'Showreel', motif: 'balle', couleur: '#9DB4E8' }, 'Showreel', meta);
  });

  /* ---------- Liste des projets ---------- */
  const projets = Array.isArray(S.projets) ? S.projets : [];
  const liste = $('#liste-projets');
  const ecran = $('#apercu-ecran');
  const extraits = [];
  let actif = -1;

  function montrer(i) {
    if (i === actif) return;
    actif = i;
    const p = projets[i];
    liste.querySelectorAll('.ligne').forEach((b, j) => b.classList.toggle('est-actif', j === i));
    if (!extraits[i]) extraits[i] = extrait(p);
    ecran.querySelectorAll('video').forEach((v) => v.pause());
    ecran.replaceChildren(extraits[i]);
    const v = extraits[i];
    if (v.tagName === 'VIDEO' && !reduit) v.play().catch(() => {});
    $('#apercu-titre').textContent = p.titre;
    $('#apercu-texte').textContent = p.description || '';
  }

  projets.forEach((p, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ligne';
    b.innerHTML =
      '<span class="ligne-vignette"></span>' +
      '<span class="ligne-titre"><span class="ligne-nom"></span><span class="ligne-type"></span></span>' +
      '<span class="ligne-client"></span>' +
      '<span class="ligne-annee"></span>' +
      '<span class="ligne-duree"><span class="ligne-temps"></span><span class="ligne-images"></span></span>';
    $('.ligne-nom', b).textContent = p.titre;
    $('.ligne-type', b).textContent = p.type || '';
    $('.ligne-client', b).textContent = p.client || '';
    $('.ligne-annee', b).textContent = p.annee || '';
    $('.ligne-temps', b).textContent = p.duree || '';
    $('.ligne-images', b).textContent = p.duree ? enImages(p.duree) : '';
    $('.ligne-vignette', b).append(extrait(p));
    b.setAttribute('aria-label', 'Regarder ' + p.titre + (p.type ? ', ' + p.type.toLowerCase() : ''));

    b.addEventListener('pointerenter', () => montrer(i));
    b.addEventListener('focus', () => montrer(i));
    b.addEventListener('click', () => ouvrir(p, p, p.titre, metaProjet(p)));
    li.append(b);
    liste.append(li);
  });
  if (projets.length) montrer(0);

  /* ---------- À propos ---------- */
  const bio = $('[data-bio]');
  (S.bio || []).forEach((t) => {
    const p = document.createElement('p');
    p.textContent = t;
    bio.append(p);
  });
  const outils = $('[data-outils]');
  if (S.outils && S.outils.length) outils.textContent = S.outils.join(', ');
  else outils.closest('.outils').hidden = true;

  const cadrePortrait = $('[data-portrait]');
  if (S.photo) {
    const img = new Image();
    img.src = S.photo;
    img.alt = 'Portrait de ' + (S.nom || "l'animateur");
    cadrePortrait.append(img);
  } else {
    const c = document.createElement('canvas');
    c.setAttribute('aria-hidden', 'true');
    cadrePortrait.append(c);
    Dessins.portrait(c);
  }

  /* ---------- Contact ---------- */
  const lienEmail = $('[data-email]');
  if (S.email) {
    lienEmail.href = 'mailto:' + S.email;
    lienEmail.textContent = S.email;
  }
  const reseaux = $('[data-reseaux]');
  (S.reseaux || []).filter((r) => r.url).forEach((r) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = r.url;
    a.textContent = r.nom;
    a.target = '_blank';
    a.rel = 'noopener';
    li.append(a);
    reseaux.append(li);
  });
})();
