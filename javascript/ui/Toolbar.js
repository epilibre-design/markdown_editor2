import ButtonsGroup from './ButtonsGroup.js';
import Spacer from './Spacer.js';
import MarkButton from './MarkButton.js';
import NodeButton from './NodeButton.js';
import EditorModeButton from './EditorModeButton.js';
// importer aussi NodeButton, HeaderList… au besoin

/**
 * Barre d'outils pour l'éditeur
 * 
 * Génère le HTML avec des composants d'interface (boutons, menus déroulants…),
 * insérable aussi bien dans une barre fixe ou dans une bulle
 * 
 * @param {Editor} editor — instance Tiptap
 * @param {Array} config — tableau de description
 * @param {HTMLElement} container — où injecter la barre
 */
export class Toolbar {
	/** registre des composants disponibles */
	static registry = {
	};

	/**
	 * Permet d’ajouter un composant au registre
	 * 
	 * @param {string} name
	 * @param {class} componentClass
	 */
	static registerComponent(name, componentClass) {
		Toolbar.registry[name] = componentClass;
	}

	constructor(editor, config, container) {
		this.editor = editor;
		this.config = config;
		this.container = container;

		this.build();
	}

	// Construit la toolbar à partir de la config
	build() {
		// On vide le contenu pour être sûr
		this.container.innerHTML = '';
		
		// Pour chaque élément de la description
		this.config.forEach(item => {
			const Component = Toolbar.registry[item.component];
			if (!Component) {
				console.warn(`Toolbar: composant inconnu « ${item.component} »`);
				return;
			}
			// On crée le composant et on l'insère là où demandé
			new Component(this.editor, {
				...item,
				container: this.container,
			});
		});
	}
}

// On déclare les composants de base fournis par le plugin
Toolbar.registerComponent('ButtonsGroup', ButtonsGroup);
Toolbar.registerComponent('Spacer', Spacer);
Toolbar.registerComponent('MarkButton', MarkButton);
Toolbar.registerComponent('NodeButton', NodeButton);
Toolbar.registerComponent('EditorModeButton', EditorModeButton);
//~ Toolbar.registerComponent('NodeButton', NodeButton);
//~ Toolbar.registerComponent('HeaderList', HeaderList);

export default Toolbar;
