/* Statistiques de visite sans cookie (GoatCounter) : pages vues + ce que les visiteurs regardent.
   Rien ne s'active tant que « statistiques » est vide dans js/config.js. */
(function () {
  'use strict';
  const code = String((window.SITE || {}).statistiques || '').trim();
  if (!code || navigator.doNotTrack === '1') return;

  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.dataset.goatcounter = 'https://' + code + '.goatcounter.com/count';
  document.head.append(s);

  // Événement personnalisé : visible dans le tableau de bord, sous « Pages » (type événement).
  const compter = (chemin, titre) => {
    if (window.goatcounter && typeof window.goatcounter.count === 'function') {
      window.goatcounter.count({ path: chemin, title: titre, event: true });
    }
  };
  const texte = (el) => (el ? el.textContent.trim() : '');

  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!t.closest) return;
    const projet = t.closest('.ligne');
    if (projet) {
      const nom = texte(projet.querySelector('.ligne-nom'));
      return compter('projet-ouvert/' + nom, 'Projet ouvert : ' + nom);
    }
    if (t.closest('[data-showreel]')) return compter('showreel', 'Showreel lancé');
    if (t.closest('.email')) return compter('contact/email', 'Clic sur l\'e-mail');
    const reseau = t.closest('.reseaux a');
    if (reseau) compter('contact/' + texte(reseau).toLowerCase(), 'Clic réseau : ' + texte(reseau));
  });

  // Une vidéo regardée jusqu'au bout : le meilleur signe qu'un projet accroche.
  const ecran = document.getElementById('visionneuse-ecran');
  if (ecran) {
    ecran.addEventListener('ended', () => {
      const nom = texte(document.getElementById('visionneuse-titre'));
      compter('projet-fini/' + nom, 'Projet regardé en entier : ' + nom);
    }, true);
  }
})();
