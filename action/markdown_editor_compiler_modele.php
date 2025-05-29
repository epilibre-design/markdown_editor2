<?php

/**
 * Action générant la prévisu d'un modèle
 *
 * Pas besoin de sécuriser outre mesure ici, on ne réalise donc qu'un
 * recuperer_fond
 *
 * On passe par cette action pour éviter les redirection et la perte du $_POST de
 * $forcer_lang=true;
 * cf : ecrire/public.php ligne 80
 */
function action_markdown_editor_compiler_modele_dist() {
	include_spip('markdown_editor_fonctions');
	$contexte = [];

	// il faut avoir le droit de previsualiser
	// (par defaut le droit d'aller dans ecrire/ ou être admin si on est dans le public)
	if (autoriser('previsualiser', 'markdowneditormodele')) {
		// $_POST a ete sanitise par SPIP
		// et le fond injecte des interdire_scripts pour empecher les injections PHP
		// le js est bloque ou non selon les reglages de SPIP et si on est ou non dans l'espace prive
		$contexte = $_POST;
	}

	// pas d'indirection PHP dans les modeles formulaire
	$GLOBALS['_FORCER_EXECUTER_DIRECTEMENT_BALISE_DYNAMIQUE'] = true;
	// Fake appel car bug au premier appel de propre() qui n'interprête pas les modèles
	markdown_editor_traitements_previsu($contexte['modele'], $contexte['champ'] ?? '', $contexte['objet'] ?? '');
	// Deuxième appel qui marche
	echo markdown_editor_traitements_previsu($contexte['modele'], $contexte['champ'] ?? '', $contexte['objet'] ?? '');
	// retablir le fonctionnement par défaut pour les éventuels crons qui vont tourner après
	unset($GLOBALS['_FORCER_EXECUTER_DIRECTEMENT_BALISE_DYNAMIQUE']);
}
