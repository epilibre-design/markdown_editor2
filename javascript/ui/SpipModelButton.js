export class SpipModelButton {
	constructor(editor, {
		iconClass = '',
		iconOnly = false,
		label = 'Models',
		title = '',
		hideWhenUnavailable = false,
		container
	}) {
		this.editor = editor;
		this.hideWhenUnavailable = hideWhenUnavailable;
		
		// Création du bouton
		this.btn = document.createElement('button');
		this.btn.type = 'button';
		this.btn.className = 'btn_link btn_model ' + (iconClass || 'spip-icone_model');
		this.btn.innerHTML = '<span class="btn__label" ' + (iconOnly ? 'hidden' : '') + '>' + label + '</span>';
		this.btn.title = title || label;
		this.btn.setAttribute('aria-label', label);
		
		this.btn.addEventListener('click', () => {
			// Ouvre la modalbox SPIP
			jQuery.modalbox(
				window.spipConfig.markdown_editor.url_modeles + '&modalbox=oui',
				{
					type: 'ajax',
					sideBar: 'end',
					className: 'lat popin',
					onClose: (event) => {
						const modele = event.target.querySelector('#code_modele_modalbox');
						
						// Si on trouve le champ
						if (modele) {
							const json = event.target.querySelector('#code_modele_modalbox').dataset.spip_model;
							
							if (json) {
								const description = JSON.parse(json);
								
								editor.chain().focus().insertSpipModel(description).run();
							}
						}
						
						//~ const { state } = editor;
						//~ const { $from, empty } = state.selection;
						//~ const node = empty && $from.nodeAfter;
						
						//~ // Si on édite un modèle existant
						//~ if (node && node.type.name === 'spip_model') {
							//~ // charger form de config pour node.attrs.spip_model
							//~ jQuery('#modalbox_content').load(
								//~ `/spip.php?page=model_edit&id=${node.attrs.spip_model.id}`,
								//~ (response, status) => {
									//~ // après submit du formulaire, récupérer JSON
									//~ jQuery('#modal_form').on('submit', (e) => {
										//~ e.preventDefault();
										//~ const attrs = ''/* sérialiser champs en JSON */;
										//~ editor
											//~ .chain()
											//~ .focus()
											//~ .updateSpipModel(attrs)
											//~ .run();
										//~ jQuery.modalbox.close();
									//~ });
								//~ }
							//~ );
						//~ }
						//~ // Sinon c'est une création
						//~ else {
							//~ // liste des modèles => choix modèle
							//~ jQuery('.model-item').on('click', function () {
								//~ const type = jQuery(this).data('type');
								//~ jQuery('#modal_content').load(
									//~ `/spip.php?page=model_edit&type=${type}`,
									//~ () => {
										//~ jQuery('#modal_form').on('submit', (e) => {
											//~ e.preventDefault();
											//~ const attrs = ''/* sérialiser champs */;
											//~ editor
												//~ .chain()
												//~ .focus()
												//~ .insertSpipModel(attrs)
												//~ .run();
											//~ jQuery.modalbox.close();
										//~ });
									//~ }
								//~ );
							//~ });
						//~ }
					},
				}
			);
		});
		
		// Insertion
		container.appendChild(this.btn);
	}
}

export default SpipModelButton;
