import Toolbar from './Toolbar.js';

/**
 * Groupe de boutons en utilisant le composant CSS de SPIP
 * 
 * @param {Editor} editor
 * @param {object} options - { id, children = [], container }
 */
export class ButtonsGroup {
  constructor(editor, { id, cssClass, children = [], container }) {
    this.editor = editor;
    this.el = document.createElement('div');
    this.el.className = 'groupe-btns groupe-btns_menu';
    if (id) {
			this.el.id = id;
		}
    if (cssClass) {
			this.el.className += ' ' + cssClass;
		}

    container.appendChild(this.el);

    // C’est ici, dans le composant, qu’on gère les enfants :
    children.forEach(child => {
      const Component = Toolbar.registry[child.component];
      if (!Component) {
        console.warn(`ButtonsGroup: composant inconnu « ${child.component} »`);
        return;
      }
      // On transmet directement le bloc de description `child` en options
      new Component(editor, {
        ...child,
        container: this.el,
      });
    });
  }
}

export default ButtonsGroup;
