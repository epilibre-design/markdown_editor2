<?php

/**
 * Filtre appliquant les traitements SPIP d'un champ
 *
 * Applique les filtres prévus sur un champ (et eventuellement un type d'objet)
 * sur un texte donné. Sécurise aussi le texte en appliquant safehtml().
 *
 * Ce mécanisme est à préférer au traditionnel #TEXTE*|propre
 *
 * traitements_previsu() consulte la globale $table_des_traitements et
 * applique le traitement adequat. Si aucun traitement n'est trouvé,
 * alors propre() est appliqué.
 *
 * @package SPIP\PortePlume\Fonctions
 * @see champs_traitements() dans public/references.php
 * @global table_des_traitements
 *
 * @param string $texte
 *     Texte source
 * @param string $nom_champ
 *     Nom du champ (nom de la balise, en majuscules)
 * @param string $type_objet
 *     L'objet a qui appartient le champ (en minuscules)
 * @param string $connect
 *     Nom du connecteur de base de données
 * @return string
 *     Texte traité avec les filtres déclarés pour le champ.
 */
function markdown_editor_traitements_previsu($texte, $nom_champ = '', $type_objet = '', $connect = null) {
	include_spip('public/interfaces'); // charger les traitements
	include_spip('inc/texte');

	global $table_des_traitements;
	if (!strlen($nom_champ) || !isset($table_des_traitements[$nom_champ])) {
		$texte = propre($texte, $connect);
	} else {
		include_spip('base/abstract_sql');
		$table = table_objet($type_objet);
		$ps = $table_des_traitements[$nom_champ];
		if (is_array($ps)) {
			$ps = $ps[(strlen($table) && isset($ps[$table])) ? $table : 0];
		}
		if (!$ps) {
			$texte = propre($texte, $connect);
		} else {
			// [FIXME] Éviter une notice sur le eval suivant qui ne connait
			// pas la Pile ici. C'est pas tres joli...
			$Pile = [0 => []];
			// remplacer le placeholder %s par le texte fourni
			eval('$texte=' . str_replace('%s', '$texte', $ps) . ';');
		}
	}

	// si il y a du PHP issu de modeles, il faut l'eval ici, car on aura pas de eval final contrairement aux pages SPIP
	if (defined('_PROTEGE_PHP_MODELES')
	  && autoriser('previsualiser','modelesphp')) {
		$texte = echappe_retour($texte, 'php' . _PROTEGE_PHP_MODELES, 'markdown_editor_traitements_previsu_php_modeles_eval');
	}

	// il faut toujours securiser le texte prévisualisé car il peut contenir n'importe quoi
	// et servir de support a une attaque xss ou vol de cookie admin
	// on ne peut donc se fier au statut de l'auteur connecté car le contenu ne vient pas
	// forcément de lui
	return safehtml($texte);
}


/**
 * Evaluer le PHP des modèles dans la previsu
 * @param $php
 * @return false|string
 */
function markdown_editor_traitements_previsu_php_modeles_eval($php) {
	ob_start();
	try {
		$res = eval('?' . '>' . $php);
		$texte = ob_get_contents();
	} catch (\Throwable $e) {
		$texte = '<!-- Erreur -->';
	}
	ob_end_clean();
	return $texte;
}
