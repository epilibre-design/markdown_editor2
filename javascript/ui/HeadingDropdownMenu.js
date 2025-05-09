import { headingIcons, canToggleHeading, isHeadingActive, toggleHeading, getFormattedHeadingName, HeadingButton } from './HeadingButton.js';

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
    levels.forEach(level => {
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
		// Est-ce qu'il y a l'éditeur TipTap visible ou pas
		const style = window.getComputedStyle(this.editor.options.element || this.editor.view.dom);
		this.wrapper.style.display = (style.display == 'none') ? 'none' : '';
		
		// Active
		const active = isHeadingActive(this.editor, this.level);
		this.toggleBtn.classList.toggle('btn_on', active);
		if (active) {
			this.toggleBtn.setAttribute('aria-pressed', 'true');
		}
		else {
			this.toggleBtn.setAttribute('aria-pressed', 'false');
		}
		
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
