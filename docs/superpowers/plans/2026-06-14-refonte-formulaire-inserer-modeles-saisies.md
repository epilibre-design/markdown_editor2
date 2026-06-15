# Refonte du formulaire `inserer_modeles` (API Saisies) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer le CVT `inserer_modeles` vers la Méthode 1 de Saisies (fonction `_saisies()` + fichier HTML vide), iso-comportement.

**Architecture:** Une fonction `formulaires_inserer_modeles_saisies_dist()` déclare les champs selon l'état (a : choix du modèle / b : paramètres). Les boutons contextuels passent par un mini-squelette `squelette_boutons` (dans le `<form>`) ; le titre + textarea résultat + script modalbox passent par `options.inserer_debut`, rendu en chaîne via `recuperer_fond` d'un mini-squelette `entete`. Un helper partagé résout l'état pour que `charger()` et `_saisies()` ne divergent jamais. `verifier()`/`traiter()` ne changent pas.

**Tech Stack:** SPIP 4.4, plugin Saisies v6.x, PHPUnit 11 (tier intégration : SPIP réel + SQLite, déjà installé via `composer install-spip-test`).

---

## Préliminaire — environnement

Tous les tests de ce plan sont des tests d'**intégration** (ils ont besoin du yaml du modèle, du plugin Saisies et de `recuperer_fond`). L'environnement doit être prêt :

```bash
cd /src/plugins/markdown_editor
ls vendor/spip/spip/config/connect.php   # doit exister ; sinon : composer install-spip-test
```

Commande de test générique utilisée dans le plan :
```bash
composer tests-integration -- --filter <NomDuTest>
```

## File Structure

| Fichier | Responsabilité | Action |
|---------|----------------|--------|
| `formulaires/inserer_modeles.php` | Helper d'état, `_saisies()`, `charger` (allégé). `verifier`/`traiter` inchangés. | Modifier |
| `formulaires/inserer_modeles.html` | Rendu — délégué au scaffolding Saisies. | Vider |
| `formulaires/inserer_modeles_boutons.html` | Boutons contextuels (dans le form). | Créer |
| `formulaires/inserer_modeles_entete.html` | Titre + textarea résultat + script modalbox. | Créer |
| `tests/integration/EtatModeleTest.php` | Teste le helper d'état. | Créer |
| `tests/integration/BoutonsRenduTest.php` | Teste le rendu du squelette boutons. | Créer |
| `tests/integration/EnteteRenduTest.php` | Teste le rendu du squelette entête. | Créer |
| `tests/integration/SaisiesFormulaireTest.php` | Teste la structure retournée par `_saisies()`. | Créer |
| `tests/integration/ChargerEtatTest.php` | Teste le contexte de `charger()` après refonte. | Créer |

> Décision de planification (affine la spec, Risque n°1) : `inserer_debut` est construit **dans `_saisies()`** (pas dans `charger`), via `recuperer_fond`. `_saisies()` a accès à tout le nécessaire (`charger_infos_formulaire_modele` pour le nom/icône ; `_request('_code_modele'…)` posé par `traiter`). Cela supprime le problème de fusion options↔contexte. `inserer_fin` n'est pas nécessaire : le script modalbox tient dans l'entête.

---

### Task 1 : Helper de résolution d'état

Un seul point de vérité pour décider entre l'état (a) « liste » et (b) « paramètres », réutilisé par `charger()` et `_saisies()`. Reproduit exactement la condition de l'actuel `charger()`.

**Files:**
- Modify: `formulaires/inserer_modeles.php` (ajout d'une fonction)
- Test: `tests/integration/EtatModeleTest.php`

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `tests/integration/EtatModeleTest.php` :

```php
<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Résolution de l'état du formulaire : inserer_modeles_etat_formulaire_modele().
 * '' => état liste (a) ; préfixe non vide => état paramètres (b).
 */
final class EtatModeleTest extends TestCase
{
    public static function setUpBeforeClass(): void
    {
        include_spip('formulaires/inserer_modeles');
    }

    private function reset(): void
    {
        foreach (['annuler', 'formulaire_modele'] as $k) {
            set_request($k, null);
        }
    }

    protected function setUp(): void { $this->reset(); }
    protected function tearDown(): void { $this->reset(); }

    public function testPrefixeFourniEnArgument(): void
    {
        $this->assertSame('media', inserer_modeles_etat_formulaire_modele('media', serialize([])));
    }

    public function testAnnulerRameneALaListe(): void
    {
        set_request('annuler', '1');
        $this->assertSame('', inserer_modeles_etat_formulaire_modele('media', serialize([])));
    }

    public function testPrefixeDepuisRequest(): void
    {
        set_request('formulaire_modele', 'media');
        $this->assertSame('media', inserer_modeles_etat_formulaire_modele('', serialize([])));
    }

    public function testRetrouveDepuisEnvModele(): void
    {
        // media.yaml déclare la saisie 'modele' avec defaut 'doc'
        $this->assertSame('media', inserer_modeles_etat_formulaire_modele('', serialize(['modele' => 'doc'])));
    }

    public function testRienNeDonneEtatListe(): void
    {
        $this->assertSame('', inserer_modeles_etat_formulaire_modele('', serialize([])));
    }
}
```

- [ ] **Step 2 : Lancer le test, vérifier l'échec**

Run: `composer tests-integration -- --filter EtatModeleTest`
Expected: FAIL — `Error: Call to undefined function inserer_modeles_etat_formulaire_modele()`

- [ ] **Step 3 : Implémenter le helper**

Dans `formulaires/inserer_modeles.php`, ajouter cette fonction (juste après `<?php`, avant `inserer_modeles_retrouver_formulaire_modele`) :

```php
/**
 * Résout l'état du formulaire d'insertion de modèle.
 *
 * @param string $formulaire_modele Préfixe éventuellement imposé par l'appel.
 * @param string|array $env Environnement (sérialisé ou déjà tableau).
 * @return string '' pour l'état liste (a), le préfixe du modèle pour l'état paramètres (b).
 */
function inserer_modeles_etat_formulaire_modele($formulaire_modele, $env): string {
	include_spip('inc/inserer_modeles');
	if (is_string($env)) {
		$env = unserialize($env) ?: [];
	}
	if (!$formulaire_modele && isset($env['modele'])) {
		$formulaire_modele = inserer_modeles_retrouver_formulaire_modele($env['modele']);
	}
	if (_request('annuler')) {
		return '';
	}
	if (!$formulaire_modele) {
		$formulaire_modele = _request('formulaire_modele');
	}
	return (string) $formulaire_modele;
}
```

- [ ] **Step 4 : Lancer le test, vérifier le succès**

Run: `composer tests-integration -- --filter EtatModeleTest`
Expected: PASS (5 tests)

- [ ] **Step 5 : Commit**

```bash
git add formulaires/inserer_modeles.php tests/integration/EtatModeleTest.php
git commit -m "$(printf 'feat: helper de résolution d'\''état du formulaire inserer_modeles\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

### Task 2 : Mini-squelette des boutons

Boutons contextuels rendus *dans* le `<form>` via l'option Saisies `squelette_boutons`.

**Files:**
- Create: `formulaires/inserer_modeles_boutons.html`
- Test: `tests/integration/BoutonsRenduTest.php`

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `tests/integration/BoutonsRenduTest.php` :

```php
<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Rendu du mini-squelette des boutons selon l'état.
 */
final class BoutonsRenduTest extends TestCase
{
    public function testEtatListeAfficheChoisir(): void
    {
        $html = recuperer_fond('formulaires/inserer_modeles_boutons', ['formulaire_modele' => '']);
        $this->assertStringContainsString('name="choisir"', $html);
        $this->assertStringNotContainsString('name="inserer"', $html);
    }

    public function testEtatParametresAfficheInsererEtAnnuler(): void
    {
        $html = recuperer_fond('formulaires/inserer_modeles_boutons', ['formulaire_modele' => 'media']);
        $this->assertStringContainsString('name="inserer"', $html);
        $this->assertStringContainsString('name="annuler"', $html);
        $this->assertStringNotContainsString('name="choisir"', $html);
    }

    public function testBoutonAnnulerMasquable(): void
    {
        $html = recuperer_fond('formulaires/inserer_modeles_boutons', [
            'formulaire_modele' => 'media',
            'ne_pas_afficher_bouton_annuler' => 'on',
        ]);
        $this->assertStringContainsString('name="inserer"', $html);
        $this->assertStringNotContainsString('name="annuler"', $html);
    }
}
```

- [ ] **Step 2 : Lancer le test, vérifier l'échec**

Run: `composer tests-integration -- --filter BoutonsRenduTest`
Expected: FAIL — `recuperer_fond` ne trouve pas le squelette, rendu vide → `assertStringContainsString('name="choisir"')` échoue.

- [ ] **Step 3 : Créer le squelette**

Créer `formulaires/inserer_modeles_boutons.html` :

```html
<p class="boutons">
[(#ENV{formulaire_modele}|oui)
	[(#ENV{ne_pas_afficher_bouton_annuler}|non)<button type="submit" class="submit btn_secondaire" name="annuler" value="1" formnovalidate><:bouton_annuler:></button>]
	<button type="submit" class="submit" name="inserer" value="1"><:inserer_modeles:bouton_inserer:></button>
]
[(#ENV{formulaire_modele}|non)
	<button type="submit" class="submit" name="choisir" value="1"><:inserer_modeles:bouton_choisir:></button>
]
</p>
```

- [ ] **Step 4 : Lancer le test, vérifier le succès**

Run: `composer tests-integration -- --filter BoutonsRenduTest`
Expected: PASS (3 tests)

- [ ] **Step 5 : Commit**

```bash
git add formulaires/inserer_modeles_boutons.html tests/integration/BoutonsRenduTest.php
git commit -m "$(printf 'feat: mini-squelette des boutons contextuels du formulaire inserer_modeles\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

### Task 3 : Mini-squelette de l'entête (titre + textarea + script modalbox)

Le markup d'affichage que la note veut placer dans `inserer_debut`. Repris à l'identique de l'actuel `inserer_modeles.html`.

**Files:**
- Create: `formulaires/inserer_modeles_entete.html`
- Test: `tests/integration/EnteteRenduTest.php`

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `tests/integration/EnteteRenduTest.php` :

```php
<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Rendu du mini-squelette d'entête selon l'état.
 */
final class EnteteRenduTest extends TestCase
{
    public function testEtatListeAfficheTitreSansTextarea(): void
    {
        $html = recuperer_fond('formulaires/inserer_modeles_entete', ['formulaire_modele' => '']);
        $this->assertStringContainsString('<h3', $html);
        $this->assertStringNotContainsString('class="code_modele"', $html);
    }

    public function testEtatParametresAfficheTextarea(): void
    {
        $html = recuperer_fond('formulaires/inserer_modeles_entete', [
            'formulaire_modele' => 'media',
            '_nom' => 'Document',
            '_code_modele' => '<doc5|left>',
        ]);
        $this->assertStringContainsString('class="code_modele"', $html);
        $this->assertStringContainsString('&lt;doc5|left&gt;', $html);
    }
}
```

- [ ] **Step 2 : Lancer le test, vérifier l'échec**

Run: `composer tests-integration -- --filter EnteteRenduTest`
Expected: FAIL — squelette introuvable, rendu vide.

- [ ] **Step 3 : Créer le squelette**

Créer `formulaires/inserer_modeles_entete.html` :

```html
[(#ENV{formulaire_modele}|non)<h3 class="titrem">
	<img src="[(#CHEMIN_IMAGE{modele-add-24.svg}|url_absolue)]" class="cadre-icone" />
	<:inserer_modeles:titre_inserer_modeles:>
</h3>]
[(#ENV{formulaire_modele}|oui)<h3 class="titrem">
	[(#ENV{icone_barre}|balise_img|liens_absolus)&nbsp;]<:inserer_modeles:titre_inserer{modele=#ENV{_nom}}:>
</h3>
[<textarea readonly="readonly" class="code_modele" id="code_modele[(#ENV{modalbox}|?{'_modalbox',''})]"[ data-spip_model="(#ENV{_json_editeur})" ][ (#ENV{_code_modele}|et{#ENV{_js_inserer_code}}|oui)ondblclick="#ENV**{_js_inserer_code}"]>(#ENV{_code_modele})</textarea>]
[(#ENV{_code_modele}|et{#ENV{modalbox}|=={oui}}|oui)
	<script type="module">
		var code_modele = $("#code_modele_modalbox").text();
		if (code_modele != '') {
			jQuery.modalboxclose();
		}
	</script>
]
]
```

- [ ] **Step 4 : Lancer le test, vérifier le succès**

Run: `composer tests-integration -- --filter EnteteRenduTest`
Expected: PASS (2 tests)

- [ ] **Step 5 : Commit**

```bash
git add formulaires/inserer_modeles_entete.html tests/integration/EnteteRenduTest.php
git commit -m "$(printf 'feat: mini-squelette d'\''entête (titre + textarea résultat + script modalbox)\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

### Task 4 : La fonction `_saisies()`

Déclare les champs selon l'état, branche les options `ajax`, `squelette_boutons`, `inserer_debut`. Utilise le helper (Task 1) et les deux squelettes (Tasks 2-3).

**Files:**
- Modify: `formulaires/inserer_modeles.php` (ajout de `formulaires_inserer_modeles_saisies_dist`)
- Test: `tests/integration/SaisiesFormulaireTest.php`

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `tests/integration/SaisiesFormulaireTest.php` :

```php
<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Structure des saisies déclarées par formulaires_inserer_modeles_saisies_dist().
 */
final class SaisiesFormulaireTest extends TestCase
{
    public static function setUpBeforeClass(): void
    {
        include_spip('formulaires/inserer_modeles');
    }

    private function reset(): void
    {
        foreach (['annuler', 'formulaire_modele', '_code_modele', '_json_editeur', '_js_inserer_code'] as $k) {
            set_request($k, null);
        }
    }

    protected function setUp(): void { $this->reset(); }
    protected function tearDown(): void { $this->reset(); }

    public function testOptionsCommunes(): void
    {
        $saisies = formulaires_inserer_modeles_saisies_dist('', '', serialize([]));
        $this->assertTrue($saisies['options']['ajax']);
        $this->assertSame('formulaires/inserer_modeles_boutons', $saisies['options']['squelette_boutons']);
    }

    public function testEtatListeContientLaSaisieRadio(): void
    {
        $saisies = formulaires_inserer_modeles_saisies_dist('', '', serialize([]));
        // 1er élément non-'options' = la saisie radio de la liste des modèles
        $this->assertSame('radio', $saisies[0]['saisie']);
        $this->assertSame('formulaire_modele', $saisies[0]['options']['nom']);
    }

    public function testEtatParametresContientHiddenEtParametres(): void
    {
        $saisies = formulaires_inserer_modeles_saisies_dist('media', '', serialize([]));
        // 1er champ = hidden formulaire_modele
        $this->assertSame('hidden', $saisies[0]['saisie']);
        $this->assertSame('formulaire_modele', $saisies[0]['options']['nom']);
        $this->assertSame('media', $saisies[0]['options']['defaut']);
        // les paramètres du yaml suivent : on retrouve le champ 'modele' (defaut 'doc')
        $noms = [];
        foreach ($saisies as $cle => $saisie) {
            if ($cle === 'options' || !isset($saisie['options']['nom'])) {
                continue;
            }
            $noms[] = $saisie['options']['nom'];
        }
        $this->assertContains('id_modele', $noms);
        $this->assertContains('align', $noms);
    }

    public function testEtatParametresRenseigneInsererDebut(): void
    {
        $saisies = formulaires_inserer_modeles_saisies_dist('media', '', serialize([]));
        $this->assertStringContainsString('class="code_modele"', $saisies['options']['inserer_debut']);
    }
}
```

- [ ] **Step 2 : Lancer le test, vérifier l'échec**

Run: `composer tests-integration -- --filter SaisiesFormulaireTest`
Expected: FAIL — `Call to undefined function formulaires_inserer_modeles_saisies_dist()`

- [ ] **Step 3 : Implémenter `_saisies()`**

Dans `formulaires/inserer_modeles.php`, ajouter cette fonction (après le helper de la Task 1) :

```php
function formulaires_inserer_modeles_saisies_dist($formulaire_modele, $modalbox, $env) {
	include_spip('inc/inserer_modeles');
	$formulaire_modele = inserer_modeles_etat_formulaire_modele($formulaire_modele, $env);

	$options = [
		'ajax' => true,
		'squelette_boutons' => 'formulaires/inserer_modeles_boutons',
	];

	$ctx_entete = [
		'formulaire_modele' => $formulaire_modele,
		'modalbox' => ($modalbox != '' ? 'oui' : ''),
		'_code_modele' => _request('_code_modele'),
		'_json_editeur' => _request('_json_editeur'),
		'_js_inserer_code' => _request('_js_inserer_code'),
	];

	// État (a) : choix du modèle
	if ($formulaire_modele === '') {
		$options['inserer_debut'] = recuperer_fond('formulaires/inserer_modeles_entete', $ctx_entete);
		$modeles_dispo = inserer_modeles_lister_formulaires_modeles(true);
		$saisie_liste = inserer_modeles_generer_saisie_formulaire_modele($modeles_dispo, boolval($modalbox));
		return [
			'options' => $options,
			$saisie_liste,
		];
	}

	// État (b) : paramètres du modèle choisi
	$infos_modele = charger_infos_formulaire_modele($formulaire_modele);
	$ctx_entete['_nom'] = _T_ou_typo($infos_modele['nom']);
	if (isset($infos_modele['icone_barre'])) {
		$ctx_entete['icone_barre'] = inserer_modeles_find_icone_barre_path($infos_modele['icone_barre']);
	}
	$options['inserer_debut'] = recuperer_fond('formulaires/inserer_modeles_entete', $ctx_entete);

	$saisies = [
		'options' => $options,
		[
			'saisie' => 'hidden',
			'options' => ['nom' => 'formulaire_modele', 'defaut' => $formulaire_modele],
		],
	];
	foreach ($infos_modele['parametres'] as $parametre) {
		$saisies[] = $parametre;
	}
	return $saisies;
}
```

- [ ] **Step 4 : Lancer le test, vérifier le succès**

Run: `composer tests-integration -- --filter SaisiesFormulaireTest`
Expected: PASS (4 tests)

- [ ] **Step 5 : Commit**

```bash
git add formulaires/inserer_modeles.php tests/integration/SaisiesFormulaireTest.php
git commit -m "$(printf 'feat: déclaration des saisies du formulaire inserer_modeles (Méthode 1)\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

### Task 5 : Alléger `charger()` et vider le HTML

`charger()` utilise désormais le helper d'état et ne produit plus les clés `_saisies`/`_liste_formulaires_modeles` (le rendu vient du scaffolding). Le fichier HTML est vidé pour activer la Méthode 1.

**Files:**
- Modify: `formulaires/inserer_modeles.php` (`formulaires_inserer_modeles_charger_dist`)
- Modify: `formulaires/inserer_modeles.html` (vidé)
- Test: `tests/integration/ChargerEtatTest.php`

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `tests/integration/ChargerEtatTest.php` :

```php
<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Contexte produit par charger() après refonte.
 */
final class ChargerEtatTest extends TestCase
{
    public static function setUpBeforeClass(): void
    {
        include_spip('formulaires/inserer_modeles');
    }

    private function reset(): void
    {
        foreach (['annuler', 'formulaire_modele'] as $k) {
            set_request($k, null);
        }
    }

    protected function setUp(): void { $this->reset(); }
    protected function tearDown(): void { $this->reset(); }

    public function testEtatParametres(): void
    {
        $ctx = formulaires_inserer_modeles_charger_dist('media', '', serialize([]));
        $this->assertSame('media', $ctx['formulaire_modele']);
        $this->assertNotEmpty($ctx['_nom']);
        // modèle imposé en argument => bouton annuler masqué
        $this->assertSame('on', $ctx['ne_pas_afficher_bouton_annuler']);
    }

    public function testEtatListeNeFixePasDeModele(): void
    {
        $ctx = formulaires_inserer_modeles_charger_dist('', '', serialize([]));
        $this->assertArrayNotHasKey('formulaire_modele', $ctx);
    }

    public function testModalboxNormalise(): void
    {
        $ctx = formulaires_inserer_modeles_charger_dist('media', 'oui', serialize([]));
        $this->assertSame('oui', $ctx['modalbox']);
    }
}
```

- [ ] **Step 2 : Lancer le test, vérifier l'échec**

Run: `composer tests-integration -- --filter ChargerEtatTest`
Expected: FAIL — l'ancien `charger()` met `ne_pas_afficher_bouton_annuler` mais ne range pas l'état via le helper ; le cas `testEtatListeNeFixePasDeModele` échoue car l'ancien `charger` ne pose pas non plus `formulaire_modele`… **vérifier précisément quel(s) cas échoue(nt)** avant de corriger. (Au minimum, le test sert de filet pour la réécriture.)

- [ ] **Step 3 : Réécrire `charger()`**

Remplacer entièrement le corps de `formulaires_inserer_modeles_charger_dist` par :

```php
function formulaires_inserer_modeles_charger_dist($formulaire_modele, $modalbox, $env) {
	include_spip('inc/inserer_modeles');
	$formulaire_modele_arg = $formulaire_modele;
	$env_array = unserialize($env);
	$contexte = [];

	// Toujours transmettre les id_(article/rubrique/breve...) et les garder en _request
	foreach ($env_array as $var => $val) {
		if (substr($var, 0, 3) == 'id_' && is_numeric($val)) {
			$contexte[$var] = $val;
			set_request($var, $val);
		}
	}

	$formulaire_modele = inserer_modeles_etat_formulaire_modele($formulaire_modele, $env_array);

	// État (b) : un modèle est choisi
	if ($formulaire_modele !== '') {
		if ($formulaire_modele_arg != '') {
			$contexte['ne_pas_afficher_bouton_annuler'] = 'on';
		}
		$infos_modele = charger_infos_formulaire_modele($formulaire_modele);
		include_spip('inc/saisies');
		$champs_saisies = saisies_charger_champs($infos_modele['parametres']);
		// Valeurs éventuellement passées par l'url
		foreach ($champs_saisies as $champ => $val) {
			if ($valeur = _request($champ)) {
				$champs_saisies[$champ] = $valeur;
			}
			// Cas particulier "align" dont seule la valeur est transmise
			foreach (['left', 'center', 'right'] as $align) {
				if (isset($env_array[$align])) {
					$champs_saisies['align'] = $align;
				}
			}
		}
		$contexte = array_merge($contexte, $champs_saisies);
		$contexte['formulaire_modele'] = $formulaire_modele;
		$contexte['_nom'] = _T_ou_typo($infos_modele['nom']);
		if (isset($infos_modele['icone_barre'])) {
			$contexte['icone_barre'] = inserer_modeles_find_icone_barre_path($infos_modele['icone_barre']);
		}
		// Réinjection de différentes choses "postées"
		foreach (['_code_modele', '_json_editeur', '_js_inserer_code', '_markItUpfocused'] as $request) {
			if ($valeur = _request($request)) {
				$contexte[$request] = $valeur;
			}
		}
	}

	if ($modalbox != '') {
		$contexte['modalbox'] = 'oui';
	}

	return $contexte;
}
```

- [ ] **Step 4 : Vider le fichier HTML**

Écrire `formulaires/inserer_modeles.html` avec un contenu **vide** (le fichier doit exister mais ne rien contenir) :

```bash
: > formulaires/inserer_modeles.html
```

- [ ] **Step 5 : Lancer les tests concernés + le garde-fou `traiter`**

Run: `composer tests-integration -- --filter 'ChargerEtatTest|CvtTraiterTest'`
Expected: PASS (ChargerEtatTest 3 tests + CvtTraiterTest 3 tests) — `traiter()` n'a pas changé, son comportement reste identique.

- [ ] **Step 6 : Commit**

```bash
git add formulaires/inserer_modeles.php formulaires/inserer_modeles.html tests/integration/ChargerEtatTest.php
git commit -m "$(printf 'refactor: charger() via helper d'\''état et passage au HTML vide (scaffolding Saisies)\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

### Task 6 : Vérification complète

**Files:** aucun (validation).

- [ ] **Step 1 : Suite complète verte**

Run: `composer tests-unit && composer tests-integration`
Expected: toutes les suites PASS (unitaires inchangés ; intégration = anciens + EtatModele, BoutonsRendu, EnteteRendu, SaisiesFormulaire, ChargerEtat).

- [ ] **Step 2 : Vérification manuelle dans le privé**

Lancer un SPIP avec le plugin actif, ouvrir l'éditeur Markdown dans l'espace privé et le bouton « Insérer un modèle ». Vérifier :
1. État (a) : la liste des modèles s'affiche, le bouton **Choisir** fonctionne.
2. État (b) : les paramètres du modèle s'affichent (titre + icône en entête), les boutons **Annuler** et **Insérer** fonctionnent.
3. La `<textarea>` montre le code généré ; le double-clic insère le modèle.
4. En modalbox : la fenêtre se ferme après insertion.
5. Le rendu ajax fonctionne (pas de rechargement complet).

- [ ] **Step 3 : Nettoyer les anciens artefacts si présents**

Vérifier qu'aucune référence aux clés de contexte supprimées (`_saisies`, `_liste_formulaires_modeles`) ne subsiste hors des squelettes Saisies :
```bash
grep -rn "_liste_formulaires_modeles\|'_saisies'" formulaires/ prive/
```
Expected: plus aucune occurrence dans `formulaires/inserer_modeles.*` ni `prive/squelettes/contenu/inserer_modeles.html`.

- [ ] **Step 4 : Commit final éventuel** (si le grep a révélé un nettoyage)

```bash
git add -A
git commit -m "$(printf 'chore: nettoyage des références obsolètes au rendu par squelette\n\nCo-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>')"
```

---

## Self-Review (effectuée à la rédaction)

- **Couverture du spec :** helper d'état (sync charger/saisies) ✓ ; `_saisies()` deux états ✓ ; `squelette_boutons` ✓ ; `inserer_debut` via `recuperer_fond` ✓ ; HTML vidé ✓ ; `verifier`/`traiter` intacts (non touchés) ✓ ; nouveau test `_saisies()` ✓ ; garde-fou `CvtTraiterTest` ✓.
- **Écart assumé vs spec :** `inserer_debut` construit dans `_saisies()` (pas `charger`), et `inserer_fin` non utilisé (script modalbox intégré à l'entête). Cela résout proprement le Risque n°1 du spec (fusion options↔contexte) — documenté en tête de plan.
- **Cohérence des noms :** `inserer_modeles_etat_formulaire_modele` (Task 1) réutilisé en Tasks 4 et 5 ; `formulaires/inserer_modeles_boutons` et `formulaires/inserer_modeles_entete` référencés de façon identique en squelette et en `recuperer_fond`.
- **Risque résiduel :** le vidage du HTML (Task 5) et le rendu ajax/modalbox ne sont pas couverts par des tests automatiques → vérification manuelle explicite (Task 6, Step 2).
