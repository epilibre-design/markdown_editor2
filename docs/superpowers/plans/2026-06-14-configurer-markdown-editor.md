# configurer_markdown_editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer le formulaire CVT `configurer_markdown_editor` avec deux réglages (`ignorer_modeles` et `activer_categories`) pour que l'entrée de menu admin existante pointe vers une vraie page.

**Architecture:** Saisies Méthode 1 — `_saisies()` seule, HTML vide, `_meta_casier = 'inserer_modeles'` pour que Saisies gère lecture et écriture config automatiquement. Aucun charger/verifier/traiter custom.

**Tech Stack:** PHP (SPIP CVT), plugin Saisies, `lire_config` / `ecrire_config` SPIP.

---

## Fichiers

| Action  | Fichier                                                  | Rôle                              |
|---------|----------------------------------------------------------|-----------------------------------|
| Créer   | `formulaires/configurer_markdown_editor.php`             | Saisies du formulaire de config   |
| Créer   | `formulaires/configurer_markdown_editor.html`            | Template vide (Méthode 1)         |
| Modifier| `lang/markdown_editor_fr.php`                            | Clé `configuration_titre` manquante|

---

### Task 1 : Template HTML vide

**Files:**
- Create: `formulaires/configurer_markdown_editor.html`

- [ ] **Step 1 : Créer le fichier vide**

Contenu exact du fichier (un fichier vide provoque une erreur SPIP, un whitespace suffit) :

```html

```

(Fichier contenant un seul saut de ligne.)

- [ ] **Step 2 : Vérifier que le fichier existe**

```bash
ls -la /src/plugins/markdown_editor/formulaires/configurer_markdown_editor.html
```

Attendu : fichier présent, taille 1 octet.

---

### Task 2 : Clé de traduction manquante

**Files:**
- Modify: `lang/markdown_editor_fr.php`

`paquet.xml` déclare `titre="markdown_editor:configuration_titre"` pour l'entrée de menu. Cette clé est absente du fichier de langue.

- [ ] **Step 1 : Ajouter la clé dans `lang/markdown_editor_fr.php`**

Après la ligne `'outil_undo_label' => 'Annuler',` (dernière entrée avant la fermeture du tableau), ajouter :

```php
	'configuration_titre' => 'Configurer l\'éditeur Markdown',
```

Résultat attendu (fin du tableau) :

```php
	'outil_undo_label' => 'Annuler',
	'configuration_titre' => 'Configurer l\'éditeur Markdown',
];
```

- [ ] **Step 2 : Vérifier la syntaxe PHP**

```bash
php -l /src/plugins/markdown_editor/lang/markdown_editor_fr.php
```

Attendu : `No syntax errors detected`

---

### Task 3 : Formulaire PHP (_saisies)

**Files:**
- Create: `formulaires/configurer_markdown_editor.php`

- [ ] **Step 1 : Créer le fichier**

```php
<?php

function formulaires_configurer_markdown_editor_saisies_dist(): array {
	include_spip('inc/inserer_modeles');

	// Charger TOUS les modèles, y compris les ignorés, pour pouvoir les décocher
	$tous = inserer_modeles_lister_formulaires_modeles(false);
	$data = array_map(fn($d) => $d['nom'], $tous);

	return [
		[
			'saisie'  => 'hidden',
			'options' => ['nom' => '_meta_casier', 'defaut' => 'inserer_modeles'],
		],
		[
			'saisie'  => 'cases',
			'options' => [
				'nom'   => 'ignorer_modeles',
				'label' => _T('inserer_modeles:ignorer_modeles'),
				'data'  => $data,
			],
		],
		[
			'saisie'  => 'oui_non',
			'options' => [
				'nom'   => 'activer_categories',
				'label' => _T('inserer_modeles:activer_categorie'),
			],
		],
	];
}
```

- [ ] **Step 2 : Vérifier la syntaxe PHP**

```bash
php -l /src/plugins/markdown_editor/formulaires/configurer_markdown_editor.php
```

Attendu : `No syntax errors detected`

- [ ] **Step 3 : Commit**

```bash
git add formulaires/configurer_markdown_editor.php \
        formulaires/configurer_markdown_editor.html \
        lang/markdown_editor_fr.php \
        docs/superpowers/specs/2026-06-14-configurer-markdown-editor-design.md \
        docs/superpowers/plans/2026-06-14-configurer-markdown-editor.md
git commit -m "feat: page de configuration admin (ignorer_modeles + activer_categories)"
```

---

### Task 4 : Vérification manuelle dans SPIP

Pas de tests automatisés (formulaire d'admin, pas de fixture de config dans l'infra PHPUnit du plugin).

- [ ] **Step 1 : Ouvrir la page admin**

Naviguer vers `ecrire/?exec=configurer_markdown_editor`. La page doit s'afficher sans erreur PHP ni page blanche.

- [ ] **Step 2 : Vérifier le rendu des saisies**

La page doit montrer :
- Un groupe de cases à cocher listant les modèles disponibles, avec le label "Ne pas proposer les modèles suivants"
- Une saisie oui/non "Regrouper les modèles proposés en catégorie"
- Un bouton "Enregistrer"

- [ ] **Step 3 : Tester `ignorer_modeles`**

Cocher un modèle (ex. `doc`), sauvegarder. Rouvrir le formulaire d'insertion de modèles → le modèle `doc` ne doit plus apparaître dans la liste.

Après test, décocher `doc` et sauvegarder pour remettre l'état propre.

- [ ] **Step 4 : Tester `activer_categories`**

Activer "Regrouper les modèles en catégorie", sauvegarder. Ouvrir le formulaire d'insertion → les modèles doivent être groupés par catégorie (ex. "Média" / "Autre"). Désactiver et vérifier que la liste est aplatie.

- [ ] **Step 5 : Vérifier la persistance**

Recharger la page `configurer_markdown_editor` → les valeurs cochées/décochées doivent être pré-remplies.
