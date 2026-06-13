# Refonte du formulaire `inserer_modeles` avec l'API Saisies

**Date :** 2026-06-14
**Plugin :** markdown_editor (fork md_editor)
**Statut :** design validé, à planifier

## Contexte et objectif

Le TODO du codeur d'origine : *« Refaire le `#FORMULAIRE_INSERER_MODELES`
entièrement avec l'API de Saisies, sans squelettes, en utilisant les
"inserer_debut/fin" pour les ajouts et la fonction `_saisies()`. »*

Aujourd'hui, `formulaires/inserer_modeles.html` est un squelette écrit à la main
(Méthode 1b de Saisies) : il appelle `#GENERER_SAISIES` mais porte aussi tout le
markup custom (titre, `<textarea>` résultat, champ caché, boutons nommés, script
modalbox) dans une `BOUCLE_deja_choisi` qui bascule entre deux états.

L'objectif est de passer à la **Méthode 1 « pure »** de Saisies : déclarer les
champs dans une fonction `formulaires_inserer_modeles_saisies()`, vider le fichier
HTML, et injecter le markup non-champ via `inserer_debut`/`inserer_fin`.

### Portée

**Refonte structurelle iso-comportement.** Même UX et même comportement
qu'aujourd'hui (2 états, ajax, modalbox, double-clic d'insertion, libellés). Seule
la structure interne du CVT change. `verifier()` et `traiter()` ne changent pas —
les tests d'intégration existants (`CvtTraiterTest`) sont le garde-fou.

Hors périmètre : refonte ergonomique, la saisie custom `param_modele`, les libellés.

## Contraintes techniques découvertes

Vérifié dans les sources de Saisies v6.3.2 (`formulaires/inc-saisies-cvt.html`) :

- `inserer_debut` / `inserer_fin` sont des **options globales** du formulaire
  (`_saisies/options/inserer_debut`), pas des clés de contexte CVT.
- Elles s'affichent en **HTML brut** (`#ENV**{...}`) et **en dehors du `<form>`**
  (`inserer_debut` juste avant, `inserer_fin` juste après). Conséquence : tout ce
  qui doit être *dans* le form (champ caché, **boutons submit**) ne peut pas y passer.
- Le scaffolding auto ne génère qu'**un seul** bouton submit. Pour des boutons
  multiples/nommés, Saisies expose l'option `squelette_boutons` (template de boutons
  personnalisé, rendu *dans* le form).

## Architecture

### Découpage des fichiers

| Fichier | Rôle après refonte |
|---------|--------------------|
| `formulaires/inserer_modeles.php` | Ajoute `formulaires_inserer_modeles_saisies_dist()` (déclaration des champs selon l'état). `charger` fournit le contexte (valeurs, `inserer_debut`/`inserer_fin` rendus, drapeaux). `verifier`/`traiter` **inchangés**. |
| `formulaires/inserer_modeles.html` | **Vidé** (présent mais vide → scaffolding auto). |
| `formulaires/inserer_modeles_boutons.html` | **Nouveau** : 1 à 3 boutons contextuels (`choisir` / `annuler`+`inserer`). |
| `formulaires/inserer_modeles_entete.html` | **Nouveau** : titre+icône + `<textarea code_modele>` + script modalbox. |
| `prive/squelettes/contenu/inserer_modeles.html` | **Inchangé** (appelle `#FORMULAIRE_INSERER_MODELES{...}`). |
| `inc/inserer_modeles.php` | **Inchangé** (lister / charger_infos / generer_saisie…). |

### Composants et interfaces

**`formulaires_inserer_modeles_saisies_dist($formulaire_modele, $modalbox, $env)`**
— branche sur l'état (comme l'actuelle `BOUCLE_deja_choisi`) :

- **État (a) — aucun modèle choisi** : retourne
  `[ 'options' => {ajax, squelette_boutons}, <saisie radio de la liste des modèles> ]`.
  La saisie radio est produite par `inserer_modeles_generer_saisie_formulaire_modele()`
  (déjà existante).
- **État (b) — modèle choisi** : retourne
  `[ 'options' => {ajax, squelette_boutons, inserer_debut, inserer_fin},
     <hidden formulaire_modele>, ...parametres du yaml... ]`.
  Les paramètres viennent de `charger_infos_formulaire_modele($formulaire_modele)['parametres']`.

`options.squelette_boutons` = `'formulaires/inserer_modeles_boutons'` dans les deux
états ; le squelette gère le contextuel via `#ENV{formulaire_modele}`.

**`formulaires_inserer_modeles_charger_dist(...)`** — conserve sa logique actuelle
(retrouver le modèle, `set_request` des `id_*`, valeurs passées par l'URL, drapeaux
`modalbox`/`ne_pas_afficher_bouton_annuler`) et, en état (b), remplit
`inserer_debut`/`inserer_fin` via
`recuperer_fond('formulaires/inserer_modeles_entete', $env)`.

**`inserer_modeles_boutons.html`** :

```spip
[(#ENV{formulaire_modele}|oui)
  [(#ENV{ne_pas_afficher_bouton_annuler}|non)
    <button type="submit" class="submit btn_secondaire" name="annuler" value="1" formnovalidate><:bouton_annuler:></button>]
  <button type="submit" class="submit" name="inserer" value="1"><:inserer_modeles:bouton_inserer:></button>
]
[(#ENV{formulaire_modele}|non)
  <button type="submit" class="submit" name="choisir" value="1"><:inserer_modeles:bouton_choisir:></button>
]
```

**`inserer_modeles_entete.html`** : reprend le titre+icône, la `<textarea>`
`code_modele` (readonly, `data-spip_model`, `ondblclick` conditionnel) et le script
de fermeture modalbox, tels quels depuis l'actuel `.html`.

## Flux de données

1. Le privé charge `prive/squelettes/contenu/inserer_modeles.html` (ajax `var_zajax=contenu`).
2. `#FORMULAIRE_INSERER_MODELES{formulaire_modele, modalbox, env}` déclenche le CVT.
3. `charger()` calcule le contexte (état, valeurs, entête rendu, drapeaux).
4. `_saisies()` déclare les champs selon l'état ; le scaffolding Saisies génère le
   wrapper, les champs, les messages d'erreur, et inclut `squelette_boutons`.
5. À la soumission `choisir` → on repasse en état (b) ; `inserer`/`annuler` →
   `verifier()` puis `traiter()` (inchangés) produisent `_code_modele`,
   `_json_editeur`, `_js_inserer_code`.

## Gestion des erreurs / risques

- **Risque n°1 — fusion `options.inserer_debut` (déclaré dans `_saisies`) vs valeurs
  calculées dans `charger`.** `_saisies()` et `charger()` étant deux fonctions
  distinctes, il faut s'assurer que la chaîne `inserer_debut` calculée par `charger`
  parvient bien à l'option du formulaire. **Repli** si la fusion options↔contexte
  coince : déclarer l'entête comme une saisie de type `html` en tête de liste dans
  `_saisies()` (rendu *dans* le form, équivalent visuel).
- **Risque n°2 — vidage complet du `.html`.** Vérifier que le rendu ajax/modalbox
  (`class="ajax"`, fermeture modalbox) passe toujours par le scaffolding auto.
- **Risque n°3 — valeurs/défauts des champs.** S'assurer que les valeurs passées par
  l'URL et le cas particulier `align` restent injectés (aujourd'hui faits dans
  `charger`).

## Tests

- **Garde-fou existant** : `tests/integration/CvtTraiterTest.php` (génération du code
  modèle) doit rester vert sans modification.
- **Nouveau test** : `formulaires_inserer_modeles_saisies()` retourne le bon jeu de
  champs selon l'état — (a) la saisie radio de la liste ; (b) le hidden
  `formulaire_modele` + les paramètres du yaml. Test d'intégration (besoin du yaml +
  plugin saisies).
- Vérification manuelle du rendu privé (2 états, modalbox, double-clic) en complément.

## Critères de réussite

1. `formulaires/inserer_modeles.html` est vide ; le formulaire s'affiche et fonctionne
   à l'identique dans les deux états.
2. Les boutons contextuels (`choisir` / `annuler` / `inserer`) restent dans le `<form>`
   et déclenchent les mêmes traitements.
3. `CvtTraiterTest` reste vert ; le nouveau test `_saisies()` passe.
4. Aucune régression de l'insertion du code modèle ni de la fermeture modalbox.
