<?php

if (!defined('_ECRIRE_INC_VERSION')) {
	return;
}

function markdown_editor_header_prive($flux) {
	$flux .= '<script type="module" src="'.find_in_path('javascript/markdown_editor.dist.js').'"></script>';
	
	return $flux;
}
