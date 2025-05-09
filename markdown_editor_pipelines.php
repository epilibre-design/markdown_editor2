<?php

if (!defined('_ECRIRE_INC_VERSION')) {
	return;
}

function markdown_editor_header_prive($flux) {
	$toolbars = pipeline('markdown_editor_toolbars', ['args' => [], 'data' => []]);
	$toolbars = json_encode($toolbars);
	$flux .= '<script type="module">
	window.spipConfig = window.spipConfig || {};
	window.spipConfig.markdown_editor = {
		toolbars: ' . $toolbars . '
	};
	</script>';
	
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
						'component' => 'HeadingDropdownMenu',
						'levels' => [2, 3, 4, 5, 6],
						'labelBase' => 'Titre',
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
						'component' => 'ListButton',
						'type' => 'bulletList',
						'label' => 'Liste à puce',
						//~ 'title' => 'Transformer en liste',
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
				],
			],
			[
				'component' => 'Spacer',
			],
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
