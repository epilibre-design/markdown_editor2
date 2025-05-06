/* -------------------------------------
 * Fonctions utilitaires pour les nodes 
 * -------------------------------------*/

export const nodeIcons = {
	blockquote: 'sp-icone_quote-text',
  codeBlock: 'sp-icone_code-block',
  bulletList: 'sp-icone_list-unordered',
  orderedList: 'sp-icone_list-ordered-2',
}

export function canToggleNode(editor, type, attrs = {}) {
  if (!editor) return false;
  try {
    return type === "codeBlock"
      ? editor.can().toggleNode("codeBlock", "paragraph")
      : editor.can().toggleWrap(type);
  } catch {
    return false;
  }
}

export function isNodeActive(editor, type, attrs = {}) {
  if (!editor) return false;
  return editor.isActive(type);
}

export function toggleNode(editor, type, attrs = {}) {
  if (!editor) return;
  if (type === "codeBlock") {
    return editor.chain().focus().toggleNode("codeBlock", "paragraph").run()
  } else {
    return editor.chain().focus().toggleWrap(type).run()
  }
}

export function isNodeButtonDisabled(editor, type, attrs = {}, userDisabled = false) {
  if (!editor) return true;
  if (userDisabled) return true;
  if (!canToggleNode(editor, type, attrs)) return true;
  return false;
}

export function shouldShowNodeButton({ editor, type, attrs = {}, hideWhenUnavailable }) {
	// Est-ce qu'il y a l'éditeur TipTap visible ou pas
	const style = window.getComputedStyle(editor.options.element || editor.view.dom);
	if (style.display == 'none') return false;
	
  if (!editor.schema.nodes[type]) return false;
  if (!hideWhenUnavailable) return true;

  const { selection } = editor.state;
  if (selection.node) return false;
  if (!canToggleNode(editor, type, attrs)) return false;

  return true;
}

export function getFormattedNodeName(type) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}


/**
 * Bouton pour activer un node
 * 
 * @param {Editor} editor
 * @param {object} options
 *   - type: string (e.g. 'blockquote')
 *   - iconHTML?: string
 *   - attrs?: object   (attributs du node)
 *   - hideWhenUnavailable?: boolean
 *   - userDisabled?: boolean
 *   - container?: HTMLElement
 */
export class NodeButton {
  constructor(editor, {
    type,
    iconClass = '',
		iconOnly = false,
    label = '',
		title = '',
    attrs = {},
    hideWhenUnavailable = false,
    userDisabled = false,
    container = null,
  }) {
    this.editor = editor;
    this.type = type;
    this.attrs = attrs;
    this.hideWhenUnavailable = hideWhenUnavailable;
    this.userDisabled = userDisabled;

    // Création du bouton
    this.btn = document.createElement('button');
    this.btn.type = 'button';
    this.btn.className = 'btn_link btn_node btn_node_' + this.type + ' ' + (iconClass || nodeIcons[this.type]);
    this.btn.innerHTML = '<span class="btn__label" ' + (iconOnly ? 'hidden' : '') + '>' + label || getFormattedMarkName(type) + '</span>';
    this.btn.title = title || label || getFormattedNodeName(type);
    this.btn.setAttribute('aria-label', label || getFormattedNodeName(type));

    // événement clic
    this.btn.addEventListener('click', () => this.handleClick());

    // Mise à jour à chaque transaction
    this.editor.on('transaction', () => this.updateState());

    // État initial
    this.updateState();

    // Insertion
    if (container) {
			container.appendChild(this.btn);
		}
  }

  handleClick() {
    if (this.btn.disabled) return;
    toggleNode(this.editor, this.type, this.attrs);
    this.updateState();
  }

  updateState() {
    const show = shouldShowNodeButton({
      editor: this.editor,
      type: this.type,
      attrs: this.attrs,
      hideWhenUnavailable: this.hideWhenUnavailable,
    });
    this.btn.style.display = show ? '' : 'none';
    if (!show) return;

    const disabled = isNodeButtonDisabled(
      this.editor,
      this.type,
      this.attrs,
      this.userDisabled
    );
    this.btn.disabled = disabled;
		
		// Actif ou non
    const active = isNodeActive(this.editor, this.type, this.attrs);
    this.btn.classList.toggle('btn_on', active);
    if (active) {
			this.btn.setAttribute('aria-pressed', 'true');
		}
		else {
			this.btn.setAttribute('aria-pressed', 'false');
		}
  }
}

export default NodeButton;
