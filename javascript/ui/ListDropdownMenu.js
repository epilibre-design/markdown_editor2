import {
	canToggleList,
	toggleList,
	isListActive,
	listIcons,
	ListButton,
} from './ListButton.js';
import { isEditorVisible } from './utils.js';

/**
 * Retourne le niveau de heading actif, ou 0 si aucun.
 */
export function getActiveListType(editor) {
	for (const [type, iconClass] of Object.entries(listIcons)) {
		if (isListActive(editor, type)) {
			return type;
		}
	};
	
	return 0;
}

/**
 * Au moins une liste possible ?
 */
export function canToggleAnyList(editor, listTypes) {
	if (!editor) return false;
	return listTypes.some((type) => canToggleList(editor, type));
}

/**
 * Au moins une liste active ?
 */
export function isAnyListActive(editor, listTypes) {
	if (!editor) return false;
	return listTypes.some((type) => isListActive(editor, type));
}

/**
 * Peut-on sink (indenter) un item de liste ?
 */
export function canIndent(editor) {
	return editor.can().sinkListItem('listItem');
}

/**
 * Peut-on lift (désindenter) un item de liste ?
 */
export function canOutdent(editor) {
	return editor.can().liftListItem('listItem');
}

/**
 * Sink (indent) un item de liste.
 */
export function indentList(editor) {
	editor.chain().focus().sinkListItem('listItem').run();
}

/**
 * Lift (outdent) un item de liste.
 */
export function outdentList(editor) {
	editor.chain().focus().liftListItem('listItem').run();
}

/**
 * Le composant doit-il s'afficher ?
 * 
 * @param {Editor} editor
 * @param {boolean} hideWhenUnavailable
 */
export function shouldShowListDropdownMenu(editor, hideWhenUnavailable = false) {
	if (!isEditorVisible(editor)) return false;
	if (!editor) return false;
	if (!hideWhenUnavailable) return true;
	if (editor.state.selection.node) return false;
	return true;
}

/**
 * @param {Editor} editor
 * @param {object} options
 *   - container: HTMLElement
 *   - iconClass?: string
 *   - iconOnly?: boolean
 *   - label?: string
 *   - labels?: object
 *   - types?: string[] (par défaut ['bulletList','orderedList','taskList'])
 *   - hideWhenUnavailable?: boolean
 */
export class ListDropdownMenu {
	constructor(editor, {
		container,
		iconClass = '',
		iconOnly = false,
		label = 'List', // label du bouton racine
		labels = {}, // labels de chaque type de boutons dans le menu
		types = ['bulletList','orderedList','taskList'],
		hideWhenUnavailable = false,
	}) {
		const labelsDefault = {
			'bulletList': 'Bullet list',
			'orderedList': 'Ordered list',
			'taskList': 'Task list',
			'indent': 'Indent',
			'outdent': 'Outdent',
		};
		this.labels = Object.assign(labelsDefault, labels);
		this.editor = editor;
		this.types  = types.filter(type => editor.schema.nodes[type]);
		this.hideWhenUnavailable = hideWhenUnavailable;
		this.currentIcon = iconClass || listIcons[this.types[0]]; // icône par défaut

		if (hideWhenUnavailable && !isEditorVisible(editor)) return;

		// Wrapper dropdown
		this.wrapper = document.createElement('div');
		this.wrapper.className = 'dropdown';

		// Bouton toggle
		this.toggleBtn = document.createElement('button');
		this.toggleBtn.className = 'btn_link btn_node btn_node_list_dropdown dropdown-toggle ' + this.currentIcon;
		this.toggleBtn.type = 'button';
		this.toggleBtn.title = label;
		this.toggleBtn.innerHTML = '<span class="btn__label" ' + (iconOnly ? 'hidden' : '') + '>' + label + '</span>';
		this.toggleBtn.setAttribute('data-toggle', 'dropdown');
		this.wrapper.appendChild(this.toggleBtn);

		// Menu
		this.menu = document.createElement('div');
		this.menu.className = 'dropdown-menu';
		this.wrapper.appendChild(this.menu);

		// Liste des types
		this.types.forEach(type => {
			new ListButton(editor, {
        type,
        'label': this.labels[type],
        'hideWhenUnavailable': hideWhenUnavailable,
        moreClass: 'dropdown-item',
        container: this.menu,
      });
		});

		// Séparateur
		const sep = document.createElement('div');
		sep.className = 'dropdown-divider';
		this.menu.appendChild(sep);

		// Indent / Outdent
		[ 
			{ fn: indentList,  icon: 'sp-icone_indent-increase', title: this.labels.indent  },
			{ fn: outdentList, icon: 'sp-icone_indent-decrease', title: this.labels.outdent }
		].forEach(({ fn, icon, title }) => {
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = `btn_link dropdown-item ${icon}`;
			btn.title = title;
			btn.textContent = title;
			btn.addEventListener('click', () => fn(editor));
			this.menu.appendChild(btn);
		});

		editor
			.on('transaction',   () => this.updateState())
			.on('selectionUpdate',() => this.updateState());
		
		// État initial
		this.updateState();
		
		// Insertion
		if (container) container.appendChild(this.wrapper);
	}

	/**
	 * Met à jour l’état du toggle (disabled si aucun type dispo).
	 * Dans ce cas on désactive aussi le dropdown.
	 */
	updateState() {
		// affichage conditionnel
		const show = shouldShowListDropdownMenu(
			this.editor,
			this.hideWhenUnavailable
		);
		this.wrapper.style.display = show ? '' : 'none';
		if (!show) return;
		
		// Active
		const active = isAnyListActive(this.editor, this.types);
		this.toggleBtn.classList.toggle('btn_on', active);
		if (active) {
			this.toggleBtn.setAttribute('aria-pressed', 'true');
		}
		else {
			this.toggleBtn.setAttribute('aria-pressed', 'false');
		}
		
		// Désactivé ou pas
		//~ const any = canToggleAnyList(this.editor, this.types);
		//~ this.toggleBtn.disabled = !any;
		
		// Quel nouveau type
		const newType = getActiveListType(this.editor);
		
		// On retire la classe actuelle
		this.toggleBtn.classList.remove(this.currentIcon);
		
		// Nouvelle classe
		this.currentIcon = (!newType) ? (this.iconClass || listIcons[this.types[0]]) : listIcons[newType];
		this.toggleBtn.classList.add(this.currentIcon);
	}
}

export default ListDropdownMenu;
