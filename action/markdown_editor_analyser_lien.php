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
function action_markdown_editor_analyser_lien_dist() {
	include_spip('inc/lien');
	
	$url = _request('url');
	$retour = ['titre' => $url, 'url' => $url];
	
	if ($r = calculer_url($url, null, 'tout')) {
		$retour = $r;
	}
	
	echo json_encode($retour);
}
