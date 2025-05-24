<?php

include_spip('inc/saisies');
/**
 * Lister les formulaires de modeles disponibles dans les dossiers modeles/
 * les trie par ordre alphabétique de nom
 *
 * Par défaut retourne les modèles ignorés dans la config,
 * on peut optionnellement les exclure.
 *
 * @staticvar array $liste_formulaires_modeles
 * @param bool $exclure_ignores
 *    pour exclure les modèles ignorés dans la config
 * @return array
 */
function inserer_modeles_lister_formulaires_modeles(bool $exclure_ignores = false): array {
	static $listes_memoire;
	$hash = ($exclure_ignores ? 1 : 0);
	if (isset($listes_memoire[$hash])) {
		return $listes_memoire[$hash] ?: [];
	}

	$liste_formulaires_modeles = [];
	$match = '[^-]*[.]yaml$';
	$liste = find_all_in_path('modeles/', $match);

	if (count($liste)) {
		include_spip('inc/yaml');
		foreach ($liste as $formulaire => $chemin) {
			$formulaire = str_replace('.yaml', '', $formulaire);//
			$yaml_data = yaml_charger_inclusions(yaml_decode_file($chemin));
			if (is_array($yaml_data)) {
				$nom = ucfirst(_T_ou_typo($yaml_data['nom']));
				$liste_formulaires_modeles[$formulaire] = [
					'nom' => $nom,
					'titre' => $nom, // Pour pouvoir trier comme on tri les saisies, on map titre sur nom
					'categorie' => $yaml_data['categorie'] ?? ['type' => 'defaut', 'rang' => -1000],
					'icone_barre' => isset($yaml_data['icone_barre']) ? inserer_modeles_find_icone_barre_path($yaml_data['icone_barre']) : ''
				];
			}
		}
	}


	// Puis les trier par ordre alphabétique
	include_spip('inc/charsets');
	uasort($liste_formulaires_modeles, function ($valeur1, $valeur2) {
		$nom1 = translitteration($valeur1['nom']);#On translittere en attendant d'avoir de base la classe SPIP COLLATE dans SPIP, afin de neutraliser les accents
		$nom2 = translitteration($valeur2['nom']);
		if ($nom1 > $nom2) {
			return 1;
		} elseif ($nom1 === $nom2) {
			return 0;
		} else {
			return -1;
		}
	});

	$liste_formulaires_modeles = pipeline('inserer_modeles_lister_formulaires_modeles', $liste_formulaires_modeles);

	// Retirer les modèles désactivés dans la config
	if ($exclure_ignores === true) {
		include_spip('inc/config');
		$config_ignorer = lire_config('inserer_modeles/ignorer_modeles') ?? [];
		foreach ($config_ignorer as $ignorer) {
			unset($liste_formulaires_modeles[$ignorer]);
		}
	}
	$listes_memoire[$hash] = $liste_formulaires_modeles;

	return $liste_formulaires_modeles;
}

/**
 * Charger les informations d'un formulaire de modele
 *
 * @staticvar array $infos_formulaires_modeles
 * @return array
 */
function charger_infos_formulaire_modele($formulaire) {
	static $infos_formulaires_modeles = [];

	if (!isset($infos_formulaires_modeles[$formulaire])) {
		if (substr($formulaire, -5) != '.yaml') {
			$formulaire .= '.yaml';
		}
		if ($chemin = find_in_path($formulaire, 'modeles/')) {
			include_spip('inc/yaml');
			$infos_formulaires_modeles[$formulaire] = yaml_charger_inclusions(yaml_decode_file($chemin));
			$infos_formulaires_modeles[$formulaire]['parametres'] = inserer_modeles_definir_defaut($infos_formulaires_modeles[$formulaire]['parametres']);
		}
	}
	return $infos_formulaires_modeles[$formulaire];
}

/**
 * Lis une description tabulaire des saisies de description d'un modeles
 * Cherche les paramètres defaut
 * si présent, regarde si appelle à une fonction
 * et l'appliquer au options de base
 * et cela recursivement aux sous saisies
 * @param array $saisies
 * @return array()
*/
function inserer_modeles_definir_defaut($saisies) {
	foreach ($saisies as &$saisie) {
		if (!is_array($saisie)) {
			return $tableau;
		}
		$options = &$saisie['options'];
		if (isset($options['defaut']) and strpos($options['defaut'], 'fonction:') === 0) {
			$defaut = &$options['defaut'];
			$eval = '$defaut = ' . str_replace('fonction:', '', $defaut) . ';';
			eval($eval);
		}

		if (isset($saisie['saisies'])) {
			$saisie['saisies'] = inserer_modeles_definir_defaut($saisie['saisies']);
		}
	}
	return $saisies;
}

/**
 * Retrouver l'icone :
 * - d'abord dans icones_barre
 * - sinon dans le thème / images (et du coup on peut jouer avec png/svg)
 * - à défaut dans find_in_path
 * S'assure que l'icone ne fait pas plus de 16 px, pour tenir dans la barre du porte plume.
 * @param string $nom
 * @return string chemin
**/
function inserer_modeles_find_icone_barre_path($nom) {
	if (!$chemin = find_in_path("icones_barre/$nom")) {
	 if (!$chemin = find_in_theme("images/$nom")) {
		 if (!$chemin = find_in_path($nom)) {
			 return '';
		 }
	 }
	}
	include_spip('inc/filtres');
	include_spip('inc/filtres_images_mini');
	$chemin = preg_replace('#\?.*$#', '', $chemin);//Au cas où find_in_theme nous return un truc genre gis-xx.svg?16px
	return extraire_attribut(image_reduire($chemin, 16), 'src');//On force la reduction à 16px, pour le porteplume
}


/**
 * Regrouper les modèles par catégories
 * @param array $modeles
 * @return array modeles par catégories
**/
function inserer_modeles_regrouper_par_categorie(array $modeles): array {
	uksort($modeles, function ($a, $b) use ($modeles) {
		return saisies_lister_disponibles_par_categories_usort($modeles[$a], $modeles[$b]);
	});
	$categories = inserer_modeles_lister_categories();
	foreach ($modeles as $modele => $desc) {
		$categorie = $desc['categorie']['type'];
		$categorie_nom = $categories[$categorie]['nom'];
		if (!isset($data[$categorie_nom])) {
			$data[$categorie_nom] = [];
		}
		$data[$categorie_nom][$modele] = $desc;
	}

	// Remettre les catégories dans le bon ordre
	$data_bis = $data;
	$data = [];
	foreach ($categories as $cate) {
		if (isset($data_bis[$cate['nom']])) {
			$data[$cate['nom']] = $data_bis[$cate['nom']];
		}
	}

	return $data;
}


/**
 * Lister les catégories par défaut, puis les envoyer au pipeline
 * @return array liste des catégories
 **/
function inserer_modeles_lister_categories(): array {
	$categories = pipeline(
		'inserer_modeles_lister_categories',
		[
			'medias' => [
				'nom' => _T('inserer_modeles:categorie_medias_label'),
			],
			'defaut' => [
				'nom' =>  _T('inserer_modeles:categorie_defaut_label'),
			]
		]
	);

	// S'assurer que defaut soit tout le temps à la fin
	$defaut = $categories['defaut'];
	unset($categories['defaut']);
	$categories['defaut'] = $defaut;

	return $categories;
}
