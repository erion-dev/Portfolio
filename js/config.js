/* ------------------------------------------------------------------
   CONTENU DU SITE
   Modifie ce fichier pour changer les textes, les liens et les projets.
   Pas besoin de toucher aux autres fichiers.

   Vidéos : mets tes fichiers .mp4 dans le dossier « videos/ »
   puis indique le chemin, par exemple  video: "videos/renard.mp4".
   Tu peux aussi utiliser Vimeo ou YouTube : colle seulement
   l'identifiant de la vidéo (les chiffres/lettres à la fin du lien).
   Tant qu'un projet n'a pas de vidéo, une petite boucle dessinée
   s'affiche à sa place.
   ------------------------------------------------------------------ */

window.SITE = {
  nom: "Nathan",
  metier: "Animateur 2D",
  accroche:
    "J'anime des personnages et des histoires en 2D, image par image, du storyboard jusqu'à l'image finale, et j'anime majoritairement des manga et des comics.",

  email: "erion76500@gmail.com",

  // Statistiques de visite (GoatCounter, sans cookie). Mets ici ton code de site,
  // par exemple "nathan" si ton tableau de bord est nathan.goatcounter.com. Vide = désactivé.
  statistiques: "erionngl",
  // Un réseau sans lien (url vide) n'est pas affiché sur le site.
  reseaux: [
    { nom: "YouTube", url: "https://www.youtube.com/@erion_ngl" },
    { nom: "Instagram", url: "https://www.instagram.com/nathan.ngl1/" },
    { nom: "TikTok", url: "https://www.tiktok.com/@erionngl" },
    { nom: "LinkedIn", url: "" }
  ],

  // Showreel : remplis UNE seule des trois sources.
  // Laissé vide, le bouton « Voir le showreel » enchaîne les vidéos des projets.
  showreel: { video: "", vimeo: "", youtube: "" },

  // À propos (un paragraphe par ligne)
  bio: [
    "Je suis animateur 2D. Je travaille comme sur papier, même sur tablette : des poses clés, des intervalles, et j'anime majoritairement des manga et des comics.",
    "J'aime les personnages qui ont du poids, le timing précis et les boucles qu'on peut regarder dix fois. Je travaille seul ou en équipe, sur des clips, des publicités, des génériques et des courts métrages."
  ],
  outils: ["Blender", "Alight Motion"],
  photo: "", // ex : "images/portrait.jpg"

  /* PROJETS
     - titre, type, client, annee : à corriger si besoin (titres provisoires)
     - duree : au format minutes:secondes, le site calcule le nombre d'images
     - video : la version complète (avec le son), ouverte au clic
     - extrait : une version légère et muette, jouée au survol (facultatif)
     - image : la vignette affichée avant le chargement de la vidéo
     - motif / couleur : la boucle dessinée affichée tant qu'il n'y a pas de vidéo
       (motifs possibles : balle, pendule, vague, goutte, flamme) */
  projets: [
    {
      titre: "Éveil",
      type: "Séquence d'action",
      client: "Projet personnel",
      annee: 2026,
      duree: "0:32",
      description:
        "Une traversée de lumière bleue, un éclat d'énergie, puis une silhouette qui flotte dans le blanc.",
      video: "videos/3653.mp4", extrait: "videos/3653-apercu.mp4", image: "images/3653.jpg",
      vimeo: "", youtube: "",
      motif: "flamme", couleur: "#9DB4E8"
    },
    {
      titre: "Affrontement",
      type: "Animation de combat",
      client: "Projet personnel",
      annee: 2026,
      duree: "0:29",
      description:
        "Un personnage, une créature, et un combat tout en traits nerveux, impacts et explosions.",
      video: "videos/3651.mp4", extrait: "videos/3651-apercu.mp4", image: "images/3651.jpg",
      vimeo: "", youtube: "",
      motif: "pendule", couleur: "#E58C9A"
    },
    {
      titre: "Effets et impacts",
      type: "Animation d'effets",
      client: "Projet personnel",
      annee: 2026,
      duree: "0:18",
      description:
        "Fumée, explosions, éclairs et étincelles : une série d'effets animés image par image, avec l'outil d'animation 2D de Blender.",
      video: "videos/3652.mp4", extrait: "videos/3652-apercu.mp4", image: "images/3652.jpg",
      vimeo: "", youtube: "",
      motif: "goutte", couleur: "#8FC7B5"
    },
    {
      titre: "Chibi",
      type: "Animation de personnage",
      client: "Projet personnel",
      annee: 2026,
      duree: "0:22",
      description:
        "Un petit personnage chibi qui parle et change d'expression, sur fond noir.",
      video: "videos/3654.mp4", extrait: "videos/3654-apercu.mp4", image: "images/3654.jpg",
      vimeo: "", youtube: "",
      motif: "balle", couleur: "#F2C879"
    },
    {
      titre: "Évolution",
      type: "Making of, format vertical",
      client: "Projet personnel",
      annee: 2026,
      duree: "0:57",
      description:
        "De février 2025 à mai 2026 : des dessins faits à la main sur téléphone jusqu'aux fonds 3D réalisés avec Blender.",
      video: "videos/3782.mp4", extrait: "videos/3782-apercu.mp4", image: "images/3782.jpg",
      vimeo: "", youtube: "",
      motif: "vague", couleur: "#B9A4E8"
    }
  ]
};
