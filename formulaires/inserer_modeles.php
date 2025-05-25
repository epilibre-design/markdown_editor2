<?php

function inserer_modeles_retrouver_formulaire_modele($modele) {
	include_spip('inc/inserer_modeles');
	$formulaire_modele = null;
	
	if ($modele) {
		$formulaires_dispo = inserer_modeles_lister_formulaires_modeles();
		
		foreach ($formulaires_dispo as $formulaire => $description) {
			// On parcourt toutes les saisies
			foreach ($description['parametres'] as $saisie) {
				// Si c'est un paramètre de modèle
				if ($saisie['options']['nom'] == 'modele') {
					// Si la valeur par défaut correspond au modèle demandé on arrête
					// TODO : si plusieurs formulaires savent générer le même modèle, on verra plus tard pour améliorer
					if (($saisie['options']['defaut'] ?? '') == $modele) {
						return $formulaire;
					}
				}
			}
		}
	}
	
	return $formulaire_modele;
}

function formulaires_inserer_modeles_charger_dist($formulaire_modele, $modalbox, $env) {
	include_spip('inc/inserer_modeles');
	$env = unserialize($env);
	$contexte = [];
	
	// Toujours transmettre les id_(article/rubrique/breve...), et les garder en _request pour pouvoir s'en servir après dans l'interprétation du .yaml
	foreach ($env as $var => $val) {
		if (substr($var, 0, 3) == 'id_' && is_numeric($val)) {
			$contexte[$var] = $val;
			set_request($var, $val);
		}
	}
	
	// Si le formulaire est vide mais qu'il y a un modèle passé en paramètre, on tente de retrouver le formulaire
	if (!$formulaire_modele && isset($env['modele'])) {
		$formulaire_modele = inserer_modeles_retrouver_formulaire_modele($env['modele']);
	}
	
	if ((!_request('formulaire_modele') && $formulaire_modele == '') || _request('annuler')) {
		$modeles_dispo = inserer_modeles_lister_formulaires_modeles(true);
		$contexte['_liste_formulaires_modeles'] = [inserer_modeles_generer_saisie_formulaire_modele($modeles_dispo, boolval($modalbox))];
	} else {
		if ($formulaire_modele != '') {
			$contexte['ne_pas_afficher_bouton_annuler'] = 'on';
		}
		if ($formulaire_modele == '') {
			$formulaire_modele = _request('formulaire_modele');
		}
		$infos_modele = charger_infos_formulaire_modele($formulaire_modele);
		include_spip('inc/saisies');
		$champs_saisies = saisies_charger_champs($infos_modele['parametres']);
		// On charge les valeurs éventuellement passées par l'url
		foreach ($champs_saisies as $champ => $val) {
			if ($valeur = _request($champ)) {
				$champs_saisies[$champ] = $valeur;
			}
			
			// Cas particulier pour "align" dont seule la valeur est transmise
			foreach (['left', 'center', 'right'] as $align) {
				if (isset($env[$align])) {
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
		$contexte['_saisies'] = $infos_modele['parametres'];

		// Reinjection de différentes choses "postées"
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

function formulaires_inserer_modeles_verifier_dist($formulaire_modele, $modalbox, $env) {
	$erreurs = [];

	if (_request('choisir') && !_request('formulaire_modele')) {
		$erreurs['message_erreur'] = _T('inserer_modeles:erreur_choix_modele');
	}

	if (_request('inserer')) {
		$env = unserialize($env);
		include_spip('inc/saisies');
		include_spip('inc/inserer_modeles');
		$infos = charger_infos_formulaire_modele(_request('formulaire_modele'));
		$erreurs = saisies_verifier($infos['parametres']);
	}

	return $erreurs;
}

function formulaires_inserer_modeles_traiter_dist($formulaire_modele, $modalbox, $env) {
	if (_request('inserer')) {
		$env = unserialize($env);
		include_spip('inc/saisies');
		include_spip('inc/inserer_modeles');
		$infos = charger_infos_formulaire_modele(_request('formulaire_modele'));
		$champs = saisies_lister_champs($infos['parametres'], false);
		if (isset($infos['traiter'])) {
			$f = charger_fonction($infos['traiter'], 'formulaires', true);
		} else {
			$f = false;
		}
		if ($f) {
			$code = $f($champs);
		} else {
			$code = '<' . _request('modele');
			$has_id = false;
			if (_request('id_modele') && _request('id_modele') != '') {
				$code .= _request('id_modele');
				$has_id = true;
			}
			if (_request('variante') && _request('variante') != '') {
				$code .= '|' . _request('variante');
			}
			if (_request('classe') && _request('classe') != '') {
				$code .= '|' . _request('classe');
			}
			if (_request('align') && _request('align') != '') {
				$code .= '|' . _request('align');
			}
			foreach ($champs as $champ) {
				if ($champ != 'modele' && $champ != 'variante' && $champ != 'classe' && $champ != 'id_modele' && $champ != 'align' && _request($champ) && _request($champ) != '') {
					if ($champ == _request($champ)) {
						$code .= "|$champ";
					} elseif (is_array(_request($champ))) {
						// On transforme les tableaux en une liste
						$code .= "|$champ=" . implode(',', _request($champ));
					} else {
						$code .= "|$champ=" . _request($champ);
					}
				}
			}
			// si aucun numéro ou paramètre, il faut un | pour que le modèle soit pris en compte
			if (!$has_id and strpos($code, '|') === false) {
				$code .= '|';
			}
			$code .= '>';
		}
		set_request('_code_modele', $code);
		set_request('_json_editeur', inserer_modeles_generer_json_editeur($champs));

		// Dans la colonne de gauche, on ne peut pas presupposer du champ dans lequel on veut inserer
		// le modele (chapeau, texte, ps).
		// On ne fait donc pas d'insertion automatique.
		if ($modalbox != '') {
			return ['message_ok' => _T('inserer_modeles:message_code_insere')];
		} else {
			// js pour inserer la balise dans le texte
			$codejs = "barre_inserer('" . texte_script($code) . "', $('textarea[name=texte]')[0]);";
			set_request('_js_inserer_code', $codejs);
			return ['message_ok' => _T('inserer_modeles:message_inserer_code')];
		}
	}
}

/**
 * Génère un tableau descriptif du modèle à fournir à l'éditeur JS
 * 
 * @param array $champs Liste des champs à intégrer
 */
function inserer_modeles_generer_json_editeur($champs) {
	$description = [];
	
	if ($modele = _request('modele')) {
		$description['name'] = $modele;
		$description['id'] = _request('id_modele') ?? null;
		$description['params'] = [];
		
		if ($variante = _request('variante')) {
			$description['params'][$variante] = null;
		}
		if ($classe = _request('classe')) {
			$description['params'][$classe] = null;
		}
		if ($align = _request('align')) {
			$description['params'][$align] = null;
		}
		
		foreach ($champs as $champ) {
			if ($valeur = _request($champ) and !in_array($champ, ['modele', 'id_modele', 'variante', 'classe', 'align'])) {
				if ($champ == $valeur) {
					$description['params'][$champ] = null;
				}
				elseif (is_array($valeur)) {
					$description['params'][$champ] = implode(',', $valeur);
				}
				else {
					$description['params'][$champ] = $valeur;
				}
			}
		}
	}
	
	return json_encode($description);
}

/**
 * Génère une saisie depuis la liste des modèles
 * @param array $modeles liste des modèles deja parsé
 * @param bool $modalbox
 * @return array saisie individuelle
 **/
function inserer_modeles_generer_saisie_formulaire_modele(array $modeles, bool $modalbox): array {
	include_spip('inc/filtres');
	include_spip('inc/saisies');

	$balise_img = charger_filtre('balise_img');


	if (lire_config('inserer_modeles/activer_categories')) {
		$modeles = inserer_modeles_regrouper_par_categorie($modeles);
		foreach ($modeles as $cate => &$modele_de_cate) {
			foreach ($modele_de_cate as $modele => &$desc) {
				$desc = liens_absolus($balise_img($desc['icone_barre'])) . '&nbsp;' . $desc['nom'];
			}
		}
	} else {
		foreach ($modeles as $modele => $desc) {
				$modeles[$modele] = liens_absolus($balise_img($desc['icone_barre'])) . '&nbsp;' .$desc['nom'];
			}
	}

	$saisie = [
		'saisie' => 'radio',
		'options' => [
			'nom' => 'formulaire_modele',
			'data' => $modeles,
			'conteneur_class' => 'pleine_largeur',
		]
	];
	if ($modalbox) {
		$saisie['options']['id'] = 'formulaire_modele_modalbox';
	}
	return $saisie;
}
