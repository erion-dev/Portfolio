/* Disque d'animation en 3D : une pile de 12 dessins posée sur un disque lumineux,
   qu'on feuillette comme un animateur qui vérifie son mouvement. */
(function () {
  'use strict';

  const canvas = document.getElementById('scene3d');
  if (!canvas || !window.Dessins) return;
  const conteneur = canvas.parentElement;
  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Sans WebGL, on montre le premier dessin à plat.
  function secours(dessins) {
    const c = Dessins.feuille(0, dessins && dessins[0]);
    c.className = 'scene-secours';
    c.setAttribute('role', 'img');
    c.setAttribute('aria-label', canvas.getAttribute('aria-label') || '');
    canvas.replaceWith(c);
    const aide = conteneur.querySelector('.aide');
    if (aide) aide.hidden = true;
  }

  function attendrePolice() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.race([
      document.fonts.load('600 42px "Funnel Sans"'),
      new Promise((r) => setTimeout(r, 1500))
    ]).catch(() => {});
  }

  // Dessins importés (js/feuilles.js) ; sans eux, les feuilles montrent une balle qui rebondit.
  function chargerDessins() {
    const n = Dessins.NB_FEUILLES;
    const sources = Array.isArray(window.FEUILLES) ? window.FEUILLES.slice(0, n) : [];
    if (sources.length < n) return Promise.resolve(null);
    return Promise.all(sources.map((src) => new Promise((ok, ko) => {
      const img = new Image();
      img.onload = () => ok(img);
      img.onerror = ko;
      img.src = src;
    })))
      .then((imgs) => imgs.map(Dessins.encre))
      .catch(() => null);
  }

  Promise.all([attendrePolice(), chargerDessins()]).then(([, dessins]) => {
    if (!window.THREE) return secours(dessins);
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (e) {
      return secours(dessins);
    }
    demarrer(renderer, dessins);
  });

  function texCouronne(T) {
    const c = document.createElement('canvas');
    c.width = c.height = 1024;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#30343c';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.translate(512, 512);
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.55)';
    ctx.fillStyle = 'rgba(226, 232, 240, 0.6)';
    ctx.font = '600 22px "Funnel Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Graduations en degrés, comme sur un vrai disque rotatif
    for (let d = 0; d < 360; d += 5) {
      const long = d % 15 === 0;
      ctx.save();
      ctx.rotate((d * Math.PI) / 180);
      ctx.lineWidth = long ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(0, -496);
      ctx.lineTo(0, -496 + (long ? 30 : 16));
      ctx.stroke();
      if (d % 30 === 0) ctx.fillText(String(d), 0, -444);
      ctx.restore();
    }
    const t = new T.CanvasTexture(c);
    t.encoding = T.sRGBEncoding;
    return t;
  }

  function texVerre(T) {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(256, 236, 10, 256, 256, 256);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.7, '#f1f6fc');
    g.addColorStop(1, '#d6e2f0');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    const t = new T.CanvasTexture(c);
    t.encoding = T.sRGBEncoding;
    return t;
  }

  function demarrer(renderer, dessins) {
    const T = THREE;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = T.sRGBEncoding;

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(30, 1, 0.1, 100);
    scene.add(new T.HemisphereLight(0xffffff, 0xb9c4d4, 0.95));
    const soleil = new T.DirectionalLight(0xffffff, 0.8);
    soleil.position.set(-3, 5, 6);
    scene.add(soleil);

    const monde = new T.Group();   // inclinaison, parallaxe et défilement
    const disque = new T.Group();  // rotation du disque autour de son axe
    scene.add(monde);
    monde.add(disque);

    /* --- Le disque --- */
    const R_EXT = 1.9, R_VERRE = 1.42, EP = 0.1;
    const corps = new T.Mesh(
      new T.CylinderGeometry(R_EXT, R_EXT, EP, 128, 1, true),
      new T.MeshStandardMaterial({ color: 0x2a2e36, metalness: 0.55, roughness: 0.4, side: T.DoubleSide })
    );
    corps.rotation.x = Math.PI / 2;
    disque.add(corps);

    const couronne = new T.Mesh(
      new T.RingGeometry(R_VERRE, R_EXT, 160, 1),
      new T.MeshStandardMaterial({ map: texCouronne(T), metalness: 0.35, roughness: 0.55 })
    );
    couronne.position.z = EP / 2;
    disque.add(couronne);

    const verre = new T.Mesh(new T.CircleGeometry(R_VERRE, 128), new T.MeshBasicMaterial({ map: texVerre(T) }));
    verre.position.z = EP / 2;
    disque.add(verre);

    const metal = new T.MeshStandardMaterial({ color: 0xb4bcc6, metalness: 0.7, roughness: 0.3 });
    const biseau = new T.Mesh(new T.TorusGeometry(R_VERRE, 0.022, 12, 160), metal);
    biseau.position.z = EP / 2;
    disque.add(biseau);

    /* --- Barre à tenons --- */
    const N = Dessins.NB_FEUILLES;
    const SW = 2.5, SH = (SW * Dessins.FEUILLE_H) / Dessins.FEUILLE_L;
    const CHARNIERE = 0.92;                            // bord haut des feuilles
    const Y_TROUS = CHARNIERE - SH * (36 / Dessins.FEUILLE_H);
    const Z_PILE = EP / 2 + 0.018;
    const PAS = 0.0045;                                // épaisseur d'une feuille

    const barre = new T.Mesh(new T.BoxGeometry(2.1, 0.24, 0.014), metal);
    barre.position.set(0, Y_TROUS + 0.05, EP / 2 + 0.008);
    disque.add(barre);
    const hTenon = 0.1;
    const tenonRond = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, hTenon, 24), metal);
    tenonRond.rotation.x = Math.PI / 2;
    tenonRond.position.set(0, Y_TROUS, EP / 2 + 0.015 + hTenon / 2);
    disque.add(tenonRond);
    [-1, 1].forEach((s) => {
      const tenon = new T.Mesh(new T.BoxGeometry(0.13, 0.032, hTenon), metal);
      tenon.position.set(s * 0.8, Y_TROUS, EP / 2 + 0.015 + hTenon / 2);
      disque.add(tenon);
    });

    /* --- Les feuilles --- */
    const SEG = 40;
    const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const feuilles = [];
    for (let k = 0; k < N; k++) {
      const tex = new T.CanvasTexture(Dessins.feuille(k, dessins && dessins[k]));
      tex.encoding = T.sRGBEncoding;
      tex.anisotropy = aniso;
      const mat = new T.MeshBasicMaterial({ map: tex, transparent: true, side: T.DoubleSide, alphaTest: 0.02 });
      // Le dos d'une feuille levée laisse seulement deviner le dessin, à l'envers.
      mat.onBeforeCompile = (sh) => {
        sh.fragmentShader = sh.fragmentShader.replace(
          '#include <map_fragment>',
          '#include <map_fragment>\nif (!gl_FrontFacing) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.92, 0.95), 0.7);'
        );
      };
      const geo = new T.PlaneGeometry(SW, SH, 1, SEG);
      const mesh = new T.Mesh(geo, mat);
      mesh.frustumCulled = false;
      disque.add(mesh);
      // k = 0 : dessin n°1, sur le dessus de la pile
      feuilles.push({ k, mesh, geo, mat, z0: Z_PILE + (N - 1 - k) * PAS, a: 0, w: 0, cible: 0 });
    }

    // Plie la feuille selon son angle de levée : la zone des perforations reste à plat,
    // le papier se courbe juste en dessous, et le bas traîne derrière quand la feuille bouge vite.
    function plier(F) {
      const pos = F.geo.attributes.position;
      const ds = SH / SEG, plat = 0.075 * SH;
      let y = CHARNIERE, z = F.z0;
      for (let j = 0; j <= SEG; j++) {
        pos.setY(j * 2, y); pos.setZ(j * 2, z);
        pos.setY(j * 2 + 1, y); pos.setZ(j * 2 + 1, z);
        const s = Math.max(0, (j + 0.5) * ds - plat);
        const pli = 1 - Math.exp(-s / (0.26 * SH));
        const traine = -F.w * 0.035 * Math.pow(s / SH, 1.5);
        const phi = Math.max(0, F.a * pli + traine);
        y -= Math.cos(phi) * ds;
        z += Math.sin(phi) * ds;
      }
      pos.needsUpdate = true;
    }

    const angleLeve = (k) => Math.PI * 0.8 - k * 0.03;
    let image = 0; // dessin visible sur le dessus de la pile
    function viserImage(f) {
      image = f;
      feuilles.forEach((F) => { F.cible = F.k < f ? angleLeve(F.k) : 0; });
    }

    function physique(dt) {
      feuilles.forEach((F) => {
        const acc = 190 * (F.cible - F.a) - 17 * F.w;
        F.w += acc * dt;
        F.a += F.w * dt;
        if (F.a < 0) {            // la feuille retombe sur la pile et rebondit à peine
          F.a = 0;
          F.w = Math.abs(F.w) < 0.3 ? 0 : -F.w * 0.2;
        }
      });
    }

    // Ordre d'affichage : la pile du dessous vers le dessus, puis les feuilles levées,
    // de la plus renversée à la moins renversée.
    function ordonner() {
      feuilles.forEach((F) => {
        F.mesh.renderOrder = F.a > 0.03 ? 100 + (Math.PI - F.a) * 100 : N - 1 - F.k;
        // Une feuille levée s'éloigne de la lumière du disque : elle s'assombrit un peu,
        // et chacune garde une nuance différente pour qu'on distingue les épaisseurs.
        const levee = Math.sin(Math.min(F.a, Math.PI));
        F.mat.color.setScalar(1 - 0.2 * levee - 0.05 * (F.a / Math.PI) + 0.012 * F.k * levee);
      });
    }

    /* --- Lecture automatique : on feuillette à 12 images/seconde, puis on revient --- */
    const auto = { actif: !reduit, phase: 'attente', t: 0.8 };
    function majAuto(dt) {
      if (!auto.actif) return;
      auto.t -= dt;
      if (auto.t > 0) return;
      if (auto.phase === 'attente') {
        auto.phase = 'lecture';
        auto.t = 0;
      } else if (auto.phase === 'lecture') {
        if (image < N - 1) { viserImage(image + 1); auto.t = 1 / 12; }
        else { auto.phase = 'tenue'; auto.t = 1.4; }
      } else if (auto.phase === 'tenue') {
        auto.phase = 'retour';
        auto.t = 0;
      } else if (auto.phase === 'retour') {
        if (image > 0) { viserImage(image - 1); auto.t = 0.035; }
        else { auto.phase = 'attente'; auto.t = 2; }
      }
    }

    /* --- Interaction : la position horizontale du pointeur choisit le dessin --- */
    const pointeur = { x: 0, y: 0 }, lisse = { x: 0, y: 0 };
    let reprise = null;
    canvas.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
      pointeur.x = nx * 2 - 1;
      pointeur.y = ny * 2 - 1;
      auto.actif = false;
      clearTimeout(reprise);
      const f = Math.round(Math.min(1, Math.max(0, (nx - 0.18) / 0.64)) * (N - 1));
      if (f !== image) viserImage(f);
    });
    canvas.addEventListener('pointerleave', () => {
      pointeur.x = pointeur.y = 0;
      if (reduit) return;
      clearTimeout(reprise);
      reprise = setTimeout(() => {
        auto.actif = true;
        auto.phase = 'retour';
        auto.t = 0.4;
      }, 2500);
    });

    /* --- Cadrage --- */
    const vise = new T.Vector3(0, 0.35, 0);
    function ajuster() {
      const r = canvas.getBoundingClientRect();
      const w = Math.max(1, r.width), h = Math.max(1, r.height);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const tan = Math.tan((camera.fov * Math.PI) / 360);
      // Hauteur à cadrer : le disque incliné plus les feuilles levées au-dessus ; largeur : le disque.
      const d = Math.max(5.3 / (2 * tan), 4.3 / (2 * tan * camera.aspect));
      camera.position.set(0, 0.35 + d * 0.1, d);
      camera.lookAt(vise);
      camera.updateProjectionMatrix();
    }
    ajuster();
    if ('ResizeObserver' in window) new ResizeObserver(ajuster).observe(canvas);
    else window.addEventListener('resize', ajuster);

    let visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(conteneur);
    }

    viserImage(0);
    feuilles.forEach(plier);

    let precedent = performance.now();
    function rendu(maintenant) {
      requestAnimationFrame(rendu);
      const dt = Math.min(0.033, (maintenant - precedent) / 1000);
      precedent = maintenant;
      if (!visible || document.hidden) return;

      majAuto(dt);
      physique(dt / 2);
      physique(dt / 2);
      feuilles.forEach(plier);
      ordonner();

      const k = Math.min(1, dt * 4);
      lisse.x += (pointeur.x - lisse.x) * k;
      lisse.y += (pointeur.y - lisse.y) * k;
      const defil = Math.min(1, Math.max(0, window.scrollY / Math.max(1, conteneur.offsetHeight)));
      monde.rotation.x = -0.62 + lisse.y * 0.06 + defil * 0.3;
      monde.rotation.y = -0.34 + lisse.x * 0.16;
      monde.position.y = defil * 0.5;
      disque.rotation.z = -0.05 - lisse.x * 0.05;
      renderer.render(scene, camera);
    }
    requestAnimationFrame(rendu);
    conteneur.classList.add('est-pret');
  }
})();
