# Éditeur de texte markdown pour SPIP

Ce plugin fournit un éditeur WYSIWYG (ou au moins WYSIWYM) permettant d'éditer les textes sans voir le code source en syntaxe légère. Il n'est actif que sur les textes en markdown, et remplace donc le porte-plume de SPIP qui lui est pour la syntaxe légère de SPIP.

L'éditeur est basé sur TipTap, lui même basé sur ProseMirror. On y ajoute des nodes propres à SPIP (modèles, balise `<html>`, balise `<multi>`) afin que nos spécificités soient prises en compte.

## Développement

Ce plugin nécessite de nombreuses librairies JS, dont la dépendance est géré par NPM. Pour pouvoir fournir un paquet utilisable par SPIP, il faut empaqueter tout ça dans un gros JS. Cela est fait avec Webpack pour l'instant (à changer pour Bun et peaufiner avec les importmaps de Placido pour SPIP 5) : `npm run build`

## Todo

- [x] Un node pour les modèles SPIP
- [x] Un node pour la balise `<html>`
- [x] Un node pour la balise `<multi>` en inline à l'intérieur d'un texte
- [x] Un node pour la balise `<multi>` en block entourant d'autres blocs
- [x] Synchronisation double sens parfaite entre éditeur TipTap et le textarea de syntaxe légère (le vrai code source du texte stocké dans la base)
  - [x] Si on édite le WYSIWYG, le texte source est mis à jour en exportant en Markdown (customisé pour SPIP)
  - [x] Si on édite le texte source, l'éditeur WYSIWYG se met à jour immédiatement en réimportant le Markdown changé
- [ ] ~~Les liens de l'éditeur devraient être exportés en liens SPIP une fois en markdown ? (à confirmer)~~ [Corriger le ticket #9 du plugin Markdown](https://git.spip.net/spip-contrib-extensions/markdown/-/issues/9)
- [x] Interface avec des boutons pour les actions les plus courantes (ce serait plus simple en ayant résolu le ticket sur les icônes génériques !)
- [x] Interface pour switcher entre le WYSIWYG et le code brut à éditer
- [x] Interface pour ajouter des modèles ET éditer les existants, quand on a un YAML de description (remplacer Insérer Modèles)
- [x] Ajouter un mode "Plein écran"
- [ ] Trouver une solution pour Plein écran + Modèles
- [x] Mettre au propre toutes les chaines de langue
- [x] Pouvoir personnaliser la vue d'un modèle dans l'éditeur : par défaut c'est le code habituel, mais si on personnalise on pourrait y mettre ce qu'on veut suivant les modèles
- [ ] Refaire le #FORMULAIRE_INSERER_MODELES entièrement avec l'API de Saisies, sans squelettes, en utilisant les "inserer_debut/fin" pour les ajouts et la fonction `_saisies()`.
- [ ] Rendre l'éditeur extensible en pouvant rajouter des nodes ET des boutons depuis des sous-plugins de SPIP (exemple : plugin Todolist, plugin FAQ, plugin Onglets dans le texte : tout ce qui avant ajoutaient des choses en Textwheel ET au Porte-Plume). Attention, maintenant il faudrait plutôt étendre le markdown qu'ajouter en textwheel, côté PHP.