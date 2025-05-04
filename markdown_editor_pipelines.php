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
	
	return $flux;
}

// Listes prédéfinies de boutons d'interface
function markdown_editor_toolbars($flux) {
	$flux = [
		'edition' => [
			[
				'component' => 'ButtonsGroup',
				'cssClass' => 'groupe-btns_marks',
				'children' => [
					[
						'component' => 'MarkButton',
						'type' => 'bold',
						'label' => 'Gras',
						'title' => 'Mettre en gras / Ctrl-B',
						'iconHTML' => 'G',
					],
					[
						'component' => 'MarkButton',
						'type' => 'italic',
						'label' => 'Italique',
						'title' => 'Mettre en italique / Ctrl-I',
						'iconHTML' => 'I',
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
