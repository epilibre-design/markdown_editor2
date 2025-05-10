
export function isEditorVisible(editor) {
	const style = window.getComputedStyle(editor.options.element || editor.view.dom);
	if (style.display == 'none') return false;
	
	return true;
}
