
export const listIcons = {
  bulletList:   'sp-icone_list-unordered',
  orderedList:  'sp-icone_list-ordered-2',
  taskList:     'sp-icone_list-check',
};

/**
 * Peut-on toggler une liste (bullet, ordered, task) ?
 */
export function canToggleList(editor, type) {
  if (!editor) return false;
  try {
    switch (type) {
      case 'bulletList':
        return editor.can().toggleBulletList();
      case 'orderedList':
        return editor.can().toggleOrderedList();
      case 'taskList':
        return editor.can().toggleList('taskList', 'taskItem');
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * La liste est-elle active sur la sélection ?
 */
export function isListActive(editor, type) {
  if (!editor) return false;
  
  switch (type) {
    case 'bulletList':
      return editor.isActive('bulletList');
    case 'orderedList':
      return editor.isActive('orderedList');
    case 'taskList':
      return editor.isActive('taskList');
    default:
      return false;
  }
}

/**
 * Toggler la liste
 */
export function toggleList(editor, type) {
  if (!editor) return;
  
  switch (type) {
    case 'bulletList':
      editor.chain().focus().toggleBulletList().run();
      break;
    case 'orderedList':
      editor.chain().focus().toggleOrderedList().run();
      break;
    case 'taskList':
      editor.chain().focus().toggleList('taskList', 'taskItem').run();
      break;
  }
}

/**
 * Désactivé ou pas
 */
export function isListButtonDisabled(editor, type, userDisabled = false) {
  if (!editor) return true;
  if (userDisabled) return true;
  if (!canToggleList(editor, type)) return true;
  return false;
}

export function shouldShowListButton(editor, type, hideWhenUnavailable = false) {
	// Est-ce qu'il y a l'éditeur TipTap visible ou pas
	const style = window.getComputedStyle(editor.options.element || editor.view.dom);
	if (style.display == 'none') return false;
	
  if (!editor || !editor.schema.nodes[type]) return false;
  if (!hideWhenUnavailable) return true;
  const { selection } = editor.state;
  if (selection.node) return false;
  return true;
}

export function getFormattedListName(type) {
  return type
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
}

/**
 * Bouton dédié pour les listes
 * 
 * @param {Editor} editor
 * @param {object} options
 *   - type?: string
 *   - iconClass?: string
 *   - moreClass?: string
 *   - iconOnly?: boolean
 *   - label?: string
 *   - title?: string
 *   - hideWhenUnavailable?: boolean
 *   - userDisabled?: boolean
 *   - container?: HTMLElement
 */
export class ListButton {
  constructor(editor, {
    type,
    iconClass = '',
    moreClass = '',
    iconOnly = false,
    label = '',
    title = '',
    hideWhenUnavailable = false,
    userDisabled = false,
    container = null,
  } = {}) {
    this.editor = editor;
    this.type   = type;
    this.hideWhenUnavailable = hideWhenUnavailable;
    this.userDisabled        = userDisabled;
    this.iconOnly            = iconOnly;

    this.btn = document.createElement('button');
    this.btn.type = 'button';
    this.btn.className = 'btn_link btn_node btn_node_' + this.type + ' ' + (iconClass || listIcons[this.type]) + ' ' + moreClass;
    this.btn.innerHTML = '<span class="btn__label" ' + (iconOnly ? 'hidden' : '') + '>' + (label || getFormattedListName(type)) + '</span>';
    this.btn.title = title || label || getFormattedListName(type);
    this.btn.setAttribute('aria-label', label || getFormattedListName(type));

    const iclass = iconClass || listIcons[type] || '';
    if (iclass) this.btn.classList.add(iclass);

    this.btn.addEventListener('click', () => {
      if (this.btn.disabled) return;
      toggleList(this.editor, this.type);
      this.updateState();
    });

    this.editor
      .on('transaction',   () => this.updateState())
      .on('selectionUpdate',() => this.updateState());

    this.updateState();

    if (container) container.appendChild(this.btn);
  }

  updateState() {
    const show = shouldShowListButton(
      this.editor,
      this.type,
      this.hideWhenUnavailable
    );
    this.btn.style.display = show ? '' : 'none';
    if (!show) return;

    //~ const disabled = isListButtonDisabled(
      //~ this.editor,
      //~ this.type,
      //~ this.userDisabled
    //~ );
    //~ this.btn.disabled = disabled;

    const active = isListActive(this.editor, this.type);
    this.btn.classList.toggle('btn_on', active);
    if (active) {
			this.btn.setAttribute('aria-pressed', 'true');
		}
		else {
			this.btn.setAttribute('aria-pressed', 'false');
		}
  }
}

export default ListButton;
