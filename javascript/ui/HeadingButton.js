/***********************
 * Fonctions utilitaires 
 ***********************/

export const headingIcons = {
	0: 'sp-icone_heading',
	1: 'sp-icone_h-1',
	2: 'sp-icone_h-2',
	3: 'sp-icone_h-3',
	4: 'sp-icone_h-4',
	5: 'sp-icone_h-5',
	6: 'sp-icone_h-6',
}

/**
 * Peut-on toggle un heading du niveau donné ?
 */
export function canToggleHeading(editor, level) {
	if (!editor) return false;
	try {
		return editor.can().toggleNode('heading', 'paragraph', { 'level': level });
	} catch {
		return false;
	}
}

/**
 * Le heading de ce niveau est-il actif ?
 */
export function isHeadingActive(editor, level) {
	if (!editor) return false;
	return level ? editor.isActive('heading', { 'level': level }) : editor.isActive('heading');
}

/**
 * Toggle du heading (applique ou revient en paragraphe).
 */
export function toggleHeading(editor, level) {
	if (!editor) return;

	if (isHeadingActive(editor, level)) {
		editor.chain().focus().setParagraph().run();
	} else {
		editor.chain().focus().toggleHeading({ 'level': level }).run();
	}
}

/**
 * Le bouton doit-il être disabled ?
 */
export function isHeadingButtonDisabled(editor, level, userDisabled = false) {
	if (!editor) return true;
	if (userDisabled) return true;
	if (!canToggleHeading(editor, level)) return true;
	return false;
}

/**
 * Le composant doit-il s'afficher ?
 */
export function shouldShowHeadingButton(editor, level, hideWhenUnavailable = false) {
	// Est-ce qu'il y a l'éditeur TipTap visible ou pas
	const style = window.getComputedStyle(editor.options.element || editor.view.dom);
	if (style.display == 'none') return false;

	if (!editor || !editor.schema.nodes.heading) return false;
	if (!hideWhenUnavailable) return true;
	if (editor.state.selection.node) return false;
	return true;
}

/**
 * Label par défaut
 */
export function getFormattedHeadingName(base='Heading', level) {
	return `${base} ${level}`;
}

/**
 * @param {Editor} editor
 * @param {object} options
 *   - level: number 1–6
 *   - iconClass?: string
 *   - iconOnly?: boolean
 *   - label?: string
 *   - labelBase?: string
 *   - hideWhenUnavailable?: boolean
 *   - userDisabled?: boolean
 *   - container?: HTMLElement
 */
export class HeadingButton {
	constructor(editor, {
		level,
		iconClass = '',
		moreClass = '',
		iconOnly = false,
		label = '',
		labelBase = 'Heading',
		hideWhenUnavailable = false,
		userDisabled = false,
		container = null,
	}) {
		this.editor = editor;
		this.level  = Number(level);
		this.hideWhenUnavailable = hideWhenUnavailable;
		this.userDisabled        = userDisabled;

		// création du bouton
		this.btn = document.createElement('button');
		this.btn.type  = 'button';
		this.btn.className = 'btn_link btn_node btn_node_heading btn_node_heading_' + this.level + ' ' + (iconClass || headingIcons[this.level]) + ' ' + moreClass;
		this.btn.title = label || getFormattedHeadingName(labelBase, level);
		this.btn.setAttribute('aria-label', label || getFormattedHeadingName(labelBase, level));
		this.btn.innerHTML = '<span class="btn__label" ' + (iconOnly ? 'hidden' : '') + '>' + (label || getFormattedHeadingName(labelBase, level)) + '</span>';

		// clic → toggle
		this.btn.addEventListener('click', () => this.handleClick());

		// mise à jour sur transaction
		this.editor.on('transaction', () => this.updateState());

		// état initial
		this.updateState();

		// insertion dans le container
		if (container) container.appendChild(this.btn);
	}

	handleClick() {
		if (this.btn.disabled) return;
		toggleHeading(this.editor, this.level);
	}

	updateState() {
		// affichage conditionnel
		const show = shouldShowHeadingButton(
			this.editor,
			this.level,
			this.hideWhenUnavailable
		);
		this.btn.style.display = show ? '' : 'none';
		if (!show) return;

		// disabled
		const disabled = isHeadingButtonDisabled(
			this.editor,
			this.level,
			this.userDisabled
		);
		this.btn.disabled = disabled;

		// active
		const active = isHeadingActive(this.editor, this.level);
		this.btn.classList.toggle('btn_on', active);
		if (active) {
			this.btn.setAttribute('aria-pressed', 'true');
		}
		else {
			this.btn.setAttribute('aria-pressed', 'false');
		}
	}
}

export default HeadingButton;
