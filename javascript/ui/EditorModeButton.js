/**
 * Bouton pour switcher entre wysiwyg et texte brut
 * 
 * @param {Editor} editor
 * @param {object} options
 *   - editorWrapper: HTMLElement contenant .md-editor
 *   - container: HTMLElement parent pour le bouton (ex. toolbar)
 *   - iconWysiwyg?: string
 *   - iconMarkdown?: string
 */
export class EditorModeButton {
	constructor(editor, {
		container,
		iconWysiwyg = '🖋',
		labelWysiwyg = 'Édition visuelle',
		iconMarkdown = '</>',
		labelMarkdown = 'Édition en texte brut',
	}) {
		this.editor = editor;
		this.editor_wysiwyg = editor.options.element || editor.view.dom
		this.editor_wrapper = this.editor_wysiwyg.parentElement;
		this.textarea = this.editor_wrapper.querySelector('textarea');
		this.mode = 'markdown'; // mode inverse par défaut car toggle au démarrage

		// création du bouton
		this.btn = document.createElement('button');
		this.btn.type = 'button';
		this.btn.className = 'btn_link btn_editor_mode';

		this.iconWysiwyg = iconWysiwyg;
		this.labelWysiwyg = labelWysiwyg;
		this.iconMarkdown = iconMarkdown;
		this.labelMarkdown = labelMarkdown;

		this.btn.addEventListener('click', () => this.toggleMode());

		container.appendChild(this.btn);
		this.toggleMode();
	}

	toggleMode() {
		if (this.mode === 'wysiwyg') {
			// passer en Markdown
			this.editor_wysiwyg.style.display = 'none';
			this.textarea.style.display = '';
			this.mode = 'markdown';
		} else {
			// passer en WYSIWYG
			this.textarea.style.display = 'none';
			this.editor_wysiwyg.style.display = '';
			this.mode = 'wysiwyg';
		}

		this.updateButton();
		
		// Lancer une transaction vide pour forcer les updates de tous les boutons
		this.editor.view.dispatch(this.editor.state.tr);
	}
	
	// Mettre à jour l'intérieur du bouton
	updateButton() {
		if (this.mode === 'wysiwyg') {
			this.btn.innerHTML = this.labelMarkdown;
		} else {
			this.btn.innerHTML = this.labelWysiwyg;
		}
	}
}

export default EditorModeButton;
