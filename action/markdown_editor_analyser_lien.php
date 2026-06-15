<?php

/**
 * Action résolvant le titre et l'URL d'un lien (interne ou externe).
 *
 * On passe par cette action pour éviter les redirections et la perte du $_POST
 * ($forcer_lang=true ; cf ecrire/public.php ligne 80).
 * Le résultat est mis en cache fichier (1 h) pour éviter des requêtes SQL
 * répétées sur les raccourcis SPIP internes (art5, rub3…).
 */
function action_markdown_editor_analyser_lien_dist() {
	$url = (string) _request('url');

	if (!$url || strlen($url) > 512) {
		echo json_encode(['titre' => $url, 'url' => $url]);
		return;
	}

	$hash      = substr(md5($url), 0, 16);
	$cache_dir = sous_repertoire(_DIR_CACHE, 'markdown_editor');
	$cache_file = $cache_dir . 'analyser_lien_' . $hash;

	if (file_exists($cache_file) && filemtime($cache_file) > time() - 3600) {
		readfile($cache_file);
		return;
	}

	include_spip('inc/lien');

	$retour = ['titre' => $url, 'url' => $url];

	if ($r = calculer_url($url, null, 'tout')) {
		$retour = $r;
	}

	$retour['url'] = html_entity_decode($retour['url']);

	$json = json_encode($retour);
	file_put_contents($cache_file, $json);
	echo $json;
}
