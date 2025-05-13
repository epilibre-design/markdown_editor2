import { isEditorVisible } from './utils.js';
import { getFormattedNodeName } from './NodeButton.js';

/* ---------------------
 * Fonctions utilitaires
 * --------------------- */

/** Peut-on faire un undo ? */
export function canUndo(editor) {
  if (!editor) return false;
  try {
    return editor.can().undo();
  } catch {
    return false;
  }
}

/** Peut-on faire un redo ? */
export function canRedo(editor) {
  if (!editor) return false;
  try {
    return editor.can().redo();
  } catch {
    return false;
  }
}

/**
 * @param {Editor} editor
 * @param {object} options
 *   - type: 'undo' | 'redo'
 *   - iconClass?: string (classe CSS pour l’icône)
 *   - iconOnly?: boolean
 *   - label?: string
 *   - hideWhenUnavailable?: boolean
 *   - container: HTMLElement parent
 */
export class UndoRedoButton {
  constructor(editor, {
    type,
    iconClass = '',
    iconOnly = false,
    label = '',
    hideWhenUnavailable = false,
    container,
  }) {
    this.editor = editor;
    this.type   = type;
    this.hideWhenUnavailable = hideWhenUnavailable;

    // Création du bouton
    this.btn = document.createElement('button');
    this.btn.type = 'button';
    this.btn.className = 'btn_link btn_' + type + ' ' + (iconClass || (type === 'undo' ? 'sp-icone_arrow-go-back-line' : 'sp-icone_arrow-go-forward-line'));
    this.btn.innerHTML = '<span class="btn__label" ' + (iconOnly ? 'hidden' : '') + '>' + (label || getFormattedNodeName(type)) + '</span>';
    this.btn.title = label || getFormattedNodeName(type);
    this.btn.setAttribute('aria-label', label || getFormattedNodeName(type));

    // Clic → undo ou redo
    this.btn.addEventListener('click', () => {
      if (this.type === 'undo') {
        this.editor.chain().focus().undo().run();
      } else {
        this.editor.chain().focus().redo().run();
      }
    });

    // Mise à jour sur transaction & selection
    this.editor
      .on('transaction',   () => this.updateState())
      .on('selectionUpdate',() => this.updateState());

    // État initial
    this.updateState();
    
    // Insertion
    if (container) container.appendChild(this.btn);
  }

  updateState() {
    const visible = isEditorVisible(this.editor);
    if (this.hideWhenUnavailable && !visible) {
      this.btn.style.display = 'none';
      return;
    } else {
      this.btn.style.display = '';
    }

    const available = this.type === 'undo' ? canUndo(this.editor) : canRedo(this.editor);
    this.btn.disabled = !available;
  }
}

export default UndoRedoButton;
