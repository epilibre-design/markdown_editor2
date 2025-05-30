<?php

if (!defined('_ECRIRE_INC_VERSION')) {
	return;
}

function markdown_editor_header_prive($flux) {
	$toolbars = pipeline('markdown_editor_toolbars', ['args' => [], 'data' => []]);
	$toolbars = json_encode($toolbars);
	$url_modeles = generer_url_ecrire('inserer_modeles', 'var_zajax=contenu', true);
	$url_previsu = generer_url_action('markdown_editor_compiler_modele', '', true);
	
	$flux .= "<script type=\"module\">
	window.spipConfig = window.spipConfig || {};
	window.spipConfig.markdown_editor = {
		toolbars: {$toolbars},
		url_modeles: \"{$url_modeles}\",
		url_previsu: \"{$url_previsu}\"
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
						'label' => _T('markdown_editor:outil_undo_label'),
						'iconOnly' => true,
					],
					[
						'component' => 'UndoRedoButton',
						'type' => 'redo',
						'label' => _T('markdown_editor:outil_redo_label'),
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
						'labelBase' => _T('markdown_editor:outil_heading_labelbase'),
						'iconOnly' => true,
					],
					[
						'component' => 'ListDropdownMenu',
						'label' => 'Liste',
						'labels' => [
							'bulletList' => _T('markdown_editor:outil_bulletlist_label'),
							'orderedList' => _T('markdown_editor:outil_orderedlist_label'),
							'taskList' => _T('markdown_editor:outil_tasklist_label'),
							'indent' => _T('markdown_editor:outil_indent_label'),
							'outdent' => _T('markdown_editor:outil_outdent_label'),
						],
						//~ 'title' => 'Transformer en liste',
						'iconOnly' => true,
					],
					[
						'component' => 'NodeButton',
						'type' => 'blockquote',
						'label' => _T('markdown_editor:outil_blockquote_label'),
						//~ 'title' => 'Mettre le bloc en citation',
						'iconOnly' => true,
					],
					[
						'component' => 'NodeButton',
						'type' => 'codeBlock',
						'label' => _T('markdown_editor:outil_codeblock_label'),
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
						'label' => _T('markdown_editor:outil_bold_label'),
						'title' => _T('markdown_editor:outil_bold_title'),
						'iconOnly' => true,
					],
					[
						'component' => 'MarkButton',
						'type' => 'italic',
						'label' => _T('markdown_editor:outil_italic_label'),
						'title' => _T('markdown_editor:outil_italic_title'),
						'iconOnly' => true,
					],
					[
						'component' => 'MarkButton',
						'type' => 'strike',
						'label' => _T('markdown_editor:outil_strike_label'),
						'title' => _T('markdown_editor:outil_strike_title'),
						'iconOnly' => true,
					],
					[
						'component' => 'MarkButton',
						'type' => 'code',
						'label' => _T('markdown_editor:outil_code_label'),
						'title' => _T('markdown_editor:outil_code_title'),
						'iconOnly' => true,
					],
					[
						'component' => 'LinkPopover',
						//~ 'autoOpenOnLink' => true,
						'label' => 'Lien',
						'labels' => [
							'url' => 'URL',
							'title' => _T('markdown_editor:outil_link_title_label'),
							'apply' => _T('markdown_editor:outil_link_apply_label'),
							'open' => _T('markdown_editor:outil_link_open_label'),
							'remove' => _T('markdown_editor:outil_link_remove_label'),
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
						'label' => _T('markdown_editor:outil_modeles_label'),
						'title' => _T('markdown_editor:outil_modeles_title'),
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
						'labelWysiwyg' => _T('markdown_editor:outil_editormode_wysiwyg_label'),
						'labelMarkdown' => _T('markdown_editor:outil_editormode_markdown_label'),
					],
					[
						'component' => 'Separator',
					],
					[
						'component' => 'FullscreenToggleButton',
						'enterLabel' => _T('markdown_editor:outil_fullscreen_enter_label'),
						'exitLabel' => _T('markdown_editor:outil_fullscreen_exit_label'),
					],
				],
			],
		],
		'forum' => [
			
		],
	];
	
	return $flux;
}

function markdown_editor_autoriser($flux) {
	return $flux;
}

function autoriser_markdowneditormodele_previsualiser_dist($faire, $type, $id, $qui, $options) {
	if (test_espace_prive()) {
		return autoriser('ecrire');
	} else {
		// dans le public on autorise pour les admins uniquement par défaut
		// a personaliser si besoin
		return ($qui['statut'] === '0minirezo' && !$qui['restreint']);
	}
}
