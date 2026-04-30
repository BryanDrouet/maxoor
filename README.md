# Maxoor Inc.

Maxoor Inc. est un site vitrine parodique autour d'un faux "lait de la jeunesse". Le projet mélange landing page, boutique fictive, easter egg et pages légales de démonstration, avec une identité visuelle volontairement sérieuse pour un contenu totalement absurde.

Site en ligne : https://maxoor.bryan.ovh/

## À propos

Le site a été conçu comme une fausse marque de cosmétique / boisson de rajeunissement. Tout l'univers est fictif et le projet ne correspond à aucune activité commerciale réelle.

Le dépôt sert surtout de terrain de jeu front-end avec une structure simple, des modules JavaScript réutilisables, des images optimisées et une mesure d'audience gratuite branchée après consentement.

## Fonctionnalités

- Page d'accueil avec hero, partenariat, sections de présentation et formulaire de contact
- Boutique fictive avec filtres, recherche, panier et promos
- Visionneuse d'images avec zoom et retour aux images originales en plein écran
- Bandeau cookies avec consentement persistant
- Pages légales dédiées : mentions légales, politique de confidentialité et CGV
- Mini espace caché / easter egg accessible depuis le site
- Suivi d'audience via Google Analytics 4 après consentement

## Stack

- HTML
- CSS
- JavaScript modulaire
- Google Fonts
- Lucide pour les icônes
- Google Analytics 4 pour la mesure d'audience

## Structure

- [index.html](index.html) : page d'accueil
- [boutique/](boutique/) : boutique fictive
- [launch/](launch/) : page de lancement
- [cgv/](cgv/) : conditions générales de vente parodiques
- [mentions-legales/](mentions-legales/) : mentions légales
- [politique-de-confidentialite/](politique-de-confidentialite/) : politique de confidentialité
- [js/](js/) : logique principale et modules partagés
- [assets/](assets/) : images et ressources statiques

## Développement local

Le site étant statique, tu peux l'ouvrir avec un serveur local simple. Par exemple :

```bash
npx serve .
```

Ou avec un serveur Python :

```bash
python3 -m http.server 8000
```

## Notes

- Les contenus sont volontairement parodiques.
- Les formulaires et les éléments de suivi sont prévus pour fonctionner côté navigateur.
- La mesure d'audience ne se charge qu'après acceptation des cookies.