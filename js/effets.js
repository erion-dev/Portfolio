/* Effets graphiques empruntés à l'animation d'action :
   - lignes de vitesse qui « bouillonnent » derrière la section Contact
   - image d'impact (flash noir puis blanc) à l'ouverture d'une vidéo */
(function () {
  'use strict';

  if (!window.Dessins) return;
  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

  /* ---------- Lignes de vitesse du Contact ---------- */
  const fond = document.querySelector('.contact-vitesse');
  if (fond) {
    const section = fond.parentElement;
    const cible = section.querySelector('.email') || section;
    const ctx = fond.getContext('2d');
    let visible = false, variante = 0, minuterie = null;

    // Le point de fuite est placé sur l'adresse e-mail, pour que les lignes y mènent l'œil.
    function dessiner() {
      // Sécurité : sans sa feuille de style, le fond suivrait la taille de la section à l'infini.
      if (getComputedStyle(fond).position !== 'absolute') return;
      const r = section.getBoundingClientRect();
      if (r.width < 2) return;
      const w = Math.round(r.width * dpr()), h = Math.round(r.height * dpr());
      if (fond.width !== w || fond.height !== h) { fond.width = w; fond.height = h; }
      const e = cible.getBoundingClientRect();
      ctx.clearRect(0, 0, w, h);
      Dessins.lignesVitesse(ctx, w, h, Dessins.alea(40 + variante), {
        cx: (e.left + e.width / 2 - r.left) / r.width,
        cy: (e.top + e.height / 2 - r.top) / r.height,
        videX: Math.min(0.62, (e.width / r.width) * 0.62 + 0.1),
        videY: 0.34,
        nombre: 170,
        epaisseur: 7 * dpr(),
        couleur: '#d5e0ee'
      });
    }

    // Comme un trait d'animation qui « bout » : trois variantes qui alternent, en deux.
    function bouillir() {
      clearInterval(minuterie);
      if (!visible || reduit) return;
      minuterie = setInterval(() => {
        variante = (variante + 1) % 3;
        dessiner();
      }, 1000 / 8);
    }

    if ('ResizeObserver' in window) new ResizeObserver(dessiner).observe(section);
    else window.addEventListener('resize', dessiner);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((e) => {
        visible = e[0].isIntersecting;
        bouillir();
      }).observe(section);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(dessiner);
  }

  /* ---------- Image d'impact ---------- */
  // Deux images très brèves : lignes blanches sur noir, puis l'inverse. Moins de 150 ms au total.
  let calque = null;
  function impact() {
    if (reduit) return Promise.resolve();
    if (!calque) {
      calque = document.createElement('canvas');
      calque.className = 'impact';
      calque.setAttribute('aria-hidden', 'true');
      document.body.append(calque);
    }
    const w = Math.round(window.innerWidth * dpr()), h = Math.round(window.innerHeight * dpr());
    calque.width = w;
    calque.height = h;
    const ctx = calque.getContext('2d');
    const image = (fondCouleur, trait, graine) => {
      ctx.fillStyle = fondCouleur;
      ctx.fillRect(0, 0, w, h);
      Dessins.lignesVitesse(ctx, w, h, Dessins.alea(graine), {
        videX: 0.16, videY: 0.2, nombre: 220, epaisseur: 12 * dpr(), couleur: trait
      });
    };
    return new Promise((fini) => {
      image('#24262b', '#fbfcfd', 7);
      calque.classList.add('est-visible');
      setTimeout(() => {
        image('#fbfcfd', '#24262b', 8);
        setTimeout(() => {
          calque.classList.remove('est-visible');
          fini();
        }, 60);
      }, 70);
    });
  }

  /* ---------- Compteur d'images ---------- */
  // La page se lit comme un plan : chaque tranche de 6 pixels défilés vaut une image.
  // Toutes les 24 images (une seconde), le numéro est entouré comme une clé.
  const compteur = document.createElement('div');
  compteur.className = 'compteur';
  compteur.setAttribute('aria-hidden', 'true');
  compteur.innerHTML = '<span class="compteur-num">0001</span><span class="compteur-sec">0 s</span>';
  document.body.append(compteur);
  const num = compteur.querySelector('.compteur-num'), sec = compteur.querySelector('.compteur-sec');
  let attente = false;
  function majCompteur() {
    attente = false;
    const f = Math.floor(window.scrollY / 6);
    num.textContent = String(f + 1).padStart(4, '0');
    sec.textContent = Math.floor(f / 24) + ' s';
    compteur.classList.toggle('est-cle', f % 24 === 0);
  }
  window.addEventListener('scroll', () => {
    if (!attente) { attente = true; requestAnimationFrame(majCompteur); }
  }, { passive: true });
  majCompteur();

  /* ---------- Numéro d'image sur l'aperçu vidéo ---------- */
  const apercu = document.querySelector('.apercu');
  if (apercu) {
    const etiquette = document.createElement('span');
    etiquette.className = 'apercu-image';
    etiquette.setAttribute('aria-hidden', 'true');
    apercu.append(etiquette);
    const suivre = () => {
      const v = apercu.querySelector('.apercu-ecran video');
      if (v && !v.paused) {
        etiquette.hidden = false;
        etiquette.textContent = String(Math.floor(v.currentTime * 24) + 1);
      } else if (!v) {
        etiquette.hidden = true;
      }
      requestAnimationFrame(suivre);
    };
    requestAnimationFrame(suivre);
  }

  /* ---------- Guide de champ derrière le disque ---------- */
  // La grille de cadrage des animateurs : 12 champs imbriqués, diagonales et croix au centre.
  const scene = document.querySelector('.hero-scene');
  if (scene) {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'guide-champ');
    svg.setAttribute('viewBox', '-122 -90 244 180');
    svg.setAttribute('aria-hidden', 'true');
    const trace = (nom, attrs) => {
      const el = document.createElementNS(NS, nom);
      Object.keys(attrs).forEach((k) => el.setAttribute(k, attrs[k]));
      svg.append(el);
      return el;
    };
    for (let k = 1; k <= 12; k++) {
      const w = k * 20, h = k * 14.6;
      trace('rect', { x: -w / 2, y: -h / 2, width: w, height: h });
      const t = trace('text', { x: w / 2 - 1.5, y: -h / 2 + 4.6 });
      t.textContent = String(k);
    }
    trace('path', { d: 'M-120 -87.6L120 87.6M120 -87.6L-120 87.6M-120 0H120M0 -87.6V87.6' });
    trace('circle', { cx: 0, cy: 0, r: 3 });
    scene.prepend(svg);
  }

  /* ---------- Mini flip-book dans le pied de page ---------- */
  const carnet = document.querySelector('.carnet');
  if (carnet && Array.isArray(window.FEUILLES) && window.FEUILLES.length) {
    const ctx = carnet.getContext('2d');
    Promise.all(window.FEUILLES.map((src) => new Promise((ok) => {
      const img = new Image();
      img.onload = () => ok(Dessins.encre(img));
      img.onerror = () => ok(null);
      img.src = src;
    }))).then((dessins) => {
      dessins = dessins.filter(Boolean);
      if (!dessins.length) return;
      let i = 0, visible = false;
      const montrer = () => {
        const d = dessins[i % dessins.length];
        const w = carnet.width, h = carnet.height;
        ctx.fillStyle = '#fbfcfd';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(d, 0, 0, w, h);
      };
      montrer();
      if (reduit) return;
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(carnet);
      }
      setInterval(() => {
        if (!visible || document.hidden) return;
        i += 1;
        montrer();
      }, 1000 / 12);
    });
  }

  /* ---------- Tête de lecture sur la charte de timing ---------- */
  // En grand écran, une tête de lecture rouge parcourt la charte au fil du défilement ;
  // les repères déjà « joués » passent au rouge.
  const charte = document.querySelector('.charte');
  if (charte) {
    const tete = document.createElement('span');
    tete.className = 'charte-tete';
    tete.setAttribute('aria-hidden', 'true');
    charte.append(tete);
    const etapes = Array.from(charte.querySelectorAll('li'));
    const positions = etapes.map((li) => parseFloat(li.style.getPropertyValue('--pos')) || 0);
    let prevu = false;
    const avancer = () => {
      prevu = false;
      const r = charte.getBoundingClientRect();
      const h = window.innerHeight;
      // De l'entrée de la charte en bas de l'écran jusqu'à son passage au tiers haut
      const p = Math.min(1, Math.max(0, (h - r.top) / (h * 0.75 + r.height * 0.2)));
      charte.style.setProperty('--tete', p.toFixed(4));
      etapes.forEach((li, k) => li.classList.toggle('est-joue', positions[k] <= p + 0.001));
    };
    window.addEventListener('scroll', () => {
      if (!prevu) { prevu = true; requestAnimationFrame(avancer); }
    }, { passive: true });
    window.addEventListener('resize', avancer);
    avancer();
  }

  window.Effets = { impact };
})();
