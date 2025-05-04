/**
 * Permet d'espacer des composants entre eux (par ex entre deux groupes de boutons)
 */
export class Spacer {
  constructor(editor, { container }) {
    const el = document.createElement('div');
    el.className = 'md-editor__spacer';
    container.appendChild(el);
  }
}

export default Spacer;
