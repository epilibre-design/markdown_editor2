import { headingIcons, canToggleHeading, isHeadingActive, toggleHeading, getFormattedHeadingName, HeadingButton } from './HeadingButton.js';
import { isEditorVisible } from './utils.js';

/**
 * Retourne le niveau de heading actif, ou 0 si aucun.
 */
export function getActiveHeadingLevel(editor) {
	for (let level = 1; level <= 6; level++) {
		if (isHeadingActive(editor, level)) {
			return level;
		}
	}

	return 0;
}

/**
 * Le composant doit-il s'afficher ?
 * 
 * @param {Editor} editor
 * @param {boolean} hideWhenUnavailable
 */
export function shouldShowHeadingDropdownMenu(editor, hideWhenUnavailable = false) {
	if (!isEditorVisible(editor)) return false;
	if (!editor || !editor.schema.nodes.heading) return false;
	if (!hideWhenUnavailable) return true;
	if (editor.state.selection.node) return false;
	return true;
}

/**
 * Y a-t-il au moins un niveau de heading ok ?
 * @param {Editor} editor
 * @param {number[]} levels
 * @returns {boolean}
 */
export function canToggleAnyHeading(editor, levels = [1,2,3,4,5,6]) {
  return levels.some(level => {
    try {
      return editor.can().toggleHeading({ level });
    } catch {
      return false;
    }
  });
}

/**
 * Génère un menu déroulant de niveau de titre utilisant Bootstrap 4 dropdown
 * 
 * @param {Editor} editor — instance Tiptap
 * @param {object} options
 *   - container: HTMLElement où injecter le dropdown
 *   - iconClass?: string
 *   - iconOnly?: boolean
 *   - label?: string
 *   - labelBase?: string
 *   - hideWhenUnavailable?: boolean
 *   - levels?: array de niveaux à proposer (ex. [2, 3, 4])
 */
export class HeadingDropdownMenu {
	constructor(editor, {
		container,
		iconClass = '',
		iconOnly = false,
		label = '',
		labelBase = 'Heading',
		hideWhenUnavailable = false,
		levels = [1,2,3,4,5,6],
	}) {
		this.editor = editor;
		this.levels = levels;
		this.hideWhenUnavailable = hideWhenUnavailable;
		this.iconClass = iconClass;
		this.currentIcon = iconClass || headingIcons[0];

		// Création du wrapper dropdown
		this.wrapper = document.createElement('div');
		this.wrapper.className = 'dropdown';

		// Création du bouton toggle
		this.toggleBtn = document.createElement('button');
		this.toggleBtn.className = 'btn_link btn_node btn_node_heading_dropdown dropdown-toggle ' + this.currentIcon;
		this.toggleBtn.type = 'button';
		this.toggleBtn.setAttribute('data-toggle', 'dropdown');
		this.toggleBtn.title = label || getFormattedHeadingName(labelBase, '');
		this.toggleBtn.innerHTML = '<span class="btn__label" ' + (iconOnly ? 'hidden' : '') + '>' + label || getFormattedHeadingName(labelBase, '') + '</span>';
		this.wrapper.appendChild(this.toggleBtn);

		// Création du menu
		this.menu = document.createElement('div');
		this.menu.className = 'dropdown-menu';
		this.wrapper.appendChild(this.menu);

		// Items : un HeadingButton par niveau, dans le menu
    this.levels.forEach(level => {
      new HeadingButton(editor, {
        level,
        'labelBase': labelBase,
        'hideWhenUnavailable': hideWhenUnavailable,
        moreClass: 'dropdown-item',
        container: this.menu,
      });
    });

		// Écouteurs pour mise à jour du libellé
		editor.on('transaction', () => this.updateState());
		editor.on('selectionUpdate', () => this.updateState());

		// Label initial
		this.updateState();

		// Injection dans le container
		if (container) container.appendChild(this.wrapper);
	}

	/**
	 * Met à jour l’icône/texte du bouton racine selon le niveau actif.
	 */
	updateState() {
		// affichage conditionnel
		const show = shouldShowHeadingDropdownMenu(
			this.editor,
			this.hideWhenUnavailable
		);
		this.wrapper.style.display = show ? '' : 'none';
		if (!show) return;
		
		// Active
		const active = isHeadingActive(this.editor);
		this.toggleBtn.classList.toggle('btn_on', active);
		if (active) {
			this.toggleBtn.setAttribute('aria-pressed', 'true');
		}
		else {
			this.toggleBtn.setAttribute('aria-pressed', 'false');
		}
		
		// Désactivé ou pas
		const any = canToggleAnyHeading(this.editor, this.levels);
		this.toggleBtn.disabled = !any;
		
		// Quel nouveau level
		const level = getActiveHeadingLevel(this.editor);
		
		// On retire la classe actuelle
		this.toggleBtn.classList.remove(this.currentIcon);
		
		// Nouvelle classe
		this.currentIcon = (level == 0) ? (this.iconClass || headingIcons[level]) : headingIcons[level];
		this.toggleBtn.classList.add(this.currentIcon);
	}
}

export default HeadingDropdownMenu;
