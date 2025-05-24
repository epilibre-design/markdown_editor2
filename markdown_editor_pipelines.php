<?php

if (!defined('_ECRIRE_INC_VERSION')) {
	return;
}

function markdown_editor_header_prive($flux) {
	$toolbars = pipeline('markdown_editor_toolbars', ['args' => [], 'data' => []]);
	$toolbars = json_encode($toolbars);
	$url_modeles = generer_url_ecrire('inserer_modeles', 'var_zajax=contenu', true);
	
	$flux .= "<script type=\"module\">
	window.spipConfig = window.spipConfig || {};
	window.spipConfig.markdown_editor = {
		toolbars: {$toolbars},
		url_modeles: \"{$url_modeles}\"
	};
	</script>";
	
	$flux .= '<script type="module" src="'.find_in_path('javascript/markdown_editor.dist.js').'"></script>';
	$flux .= '<link rel="stylesheet" href="'.find_in_path('fonts/md-editor_icons.css').'" type="text/css"/>';
	
	return $flux;
}

// Listes prédéfinies de boutons d'interface
function markdown_editor_toolbars($flux) {
	$flux = [
		'edition' => [
			[
				'component' => 'ButtonsGroup',
				'cssClass' => 'groupe-btns_nodes',
				'children' => [
					[
						'component' => 'UndoRedoButton',
						'type' => 'undo',
						'label' => 'Annuler',
						'iconOnly' => true,
					],
					[
						'component' => 'UndoRedoButton',
						'type' => 'redo',
						'label' => 'Rétablir',
						'iconOnly' => true,
					],
				],
			],
			[
				'component' => 'Separator',
			],
			// Groupe des modifications de blocs (nodes)
			[
				'component' => 'ButtonsGroup',
				'cssClass' => 'groupe-btns_nodes',
				'children' => [
					[
						'component' => 'HeadingDropdownMenu',
						'levels' => [2, 3, 4, 5, 6],
						'labelBase' => 'Titre',
						'iconOnly' => true,
					],
					[
						'component' => 'ListDropdownMenu',
						'label' => 'Liste',
						'labels' => [
							'bulletList' => 'Liste à puce',
							'orderedList' => 'Liste numérotée',
							'taskList' => 'Liste de tâches',
							'indent' => 'Indenter',
							'outdent' => 'Désindenter',
						],
						//~ 'title' => 'Transformer en liste',
						'iconOnly' => true,
					],
					[
						'component' => 'NodeButton',
						'type' => 'blockquote',
						'label' => 'Bloc de citation',
						//~ 'title' => 'Mettre le bloc en citation',
						'iconOnly' => true,
					],
					[
						'component' => 'NodeButton',
						'type' => 'codeBlock',
						'label' => 'Bloc de code',
						//~ 'title' => 'Transformer en bloc de code',
						'iconOnly' => true,
					],
				],
			],
			[
				'component' => 'Separator',
			],
			// Groupe des modifictateurs inlines (marks)
			[
				'component' => 'ButtonsGroup',
				'cssClass' => 'groupe-btns_marks',
				'children' => [
					[
						'component' => 'MarkButton',
						'type' => 'bold',
						'label' => 'Gras',
						'title' => 'Mettre en gras / Ctrl-B',
						'iconOnly' => true,
					],
					[
						'component' => 'MarkButton',
						'type' => 'italic',
						'label' => 'Italique',
						'title' => 'Mettre en italique / Ctrl-I',
						'iconOnly' => true,
					],
					[
						'component' => 'MarkButton',
						'type' => 'strike',
						'label' => 'Barré',
						'title' => 'Barrer le texte',
						'iconOnly' => true,
					],
					[
						'component' => 'MarkButton',
						'type' => 'code',
						'label' => 'Code',
						'title' => 'Code en ligne',
						'iconOnly' => true,
					],
					[
						'component' => 'LinkPopover',
						//~ 'autoOpenOnLink' => true,
						'label' => 'Lien',
						'labels' => [
							'url' => 'URL',
							'title' => 'Titre du lien',
							'apply' => 'Valider le lien',
							'open' => 'Ouvrir dans une nouvelle fenêtre',
							'remove' => 'Retirer le lien',
						],
						'iconOnly' => true,
					],
				],
			],
			[
				'component' => 'Separator',
			],
			// Groupe des éléments propres à SPIP
			[
				'component' => 'ButtonsGroup',
				'cssClass' => 'groupe-btns_spip',
				'children' => [
					[
						'component' => 'SpipModelButton',
						'label' => 'Modèles',
						'title' => 'Chercher et insérer un modèle',
					],
				],
			],
			// On décale sur la droite
			[
				'component' => 'Spacer',
			],
			// Le mode d'édition
			[
				'component' => 'ButtonsGroup',
				'cssClass' => 'groupe-btns_marks',
				'children' => [
					[
						'component' => 'EditorModeButton',
						'labelWysiwyg' => 'Édition visuelle',
						'labelMarkdown' => 'Édition en texte brut',
					],
				],
			],
		],
		'forum' => [
			
		],
	];
	
	return $flux;
}
