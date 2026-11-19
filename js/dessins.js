/* Dessins « au crayon » générés en code :
   - les 12 feuilles posées sur le disque 3D (une balle qui rebondit)
   - les boucles affichées à la place des vidéos manquantes
   - le portrait provisoire de la section À propos */
(function () {
  'use strict';

  const TRAIT = {
    graphite: 'rgba(36, 38, 43, 0.9)',
    graphiteLeger: 'rgba(36, 38, 43, 0.35)',
    bleu: 'rgba(61, 125, 216, 0.6)',
    bleuLeger: 'rgba(61, 125, 216, 0.3)',
    rouge: 'rgba(191, 53, 39, 0.9)'
  };
  const PAPIER = '#F7F9FB';
  const POLICE = '"Funnel Sans", system-ui, sans-serif';
  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hasard reproductible : un même dessin garde toujours le même tremblé.
  function alea(graine) {
    let a = (graine * 2654435761) >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- Outils de tracé ---------- */

  // Ellipse tracée à la main : contour irrégulier qui déborde un peu de son point de départ.
  function ellipse(ctx, cx, cy, rx, ry, rot, rnd, o) {
    o = o || {};
    const passes = o.passes || 2;
    const deb = o.deb == null ? 0.3 : o.deb;
    const decal = o.decal || 0;
    const cos = Math.cos(rot || 0), sin = Math.sin(rot || 0);
    for (let p = 0; p < passes; p++) {
      const p1 = rnd() * 6.283, p2 = rnd() * 6.283, a0 = rnd() * 6.283;
      const dx = (rnd() - 0.5) * decal, dy = (rnd() - 0.5) * decal;
      const n = 56;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = a0 + (i / n) * (6.283 + deb);
        const j = 1 + 0.02 * Math.sin(2 * a + p1) + 0.012 * Math.sin(3 * a + p2);
        const x = Math.cos(a) * rx * j, y = Math.sin(a) * ry * j;
        const px = cx + dx + x * cos - y * sin, py = cy + dy + x * sin + y * cos;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }

  function remplirEllipse(ctx, cx, cy, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), rot || 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Trait légèrement courbe, avec des extrémités qui tremblent.
  function trait(ctx, x1, y1, x2, y2, rnd, o) {
    o = o || {};
    const passes = o.passes || 1;
    const j = o.jitter == null ? 1.5 : o.jitter;
    const k = o.courbe == null ? 0.03 : o.courbe;
    const L = Math.hypot(x2 - x1, y2 - y1) || 1;
    const nx = -(y2 - y1) / L, ny = (x2 - x1) / L;
    for (let p = 0; p < passes; p++) {
      const off = (rnd() - 0.5) * L * k;
      ctx.beginPath();
      ctx.moveTo(x1 + (rnd() - 0.5) * j * 2, y1 + (rnd() - 0.5) * j * 2);
      ctx.quadraticCurveTo(
        (x1 + x2) / 2 + nx * off, (y1 + y2) / 2 + ny * off,
        x2 + (rnd() - 0.5) * j * 2, y2 + (rnd() - 0.5) * j * 2
      );
      ctx.stroke();
    }
  }

  // Courbe lissée passant par une liste de points.
  function chemin(ctx, pts) {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
    }
    const d = pts[pts.length - 1];
    ctx.lineTo(d[0], d[1]);
  }

  function courbe(ctx, pts) {
    ctx.beginPath();
    chemin(ctx, pts);
    ctx.stroke();
  }

  function rectArrondi(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ---------- Feuilles du disque 3D ---------- */

  const NB_FEUILLES = 12;
  const FEUILLE_L = 1024, FEUILLE_H = 860; // proportions d'une feuille d'animation 12 champs

  // Position de la balle pour une image i (continue, de 0 à 11) :
  // chute de l'apogée jusqu'au sol (image 7), puis rebond moins haut.
  function poseBalle(i) {
    if (i <= 6) {
      const u = i / 6;
      return { x: 0.14 + 0.36 * u, h: 1 - u * u };
    }
    const u = (i - 6) / 5;
    return { x: 0.5 + 0.3 * u, h: 0.62 * (1 - (1 - u) * (1 - u)) };
  }
  // Écrasement et étirement autour du contact avec le sol [largeur, hauteur].
  const ETIREMENTS = { 4: [0.94, 1.08], 5: [0.8, 1.26], 6: [1.4, 0.64], 7: [0.85, 1.2], 8: [0.95, 1.06] };

  // Transforme un dessin sur fond blanc en trait graphite sur fond transparent,
  // pour le poser sur le papier translucide sans perdre l'effet de table lumineuse.
  function encre(img) {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth || img.width;
    c.height = img.naturalHeight || img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height), px = d.data;
    for (let k = 0; k < px.length; k += 4) {
      const a = Math.max(255 - px[k], 255 - px[k + 1], 255 - px[k + 2]) / 255;
      px[k] = 36; px[k + 1] = 38; px[k + 2] = 43;
      px[k + 3] = a < 0.08 ? 0 : Math.min(255, a * 290);
    }
    ctx.putImageData(d, 0, 0);
    return c;
  }

  // i : numéro du dessin (0 à 11) ; dessin : trait importé (sinon, la balle qui rebondit)
  function feuille(i, dessin) {
    const W = FEUILLE_L, H = FEUILLE_H;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    const rnd = alea(101 + i * 17);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Papier légèrement translucide : sur le disque lumineux, on devine les dessins du dessous.
    ctx.fillStyle = 'rgba(250, 251, 252, 0.8)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(36, 38, 43, 0.05)';
    for (let k = 0; k < 1400; k++) ctx.fillRect(rnd() * W, rnd() * H, 1.4, 1.4);

    if (dessin) {
      const L = 940, h = (L * dessin.height) / dessin.width;
      ctx.drawImage(dessin, (W - L) / 2, 120 + (540 - h) / 2, L, h);
    } else {
      const SOL = 712, R = 54, HAUT = 470;
      const px = (p) => p.x * W;
      const py = (p, sy) => SOL - R * sy - p.h * HAUT;

      // Trajectoire au crayon bleu
      ctx.strokeStyle = TRAIT.bleuLeger;
      ctx.lineWidth = 2;
      const traj = [];
      for (let t = 0; t <= 11.001; t += 0.25) {
        const p = poseBalle(t);
        traj.push([px(p), py(p, 1)]);
      }
      courbe(ctx, traj);

      // Sol
      ctx.strokeStyle = TRAIT.graphite;
      ctx.lineWidth = 2.4;
      trait(ctx, 60, SOL, W - 60, SOL + 2, rnd, { passes: 2, courbe: 0.004 });

      const p = poseBalle(i);
      const e = ETIREMENTS[i] || [1, 1];
      const cx = px(p), cy = py(p, e[1]);
      // La balle s'étire dans l'axe de son mouvement.
      const av = poseBalle(Math.max(0, i - 0.5)), ap = poseBalle(Math.min(11, i + 0.5));
      const rot = i === 6 ? 0 : Math.atan2(py(ap, 1) - py(av, 1), px(ap) - px(av)) - Math.PI / 2;
      const cr = Math.cos(rot), sr = Math.sin(rot);

      // Ombre au sol
      ctx.fillStyle = 'rgba(36, 38, 43, 0.1)';
      remplirEllipse(ctx, cx, SOL + 6, R * (1.3 - 0.65 * p.h) * e[0], 9 * (1 - 0.5 * p.h));

      // Construction au crayon bleu
      ctx.strokeStyle = TRAIT.bleu;
      ctx.lineWidth = 2;
      ellipse(ctx, cx, cy, R * e[0] * 1.03, R * e[1] * 1.03, rot, rnd, { passes: 1, decal: 8, deb: 0.6 });
      const ax = R * e[0] * 0.95, ay = R * e[1] * 0.95;
      trait(ctx, cx - cr * ax, cy - sr * ax, cx + cr * ax, cy + sr * ax, rnd, { courbe: 0.12 });
      trait(ctx, cx + sr * ay, cy - cr * ay, cx - sr * ay, cy + cr * ay, rnd, { courbe: 0.12 });

      // Trait propre au graphite
      ctx.strokeStyle = TRAIT.graphite;
      ctx.lineWidth = 3.4;
      ellipse(ctx, cx, cy, R * e[0], R * e[1], rot, rnd, { passes: 2, deb: 0.12 });
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * e[0] * 0.62, R * e[1] * 0.62, rot, Math.PI * 1.1, Math.PI * 1.45);
      ctx.stroke();
    }

    // Numéro d'image : les clés sont entourées, les intervalles de passage soulignés.
    const nx = W - 78, ny = H - 64;
    ctx.fillStyle = TRAIT.graphite;
    ctx.font = '600 42px ' + POLICE;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), nx, ny);
    ctx.strokeStyle = TRAIT.rouge;
    ctx.lineWidth = 3;
    if (i === 0 || i === 6 || i === 11) ellipse(ctx, nx, ny + 1, 36, 31, 0, rnd, { passes: 1, deb: 0.5 });
    else if (i === 3 || i === 9) trait(ctx, nx - 22, ny + 30, nx + 22, ny + 30, rnd);

    ctx.font = '500 28px ' + POLICE;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(36, 38, 43, 0.6)';
    ctx.fillText('sc. 1', 56, 100);

    // Charte de timing au crayon rouge sur la première clé : les intervalles s'écartent en tombant.
    if (i === 0 && !dessin) {
      ctx.strokeStyle = TRAIT.rouge;
      ctx.fillStyle = TRAIT.rouge;
      ctx.lineWidth = 2.6;
      const x = W - 120, y0 = 160, y1 = 430;
      trait(ctx, x, y0, x, y1, rnd, { courbe: 0.01 });
      for (let k = 0; k <= 6; k++) {
        const y = y0 + (k / 6) * (k / 6) * (y1 - y0);
        trait(ctx, x - 16, y, x + 16, y, rnd, { jitter: 0.6 });
      }
      ctx.font = '600 24px ' + POLICE;
      ctx.textAlign = 'center';
      ctx.fillText('1', x + 46, y0);
      ellipse(ctx, x + 46, y0 + 1, 18, 16, 0, rnd, { passes: 1 });
      ctx.fillText('7', x + 46, y1);
      ellipse(ctx, x + 46, y1 + 1, 18, 16, 0, rnd, { passes: 1 });
    }

    // Perforations de la barre à tenons : un rond au centre, une fente de chaque côté.
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    const yt = 36, ecart = W * (4 / 12.5);
    ctx.beginPath();
    ctx.arc(W / 2, yt, 14, 0, Math.PI * 2);
    ctx.fill();
    [-1, 1].forEach((s) => {
      rectArrondi(ctx, W / 2 + s * ecart - 30, yt - 8, 60, 16, 8);
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
    return c;
  }

  /* ---------- Boucles d'attente (projets sans vidéo) ---------- */
  // Chaque motif reçoit t entre 0 et 1 et une unité u = 1 % du petit côté.

  const MOTIFS = {
    balle(ctx, w, h, t, rnd, coul, u) {
      const cx = w / 2, sol = h / 2 + 30 * u, R = 9 * u;
      const hauteur = 1 - Math.pow(2 * t - 1, 2);
      let sx = 1, sy = 1;
      if (t < 0.02 || t > 0.98) { sx = 1.35; sy = 0.68; }
      else if (t < 0.1 || t > 0.9) { sx = 0.86; sy = 1.2; }
      const cy = sol - R * sy - hauteur * 44 * u;

      ctx.strokeStyle = TRAIT.graphite;
      ctx.lineWidth = 0.5 * u;
      trait(ctx, cx - 34 * u, sol, cx + 34 * u, sol, rnd, { courbe: 0.01, jitter: 0.3 * u });
      ctx.fillStyle = 'rgba(36, 38, 43, 0.1)';
      remplirEllipse(ctx, cx, sol + u, R * (1.4 - 0.7 * hauteur), 1.6 * u * (1 - 0.5 * hauteur));

      ctx.fillStyle = coul;
      remplirEllipse(ctx, cx, cy, R * sx, R * sy);
      ctx.strokeStyle = TRAIT.bleu;
      ctx.lineWidth = 0.3 * u;
      ellipse(ctx, cx, cy, R * sx * 1.05, R * sy * 1.05, 0, rnd, { passes: 1, decal: 1.2 * u, deb: 0.6 });
      ctx.strokeStyle = TRAIT.graphite;
      ctx.lineWidth = 0.55 * u;
      ellipse(ctx, cx, cy, R * sx, R * sy, 0, rnd, { passes: 2, deb: 0.15 });
    },

    pendule(ctx, w, h, t, rnd, coul, u) {
      const ox = w / 2, oy = h / 2 - 34 * u, L = 50 * u;
      const angle = (tt) => 0.6 * Math.cos(2 * Math.PI * tt);
      const pos = (tt) => [ox + Math.sin(angle(tt)) * L, oy + Math.cos(angle(tt)) * L];
      const [bx, by] = pos(t);

      ctx.strokeStyle = TRAIT.graphite;
      ctx.lineWidth = 0.55 * u;
      trait(ctx, ox - 16 * u, oy, ox + 16 * u, oy, rnd, { courbe: 0.01, jitter: 0.3 * u });
      ctx.lineWidth = 0.4 * u;
      trait(ctx, ox, oy, bx, by, rnd, { courbe: 0.02, jitter: 0.2 * u });

      // Le ruban suit la boule avec un temps de retard.
      const pts = [[bx, by]];
      for (let k = 1; k <= 7; k++) {
        const [x, y] = pos(t - 0.028 * k);
        pts.push([x, y + k * 1.1 * u]);
      }
      ctx.strokeStyle = coul;
      ctx.lineWidth = 2.6 * u;
      courbe(ctx, pts);
      ctx.strokeStyle = TRAIT.graphiteLeger;
      ctx.lineWidth = 0.3 * u;
      courbe(ctx, pts);

      ctx.fillStyle = coul;
      remplirEllipse(ctx, bx, by, 8 * u, 8 * u);
      ctx.strokeStyle = TRAIT.graphite;
      ctx.lineWidth = 0.55 * u;
      ellipse(ctx, bx, by, 8 * u, 8 * u, 0, rnd, { passes: 2, deb: 0.15 });
      ctx.fillStyle = TRAIT.graphite;
      remplirEllipse(ctx, ox, oy, 1.2 * u, 1.2 * u);
    },

    vague(ctx, w, h, t, rnd, coul, u) {
      const mx = w / 2 - 28 * u, haut = h / 2 - 32 * u, bas = h / 2 + 38 * u;
      const L = 58 * u, Hd = 28 * u, n = 28;
      const onde = (x, ph) => Math.sin(2 * Math.PI * (x * 1.1 - t) + ph) * 4.5 * u * x;

      ctx.strokeStyle = TRAIT.graphite;
      ctx.lineWidth = 0.7 * u;
      trait(ctx, mx, haut - 3 * u, mx, bas, rnd, { courbe: 0.01, jitter: 0.2 * u });

      const dessus = [], dessous = [];
      for (let i = 0; i <= n; i++) {
        const x = i / n;
        dessus.push([mx + x * L, haut + onde(x, 0)]);
        dessous.push([mx + x * L, haut + Hd + onde(x, 0.5)]);
      }
      ctx.beginPath();
      chemin(ctx, dessus);
      dessous.slice().reverse().forEach((pt) => ctx.lineTo(pt[0], pt[1]));
      ctx.closePath();
      ctx.fillStyle = coul;
      ctx.fill();
      ctx.lineWidth = 0.5 * u;
      ctx.stroke();

      ctx.strokeStyle = TRAIT.graphiteLeger;
      ctx.lineWidth = 0.3 * u;
      [0.36, 0.7].forEach((x) => {
        const i = Math.round(x * n);
        trait(ctx, dessus[i][0], dessus[i][1] + 2 * u, dessous[i][0], dessous[i][1] - 2 * u, rnd, { courbe: 0.15, jitter: 0.2 * u });
      });
      ctx.fillStyle = TRAIT.graphite;
      remplirEllipse(ctx, mx, haut - 4 * u, 1.6 * u, 1.6 * u);
    },

    goutte(ctx, w, h, t, rnd, coul, u) {
      const cx = w / 2, eau = h / 2 + 22 * u, y0 = h / 2 - 40 * u;
      ctx.lineCap = 'round';
      ctx.strokeStyle = TRAIT.graphite;
      ctx.lineWidth = 0.5 * u;
      trait(ctx, cx - 42 * u, eau, cx - 10 * u, eau, rnd, { courbe: 0.01, jitter: 0.2 * u });
      trait(ctx, cx + 10 * u, eau, cx + 42 * u, eau, rnd, { courbe: 0.01, jitter: 0.2 * u });

      if (t < 0.45) {
        const s = t / 0.45;
        const y = y0 + s * s * (eau - y0);
        const tip = y - (10 + 8 * s) * u, r = 5 * u;
        ctx.beginPath();
        ctx.moveTo(cx, tip);
        ctx.bezierCurveTo(cx + u, tip + 5 * u, cx + r, y - r - 3 * u, cx + r, y - r);
        ctx.arc(cx, y - r, r, 0, Math.PI);
        ctx.bezierCurveTo(cx - r, y - r - 3 * u, cx - u, tip + 5 * u, cx, tip);
        ctx.fillStyle = coul;
        ctx.fill();
        ctx.lineWidth = 0.55 * u;
        ctx.stroke();
      } else {
        const s = (t - 0.45) / 0.55;
        [0, 0.3].forEach((k) => {
          const r = s - k;
          if (r <= 0 || r >= 1) return;
          ctx.globalAlpha = 1 - r;
          ctx.lineWidth = 0.5 * u;
          ellipse(ctx, cx, eau, (5 + 36 * r) * u, (1.2 + 6 * r) * u, 0, rnd, { passes: 1, deb: 0.1 });
          ctx.globalAlpha = 1;
        });
        if (s < 0.5) {
          const v = Math.sin(Math.PI * s / 0.5);
          [-1, 1].forEach((cote) => {
            const x = cx + cote * (3 + 16 * s) * u, y = eau - v * 12 * u;
            ctx.fillStyle = coul;
            remplirEllipse(ctx, x, y, 1.8 * u, 1.8 * u);
            ctx.lineWidth = 0.35 * u;
            ellipse(ctx, x, y, 1.8 * u, 1.8 * u, 0, rnd, { passes: 1 });
          });
        }
        if (s < 0.4) {
          const y = eau - Math.sin(Math.PI * s / 0.4) * 18 * u;
          ctx.fillStyle = coul;
          remplirEllipse(ctx, cx, y, 2.6 * u, 3 * u);
          ctx.lineWidth = 0.45 * u;
          ellipse(ctx, cx, y, 2.6 * u, 3 * u, 0, rnd, { passes: 1 });
        }
      }
    },

    flamme(ctx, w, h, t, rnd, coul, u) {
      const cx = w / 2, haut = h / 2 + 6 * u;
      const a = Math.sin(2 * Math.PI * t), b = Math.sin(4 * Math.PI * t + 1), c = Math.sin(6 * Math.PI * t + 2);
      const fh = (24 + 3 * b + 1.5 * c) * u, fw = (7 - 0.8 * b) * u, balance = 3 * a * u;
      const base = haut - 3 * u;

      const halo = ctx.createRadialGradient(cx, base - fh * 0.4, 0, cx, base - fh * 0.4, 30 * u);
      halo.addColorStop(0, 'rgba(246, 196, 83, 0.28)');
      halo.addColorStop(1, 'rgba(246, 196, 83, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = coul;
      ctx.fillRect(cx - 8 * u, haut, 16 * u, 36 * u);
      ctx.strokeStyle = TRAIT.graphite;
      ctx.lineWidth = 0.5 * u;
      trait(ctx, cx - 8 * u, haut, cx - 8 * u, haut + 36 * u, rnd, { courbe: 0.01, jitter: 0.2 * u });
      trait(ctx, cx + 8 * u, haut, cx + 8 * u, haut + 36 * u, rnd, { courbe: 0.01, jitter: 0.2 * u });
      ellipse(ctx, cx, haut, 8 * u, 1.6 * u, 0, rnd, { passes: 1, deb: 0.1 });
      trait(ctx, cx, haut, cx + 0.6 * u, haut - 4 * u, rnd, { courbe: 0.2, jitter: 0.1 * u });

      const flamme = (k, fond) => {
        const tip = [cx + balance * k, base - fh * k], r = fw * k, yb = base - r;
        ctx.beginPath();
        ctx.moveTo(tip[0], tip[1]);
        ctx.quadraticCurveTo(cx + r * 1.4 + balance * 0.3, base - fh * 0.45 * k, cx + r, yb);
        ctx.arc(cx, yb, r, 0, Math.PI);
        ctx.quadraticCurveTo(cx - r * 1.4 + balance * 0.3, base - fh * 0.45 * k, tip[0], tip[1]);
        ctx.fillStyle = fond;
        ctx.fill();
      };
      flamme(1, '#F6C453');
      ctx.lineWidth = 0.55 * u;
      ctx.stroke();
      flamme(0.5, '#FFF1C9');
    }
  };

  /* Les boucles tournent « en deux » (12 dessins par seconde), comme en animation traditionnelle,
     et chaque dessin a son propre tremblé de trait. */
  const boucles = new Set();
  const observeur = 'IntersectionObserver' in window
    ? new IntersectionObserver((entrees) => {
        entrees.forEach((e) => {
          const b = e.target.__boucle;
          if (!b) return;
          b.visible = e.isIntersecting;
          if (b.visible) b.ajuster();
        });
      })
    : null;
  const tailles = 'ResizeObserver' in window
    ? new ResizeObserver((entrees) => entrees.forEach((e) => e.target.__boucle && e.target.__boucle.ajuster()))
    : null;

  function Boucle(canvas, motif, couleur, o) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.motif = MOTIFS[motif] ? motif : 'balle';
    this.couleur = couleur || '#9DB4E8';
    this.jetable = !!(o && o.jetable);
    this.decalage = Math.floor(Math.random() * 24);
    this.visible = !observeur;
    this.derniere = 0;
    canvas.__boucle = this;
    boucles.add(this);
    if (observeur) observeur.observe(canvas);
    if (tailles) tailles.observe(canvas);
    lancer();
  }
  Boucle.prototype.ajuster = function () {
    const r = this.c.getBoundingClientRect();
    if (r.width < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (w !== this.c.width || h !== this.c.height) {
      this.c.width = w;
      this.c.height = h;
    }
    this.dessiner(this.derniere);
  };
  Boucle.prototype.dessiner = function (f) {
    this.derniere = f;
    const ctx = this.ctx, w = this.c.width, h = this.c.height;
    if (w < 2 || h < 2) return;
    const n = 24, k = (((f + this.decalage) % n) + n) % n;
    const u = Math.min(w, h) / 100;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = PAPIER;
    ctx.fillRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    MOTIFS[this.motif](ctx, w, h, k / n, alea(k * 31 + 7), this.couleur, u);
    ctx.fillStyle = TRAIT.rouge;
    ctx.font = '600 ' + Math.round(3.6 * u) + 'px ' + POLICE;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(k + 1), w - 4 * u, h - 4 * u);
  };

  let lance = false, derniereImage = -1;
  function lancer() {
    if (lance || reduit) return;
    lance = true;
    requestAnimationFrame(tic);
  }
  function tic(maintenant) {
    const f = Math.floor(maintenant / (1000 / 12));
    if (f !== derniereImage && !document.hidden) {
      derniereImage = f;
      boucles.forEach((b) => {
        if (!b.c.isConnected) {
          if (b.jetable) {
            boucles.delete(b);
            if (observeur) observeur.unobserve(b.c);
            if (tailles) tailles.unobserve(b.c);
          }
          return;
        }
        if (b.visible) b.dessiner(f);
      });
    }
    requestAnimationFrame(tic);
  }

  /* ---------- Portrait provisoire : un dessin de construction ---------- */

  function portrait(canvas) {
    function dessiner() {
      const r = canvas.getBoundingClientRect();
      if (r.width < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
      const u = Math.min(w, h) / 100, rnd = alea(7);
      ctx.fillStyle = PAPIER;
      ctx.fillRect(0, 0, w, h);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const cx = w / 2, cy = h * 0.4, R = 22 * u;
      ctx.strokeStyle = TRAIT.bleu;
      ctx.lineWidth = 0.45 * u;
      ellipse(ctx, cx, cy, R, R * 1.08, 0, rnd, { passes: 2, decal: 1.5 * u, deb: 0.5 });
      ctx.beginPath();
      ctx.moveTo(cx + R * 0.1, cy - R * 1.05);
      ctx.quadraticCurveTo(cx + R * 0.45, cy, cx + R * 0.2, cy + R * 1.1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - R, cy + R * 0.05);
      ctx.quadraticCurveTo(cx, cy + R * 0.32, cx + R, cy + R * 0.05);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - R * 0.85, cy + R * 0.4);
      ctx.quadraticCurveTo(cx - R * 0.5, cy + R * 1.3, cx + R * 0.15, cy + R * 1.45);
      ctx.quadraticCurveTo(cx + R * 0.7, cy + R * 1.2, cx + R * 0.9, cy + R * 0.45);
      ctx.stroke();
      trait(ctx, cx - R * 0.35, cy + R * 1.15, cx - R * 0.42, cy + R * 1.95, rnd);
      trait(ctx, cx + R * 0.48, cy + R * 1.2, cx + R * 0.52, cy + R * 1.95, rnd);
      ctx.beginPath();
      ctx.moveTo(cx - R * 2.4, h);
      ctx.quadraticCurveTo(cx - R * 1.6, cy + R * 1.9, cx - R * 0.42, cy + R * 2.0);
      ctx.moveTo(cx + R * 2.4, h);
      ctx.quadraticCurveTo(cx + R * 1.6, cy + R * 1.9, cx + R * 0.52, cy + R * 2.0);
      ctx.stroke();

      ctx.strokeStyle = TRAIT.graphite;
      ctx.lineWidth = 0.6 * u;
      ctx.beginPath();
      ctx.ellipse(cx, cy - R * 0.08, R * 1.1, R * 1.06, -0.1, Math.PI * 1.02, Math.PI * 1.98);
      ctx.stroke();
      [[-0.32, 0.12], [0.5, 0.1]].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.ellipse(cx + R * dx, cy + R * dy, R * 0.11, R * 0.07, 0, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(cx + R * 0.05, cy + R * 0.85);
      ctx.quadraticCurveTo(cx + R * 0.22, cy + R * 0.95, cx + R * 0.38, cy + R * 0.83);
      ctx.stroke();
    }
    if ('ResizeObserver' in window) new ResizeObserver(dessiner).observe(canvas);
    else dessiner();
  }

  /* ---------- Lignes de vitesse (« lignes de concentration » des mangas) ---------- */
  // Des traits effilés qui convergent vers un point, en laissant une ellipse vide autour de lui.
  function lignesVitesse(ctx, w, h, rnd, o) {
    o = o || {};
    const cx = w * (o.cx == null ? 0.5 : o.cx), cy = h * (o.cy == null ? 0.5 : o.cy);
    const rx = w * (o.videX || 0.3), ry = h * (o.videY || 0.3);
    const R = Math.hypot(w, h);
    const n = o.nombre || 150;
    ctx.fillStyle = o.couleur || TRAIT.graphite;
    for (let k = 0; k < n; k++) {
      const a = rnd() * Math.PI * 2;
      const cos = Math.cos(a), sin = Math.sin(a);
      const r0 = 1 + rnd() * rnd() * 0.9;
      const x0 = cx + cos * rx * r0, y0 = cy + sin * ry * r0;
      const x1 = cx + cos * R, y1 = cy + sin * R;
      const ep = (o.epaisseur || 6) * (0.25 + rnd() * rnd() * 1.6);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1 - sin * ep, y1 + cos * ep);
      ctx.lineTo(x1 + sin * ep, y1 - cos * ep);
      ctx.closePath();
      ctx.fill();
    }
  }

  window.Dessins = { feuille, encre, lignesVitesse, alea, Boucle, portrait, NB_FEUILLES, FEUILLE_L, FEUILLE_H };
})();
