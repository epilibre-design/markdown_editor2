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
