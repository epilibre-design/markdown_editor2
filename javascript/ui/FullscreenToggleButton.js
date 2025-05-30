/**
 * Bouton Toggle Fullscreen
 *
 * @param {HTMLElement} editor
 * @param {object} options
 *   - container: HTMLElement où insérer le bouton
 *   - enterIconClass: class CSS pour l'icône « entrer plein écran »  
 *   - exitIconClass:  class CSS pour l'icône « quitter plein écran »  
 *   - enterLabel:     label texte pour « entrer plein écran »  
 *   - exitLabel:      label texte pour « quitter plein écran »
 */
export class FullscreenToggleButton {
  constructor(editor, {
    container,
    enterIconClass = 'sp-icone_expand-diagonal-line',
    exitIconClass  = 'sp-icone_collapse-diagonal-fill',
    enterLabel     = 'Fullscreen',
    exitLabel      = 'Exit fullscreen',
    iconOnly       = false,
  } = {}) {
    this.editor = editor;
		this.editor_wysiwyg = editor.options.element || editor.view.dom
		this.editor_wrapper = this.editor_wysiwyg.parentElement;
    this.container = container;
    this.enterIconClass = enterIconClass;
    this.exitIconClass  = exitIconClass;
    this.enterLabel     = enterLabel;
    this.exitLabel      = exitLabel;

    // créer le bouton
    this.btn = document.createElement('button');
    this.btn.type = 'button';
    this.btn.className = 'btn_link btn_fullscreen ' + enterIconClass;
    this.btn.title = enterLabel;
    this.btn.setAttribute('aria-pressed', 'false');
    this.btn.setAttribute('aria-label', enterLabel);
    this.label = document.createElement('span');
    this.label.className = 'btn__label';
    this.label.setAttribute('hidden', iconOnly);
    this.label.textContent = enterLabel;
    this.btn.appendChild(this.label);

    // events
    this.btn.addEventListener('click', () => this.toggle());
    document.addEventListener('fullscreenchange', () => this.update());

    // état initial
    this.update();
    
    // On l'ajoute
    this.container.appendChild(this.btn);
  }

  isFullscreen() {
    return document.fullscreenElement === this.editor_wrapper;
  }

  enterFullscreen() {
    if (this.editor_wrapper.requestFullscreen) {
      this.editor_wrapper.requestFullscreen();
    }
  }

  exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  toggle() {
    if (this.isFullscreen()) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  }

  update() {
    const fs = this.isFullscreen();
    this.btn.setAttribute('aria-pressed', String(fs));
    // icône
    this.btn.classList.toggle(this.enterIconClass, !fs);
    this.btn.classList.toggle(this.exitIconClass,  fs);
    // label
    this.label.textContent = fs ? this.exitLabel : this.enterLabel;
    this.btn.title = fs ? this.exitLabel : this.enterLabel;
    this.btn.setAttribute('aria-label', fs ? this.exitLabel : this.enterLabel);
    // wrapper
    this.editor_wrapper.classList.toggle('fullscreen', fs);
  }
}

export default FullscreenToggleButton;
