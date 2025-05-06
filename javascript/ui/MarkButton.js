
/* -------------------------------------
 * Fonctions utilitaires pour les marks 
 * -------------------------------------*/

/**
 * Vérifie si une mark existe dans le schéma de l'éditeur Tiptap.
 * @param {string} type 
 * @param {Editor} editor 
 * @returns {boolean}
 */
export function isMarkInSchema(type, editor) {
	if (!editor) return false;
	return Boolean(editor.schema.marks[type]);
}

export const markIcons = {
	bold: 'sp-icone_bold',
  italic: 'sp-icone_italic',
  strike: 'sp-icone_strikethrough',
  code: 'sp-icone_code-s-slash-line',
  //~ superscript: '',
  //~ subscript: '',
}

/**
 * Vérifie si on peut switcher une mark donné.
 * @param {Editor} editor 
 * @param {string} type 
 * @returns {boolean}
 */
export function canToggleMark(editor, type) {
	if (!editor) return false;
	try {
		return editor.can().toggleMark(type);
	} catch {
		return false;
	}
}

/**
 * Vérifie si une mark est actif sur la sélection courante.
 * @param {Editor} editor 
 * @param {string} type 
 * @returns {boolean}
 */
export function isMarkActive(editor, type) {
	if (!editor) return false;
	return editor.isActive(type);
}

/**
 * Toggle une mark.
 * @param {Editor} editor 
 * @param {string} type 
 */
export function toggleMark(editor, type) {
	if (!editor) return;
	editor.chain().focus().toggleMark(type).run();
}

/**
 * Détermine si le bouton mark doit être désactivé.
 * @param {Editor} editor 
 * @param {string} type 
 * @param {boolean} userDisabled 
 * @returns {boolean}
 */
export function isMarkButtonDisabled(editor, type, userDisabled = false) {
	if (!editor) return true;
	if (userDisabled) return true;
	if (editor.isActive('codeBlock')) return true;
	if (!canToggleMark(editor, type)) return true;
	
	return false;
}

/**
 * Détermine si le bouton doit être affiché.
 * @param {object} params 
 * @param {Editor} params.editor 
 * @param {string} params.type 
 * @param {boolean} params.hideWhenUnavailable 
 * @returns {boolean}
 */
export function shouldShowMarkButton({ editor, type, hideWhenUnavailable }) {
	// Est-ce qu'il y a l'éditeur TipTap visible ou pas
	const style = window.getComputedStyle(editor.options.element || editor.view.dom);
	if (style.display == 'none') return false;
	
	if (!isMarkInSchema(type, editor)) return false;
	if (!hideWhenUnavailable) return true;

	// Si sélection de node (ex. image) → on masque
	const { selection } = editor.state;
	if (selection.node) return false;

	// Si pas de toggle possible → on masque
	if (!canToggleMark(editor, type)) return false;

	return true;
}

/**
 * Formatte un nom de mark (capitalize).
 * @param {string} type 
 * @returns {string}
 */
export function getFormattedMarkName(type) {
	return type.charAt(0).toUpperCase() + type.slice(1);
}


/* ------------------------------------------------------------------------
 * Classe MarkButton
 * ------------------------------------------------------------------------ */

/**
 * Bouton pour activer une mark
 * 
 * @param {Editor} editor  Instance de Tiptap
 * @param {object} options
 *   - type: string (ex. 'bold')
 *   - iconHTML?: string (HTML ou texte à insérer dans le bouton)
 *   - hideWhenUnavailable?: boolean (masquer si non dispo)
 *   - userDisabled?: boolean (désactiver forcé)
 *   - container?: HTMLElement (parent où insérer)
 */
export class MarkButton {
	constructor(editor, {
		type,
		iconClass = '',
		iconOnly = false,
		label = '',
		title = '',
		hideWhenUnavailable = false,
		userDisabled = false,
		container = null,
	}) {
		this.editor = editor;
		this.type   = type;
		this.hideWhenUnavailable = hideWhenUnavailable;
		this.userDisabled        = userDisabled;

		// Crée le DOM du bouton
		this.btn = document.createElement('button');
		this.btn.type = 'button';
		this.btn.className = 'btn_link btn_mark btn_mark_' + this.type + ' ' + (iconClass || markIcons[this.type]);
		this.btn.innerHTML = '<span class="btn__label" ' + (iconOnly ? 'hidden' : '') + '>' + label || getFormattedMarkName(type) + '</span>';
		this.btn.title = title || label || getFormattedMarkName(type);
		this.btn.setAttribute('aria-label', label || getFormattedMarkName(type));

		// Événement au clic
		this.btn.addEventListener('click', () => this.handleClick());

		// Mise à jour à chaque transaction
		this.editor.on('transaction', () => this.updateState());

		// État initial
		this.updateState();

		// Insertion dans le container
		if (container) {
			container.appendChild(this.btn);
		}
	}

	/**
	 * Gestion du clic : bascule le mark.
	 */
	handleClick() {
		if (this.btn.disabled) return;
		toggleMark(this.editor, this.type);
		this.updateState();
	}

	/**
	 * Met à jour l'état actif/disabled/visible du bouton.
	 */
	updateState() {
		// Affichage ou non
		const show = shouldShowMarkButton({
			editor: this.editor,
			type: this.type,
			hideWhenUnavailable: this.hideWhenUnavailable,
		});
		this.btn.style.display = show ? '' : 'none';

		if (!show) return;

		// Désactivé ou non
		const disabled = isMarkButtonDisabled(
			this.editor,
			this.type,
			this.userDisabled
		);
		this.btn.disabled = disabled;

		// Actif ou non
		const active = isMarkActive(this.editor, this.type);
		this.btn.classList.toggle('btn_on', active);
		if (active) {
			this.btn.setAttribute('aria-pressed', 'true');
		}
		else {
			this.btn.setAttribute('aria-pressed', 'false');
		}
	}
}

export default MarkButton;
