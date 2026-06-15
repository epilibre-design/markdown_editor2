# Spec : page de configuration `configurer_markdown_editor`

Date : 2026-06-14

## Contexte

`paquet.xml` déclare une entrée de menu `configurer_markdown_editor` dans `menu_configuration`, mais aucun formulaire CVT correspondant n'existe. Le menu pointe vers une page vide. L'objectif est de créer ce formulaire avec les deux réglages déjà implémentés dans le code PHP.

## Périmètre

Deux réglages, stockés sous le casier SPIP `inserer_modeles` :

| Clé config           | Type stocké | Effet                                              |
|----------------------|-------------|----------------------------------------------------|
| `ignorer_modeles`    | `array`     | Clés des modèles exclus du sélecteur               |
| `activer_categories` | `string`    | `'on'` ou vide — groupe les modèles par catégorie  |

Pas de nouveaux réglages. Pas de suppression de réglages existants.

## Architecture

Saisies **Méthode 1** : `_saisies()` + HTML vide. Aucun charger/verifier/traiter custom — Saisies gère lecture et écriture config via `_meta_casier`.

## Fichiers à créer / modifier

### `formulaires/configurer_markdown_editor.php` (nouveau)

Une seule fonction :

```php
function formulaires_configurer_markdown_editor_saisies_dist(): array {
    include_spip('inc/inserer_modeles');
    $tous = inserer_modeles_lister_formulaires_modeles(false); // sans filtrage des ignorés
    $data = array_map(fn($d) => $d['nom'], $tous);

    return [
        ['saisie' => 'hidden',  'options' => ['nom' => '_meta_casier',       'defaut' => 'inserer_modeles']],
        ['saisie' => 'cases',   'options' => ['nom' => 'ignorer_modeles',    'label' => _T('inserer_modeles:ignorer_modeles'),   'data' => $data]],
        ['saisie' => 'oui_non', 'options' => ['nom' => 'activer_categories', 'label' => _T('inserer_modeles:activer_categorie')]],
    ];
}
```

`inserer_modeles_lister_formulaires_modeles(false)` retourne tous les modèles y compris les ignorés — indispensable pour pouvoir les décocher.

### `formulaires/configurer_markdown_editor.html` (nouveau)

Fichier vide (ou whitespace). Saisies Méthode 1 ne lit pas ce fichier pour le rendu.

### `lang/markdown_editor_fr.php` (modifié)

Ajouter la clé manquante référencée dans `paquet.xml` (`titre="markdown_editor:configuration_titre"`) :

```php
'configuration_titre' => 'Configurer l\'éditeur Markdown',
```

Les labels des saisies (`ignorer_modeles`, `activer_categorie`) existent déjà dans `inserer_modeles_fr.php`.

## Flux de données

```
charger()  ← automatique via _meta_casier
  lire_config('inserer_modeles/ignorer_modeles')    → [] ou ['doc', 'img', ...]
  lire_config('inserer_modeles/activer_categories') → 'on' ou null

traiter()  ← automatique via _meta_casier
  ecrire_config('inserer_modeles/ignorer_modeles',    [...])
  ecrire_config('inserer_modeles/activer_categories', 'on'|'')
```

## Tests

Pas de tests automatisés pour le formulaire de configuration (formulaire d'admin, pas de CVT métier). Vérification manuelle :

- [ ] La page de menu administration s'affiche sans erreur PHP
- [ ] Les cases à cocher reflètent les modèles disponibles
- [ ] Cocher/décocher des modèles et sauvegarder → le sélecteur `inserer_modeles` les cache / les montre
- [ ] `activer_categories` → le sélecteur groupe ou aplatit les modèles
- [ ] Après rechargement de la page config, les valeurs sauvegardées sont pre-cochées

## Hors périmètre

- Page de configuration de l'éditeur Markdown lui-même (formatage, thème, etc.)
- Gestion des catégories personnalisées (autre plugin)
- Tests PHPUnit (aucun test config existant dans ce plugin)
