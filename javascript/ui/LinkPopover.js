import { isEditorVisible } from './utils.js';

export function canToggleLink(editor) {
  if (!editor) return false;
  try {
    return editor.can().setLink({ href: '' });
  } catch {
    return false;
  }
}

export function isLinkActive(editor) {
  if (!editor) return false;
  return editor.isActive('link');
}

export function setLink(editor, href, title = '') {
  editor.chain()
    .focus()
    .extendMarkRange('link')
    .setLink({ href: href, title: title })
    .run();
}

export function unsetLink(editor) {
  editor.chain()
    .focus()
    .extendMarkRange('link')
    .unsetLink()
    .run();
}

export function getLinkAttributes(editor) {
  if (!isLinkActive(editor)) return { href: '', title: '' };
  const attrs = editor.getAttributes('link');
  return { href: attrs.href || '', title: attrs.title || '' };
}

/**
 * Bouton + formulaire pour éditer les liens
 * 
 * @param {Editor} editor
 * @param {object} options
 *   - container: HTMLElement parent pour la toolbar
 *   - iconClass?: string
 *   - iconOnly?: boolean
 *   - label?: string
 *   - labels?: object
 *   - hideWhenUnavailable?: boolean
 *   - autoOpenOnLink?: boolean
 */
export class LinkPopover {
  constructor(editor, {
		container,
		iconClass = '',
		iconOnly = false,
		label = 'Link', // label du bouton racine
		labels = {}, // labels de chaque élement du formulaire
		hideWhenUnavailable = false,
    autoOpenOnLink = false,
	}) {
		const labelsDefault = {
			'url': 'URL',
			'title': 'Title',
			'apply': 'Apply link',
			'open': 'Open in a new window',
			'remove': 'Remove link',
		};
		this.labels = Object.assign(labelsDefault, labels);
    this.editor = editor;
    this.hideWhenUnavailable = hideWhenUnavailable;
    this.autoOpenOnLink = autoOpenOnLink;

    // Wrapper dropdown
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'dropdown';

    // Bouton racine
    this.toggleBtn = document.createElement('button');
    this.toggleBtn.type = 'button';
    this.toggleBtn.className = 'btn_link btn_mark btn_mark_link dropdown-toggle ' + (iconClass || 'sp-icone_link');
    this.toggleBtn.title = label;
		this.toggleBtn.innerHTML = '<span class="btn__label" ' + (iconOnly ? 'hidden' : '') + '>' + label + '</span>';
    this.toggleBtn.setAttribute('data-toggle', 'dropdown');
    this.toggleBtn.setAttribute('aria-haspopup', 'true');
    this.toggleBtn.setAttribute('aria-expanded', 'false');
    this.wrapper.appendChild(this.toggleBtn);

    // Menu/formulaire
    this.menu = document.createElement('div');
    this.menu.className = 'dropdown-menu formulaire_spip';
    this.wrapper.appendChild(this.menu);

    // Champ URL
    this.hrefWrapper = document.createElement('div');
    this.hrefWrapper.className = 'editer pleine_largeur';
    this.hrefInput = document.createElement('input');
    this.hrefInput.className = 'text';
    this.hrefInput.style.minWidth = '15em';
    this.hrefInput.type = 'url';
    this.hrefInput.placeholder = this.labels.url;
    this.hrefInput.setAttribute('aria-label', this.labels.url);
    this.hrefWrapper.appendChild(this.hrefInput);
    this.menu.appendChild(this.hrefWrapper);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'actions';

    this.applyBtn = document.createElement('button');
    this.applyBtn.type = 'button';
    this.applyBtn.className = 'btn_link';
    this.applyBtn.textContent = '✔';
    this.applyBtn.setAttribute('aria-label', this.labels.apply);
    this.applyBtn.setAttribute('title', this.labels.apply);
    actions.appendChild(this.applyBtn);

    this.openBtn = document.createElement('button');
    this.openBtn.type = 'button';
    this.openBtn.className = 'btn_link sp-icone_external-link-line';
    this.openBtn.setAttribute('aria-label', this.labels.open);
    this.openBtn.setAttribute('title', this.labels.open);
    actions.appendChild(this.openBtn);

    this.removeBtn = document.createElement('button');
    this.removeBtn.type = 'button';
    this.removeBtn.className = 'btn_link sp-icone_delete-bin-line';
    this.removeBtn.setAttribute('aria-label', this.labels.remove);
    this.removeBtn.setAttribute('title', this.labels.remove);
    actions.appendChild(this.removeBtn);

    this.menu.appendChild(actions);

    // Événements
    this.applyBtn.addEventListener('click', () => this.applyLink());
    this.openBtn.addEventListener('click', () => this.openLink());
    this.removeBtn.addEventListener('click', () => this.removeLink());
    this.hrefInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.applyLink();
      }
    });

    // Listeners
    editor
      .on('transaction',   () => this.updateState())
      .on('selectionUpdate',() => this.updateState());

    // État initial
    this.updateState();
    
    // Insertion
		if (container) container.appendChild(this.wrapper);
  }

  applyLink() {
    setLink(this.editor, this.hrefInput.value);
    this.close();
  }

  openLink() {
    const href = this.hrefInput.value;
    if (href) window.open(href, '_blank');
  }

  removeLink() {
    unsetLink(this.editor);
    this.close();
  }
	
	openPopover() {
    this.wrapper.classList.add('show');
    this.menu.classList.add('show');
    this.toggleBtn.setAttribute('aria-expanded', 'true');
  }
  
  close() {
    this.wrapper.classList.remove('show');
    this.menu.classList.remove('show');
    this.toggleBtn.setAttribute('aria-expanded', 'false');
  }

  updateState() {
    const active = isLinkActive(this.editor);
    const can = canToggleLink(this.editor);
    const show = isEditorVisible(this.editor) && (this.hideWhenUnavailable ? can : true);
		
    this.wrapper.style.display = show ? '' : 'none';
    
    // classe btn_on + aria-pressed
    this.toggleBtn.classList.toggle('btn_on', active);
    this.toggleBtn.setAttribute('aria-pressed', active);

    // disabled si on ne peut pas toggler
    this.toggleBtn.disabled = !can;

    // si actif, pré-remplir sinon vider
    if (active) {
      const { href, title } = getLinkAttributes(this.editor);
      this.hrefInput.value = href;
      
      if (this.autoOpenOnLink) {
        this.openPopover();
      }
    }
    else {
			this.hrefInput.value  = '';
			this.close();
		}
  }
}

export default LinkPopover;
