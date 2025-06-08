import { Node, mergeAttributes, nodeInputRule, nodePasteRule } from '@tiptap/core';
import { Plugin } from 'prosemirror-state';

const spip_model_pattern_input = /(<([a-z_-]{3,})\s*([0-9]*)\s*([|](?:<[^<>]*>|[^>])*?)?\s*>)$/is;
const spip_model_pattern_paste = /(<([a-z_-]{3,})\s*([0-9]*)\s*([|](?:<[^<>]*>|[^>])*?)?\s*>)/isg;
const spip_model_pattern_parse_inline = /^(<([a-z_-]{3,})\s*([0-9]*)\s*([|](?:<[^<>]*>|[^>])*?)?\s*>)/is;
const spip_model_pattern_parse_block = /^(<([a-z_-]{3,})\s*([0-9]*)\s*([|](?:<[^<>]*>|[^>])*?)?\s*>)$/is;

// Générer les attributs complets à partir des données centrales
export function generateSpipModelAttributes(options) {
	const { name, id, params = {} } = options;

	// Construire raw_params et full
	const paramStrings = Object.entries(params).map(([k, v]) => v==null ? `${k}` : `${k}=${v}`);
	const raw_params = paramStrings.length ? '|' + paramStrings.join('|') : '';
	const idPart = id ? id : '';
	const full = `<${name}${idPart}${raw_params}>`;

	// Attributs complets
	const attrs = {
		full,
		name,
		id:   idPart,
		raw_params,
		params: paramStrings,
	};
	
	return attrs;
};

const SpipModel = Node.create({
  name: 'spip_model',
  
  group: 'inline',  // Use 'block' if you want it to be a block-level node instead
  inline: true,     // This allows it to be inline within text, or set to false for a block-level node
  atom: true,       // Treat it as a single, unbreakable unit
  
  parseHTML() {
    return [
      {
        tag: 'span[data-spip_model]',
      },
    ];
  },
	
	// Fallback basique quand il n'y a pas de NodeView
  renderHTML({ node, HTMLAttributes }) {
    //~ return ['span', mergeAttributes(HTMLAttributes, { 'data-spip_model': '' }), 0];
    return ['span', {...HTMLAttributes, class: 'spip-model'},
			'<',
			node.attrs.spip_model.name,
			node.attrs.spip_model.id ? ['span', {class: 'spip-model_id'}, node.attrs.spip_model.id] : '',
			node.attrs.spip_model.raw_params ? ['span', {class: 'spip-model_params'}, node.attrs.spip_model.raw_params] : '',
			'>'
    ];
  },
  
  // Rendu plus complexe en NodeView
	addNodeView() {
		return ({ editor, node, getPos, HTMLAttributes, decorations, extension }) => {
			const { view } = editor;
			const attrsJSON = JSON.stringify(node.attrs.spip_model);
			// conteneur principal
			const dom = document.createElement('div');

			// appel AJAX SPIP pour récupérer le HTML compilé
			const { full } = node.attrs.spip_model;
			const formData = new FormData();
			formData.append('modele', full);
			formData.append('champ', '');
			formData.append('objet', '');
			fetch(window.spipConfig.markdown_editor.url_previsu, {
				method: 'POST',
				body: formData,
				credentials: 'same-origin'
			})
				.then(response => {
					if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
					return response.text();
				})
				.then(html => {
					const temp = document.createElement('div');
					let real_parent; // le vrai parent du modèle à afficher
					let root = null;
					temp.innerHTML = html.trim();
					
					if (temp.childNodes.length === 1 && temp.firstChild.nodeType === 1) {
						// Un seul élément racine
						real_parent = temp.firstChild;
						dom.appendChild(real_parent);
						dom.style.display = 'contents'; // ne rien afficher du parent pour se concentrer sur l'intérieur
					} else {
						// Plusieurs racines : encapsuler
						while (temp.firstChild) {
							dom.appendChild(temp.firstChild);
							real_parent = dom;
						}
					}
					real_parent.classList.add('spip-model_compiled');
					real_parent.setAttribute('data-spip_model', attrsJSON);
					real_parent.contentEditable = 'false'; // empêche l’édition interne
					
					// Désactiver du clavier tous les éléments interactifs
					Array.from(real_parent.querySelectorAll(`
						a[href],
						button,
						input,
						select,
						textarea,
						[contenteditable],
						[tabindex]
					`)).forEach(el => {
						// interdit la mise au focus
						el.tabIndex = -1;
						// pour les formulaires
						if (el.disabled !== undefined) {
							el.disabled = true;
						}
					});

					// Bouton "Modifier"
					const btn = document.createElement('button');
					btn.type = 'button';
					btn.className = 'btn_mini spip-model__btn';
					btn.textContent = 'Modifier';
					btn.addEventListener('click', () => {
						// Replacer le curseur dans l'éditeur sur le node
						editor.commands.setTextSelection(getPos());
						
						// URL de base pour appeler la box
						let url_box = window.spipConfig.markdown_editor.url_modeles + '&modalbox=oui';
						
						// On rajoute les infos du modèle déjà là
						url_box = parametre_url(url_box, 'modele', node.attrs.spip_model.name);
						url_box = node.attrs.spip_model.id ? parametre_url(url_box, 'id_modele', node.attrs.spip_model.id) : url_box;
						url_box += encodeURI(node.attrs.spip_model.raw_params.replaceAll('|', '&'));
						
						// Ouvre la modalbox SPIP
						jQuery.modalbox(
							url_box,
							{
								type: 'ajax',
								sideBar: 'end',
								className: 'lat popin',
								onClose: (event) => {
									const modele = event.target.querySelector('#code_modele_modalbox');
									
									// Si on trouve le champ
									if (modele && modele.dataset.spip_model) {
										const attrs = generateSpipModelAttributes(JSON.parse(modele.dataset.spip_model));
										
										// On met à jour le node
										view.dispatch(
											view.state.tr.setNodeMarkup(getPos(), undefined, {
												spip_model: attrs
											})
										);
										
										// On remet le focus
										editor.commands.focus();
									}
								}
							}
						);
						
						return true;
					});
					
					// On insère le bouton dans le bon parent
					real_parent.appendChild(btn);
				})
				.catch(error => {
					console.warn('Erreur lors de la prévisualisation du modèle SPIP :', error);
					// Fallback : censé repasser au renderHTML quand c'est vide
					dom.classList.add('spip-model_fallback');
					dom.innerHTML = node.attrs.spip_model.full;
				});
			
			return {
				dom,
				contentDOM: null, // on ne veut pas d’édition interne
			};
		};
	},

  addAttributes() {
    return {
      spip_model: {
        default: null,
        parseHTML: (element) => {
					return JSON.parse(element.getAttribute('data-spip_model'));
				},
        renderHTML: (attributes) => {
          return {
            'data-spip_model': JSON.stringify(attributes.spip_model),
          };
        },
      },
    };
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: spip_model_pattern_input,
        type: this.type,
        getAttributes: (match) => {
					return {
						spip_model: {
              full: match[0],
              name: match[2],
              id: match[3],
              raw_params: match[4],
              params: match[4] ? match[4].split('|').slice(1) : [],
            },
          }
        },
      }),
    ];
  },
  
  addPasteRules() {
    return [
      nodePasteRule({
        find: spip_model_pattern_paste,
        type: this.type,
        getAttributes: (match) => {
					return {
						spip_model: {
              full: match[0],
              name: match[2],
              id: match[3],
              raw_params: match[4],
              params: match[4] ? match[4].split('|').slice(1) : [],
            },
          }
        },
      }),
    ]
  },
  
	addCommands() {
		return {
			// Insérer un nouveau modèle
			insertSpipModel:
			(options) =>
			({ commands, state }) => {
				// Reconstruire les attributs complets à partir des options simplifiés de la commande
				const attrs = generateSpipModelAttributes(options);

				// On récupère la position courante du curseur
				const pos = state.selection.$anchor.pos;
				// On insère la node à cette position
				return commands.insertContentAt(pos, {
					type: this.name,
					attrs: { spip_model: attrs },
				});
			},

			// Mettre à jour la node existante
			updateSpipModel:
      (options) =>
      ({ commands }) => {
				// Reconstruire les attributs complets à partir des options simplifiés de la commande
				const attrs = generateSpipModelAttributes(options);

        // On se sert de la commande updateAttributes
        return commands.updateAttributes(this.name, { spip_model: attrs });
      },
		};
	},
  
  addStorage() {
    return {
      markdown: {
        // Serialize this node to a Markdown string
        serialize: (state, node) => {
          state.write(node.attrs.spip_model.full || '');
        },
        // Parse a Markdown string to this node
        parse: {
					setup(markdownit) {
						// Ajouter une règle markdown-it block pour reconnaitre les modèles SPIP tous seuls sur une ligne (hors paragraphe)
						markdownit.block.ruler.before(
							'html_block',           // avant la règle html_block native
							'spip_model_block',     // nom de votre rule
							(state, startLine, endLine, silent) => {
								const openingLine = state.bMarks[startLine] + state.tShift[startLine];
								const closingLine = state.eMarks[startLine];
								const lineText = state.src.slice(openingLine, closingLine).trim();

								// si ce n'est pas un modèle on sort
								const regex = spip_model_pattern_parse_block;
								const match = lineText.match(regex);
								if (!match) return false;

								if (!silent) {
									// Ouvrir un paragraphe
									state.push('paragraph_open', 'p', 1);
									
									// on pousse d'abord un token open
									const token = state.push('spip_model', 'span', 1);
									token.block = true;
									token.content = match[0];
									token.meta = {
										full: match[0],
										name: match[2],
										id: match[3],
										raw_params: match[4],
										params: match[4] ? match[4].split('|').slice(1) : [],
									};
									token.meta.htmldata = JSON.stringify(token.meta);

									// on crée aussi un token close (auto-fermeture atomique)
									state.push('spip_model_close', 'span', -1);
									
									// Fermer le paragraphe
									state.push('paragraph_close', 'p', -1);
								}

								// on passe à la ligne suivante
								state.line = startLine + 1;
								return true;
							}
						);
						
						// Ajouter une règle markdown-it inline pour reconnaitre les modèles SPIP à l'intérieur des paragraphes
						markdownit.inline.ruler.before('emphasis', 'spip_model', (state, silent) => {
							const regex = spip_model_pattern_parse_inline;
							const match = state.src.slice(state.pos).match(regex);

							if (!match) return false;

							if (!silent) {
								// Création d'un token pour le modèle
								const token = state.push('spip_model', '', 0);
								token.content = match[0];
								token.meta = {
									full: match[0],
									name: match[2],
									id: match[3],
									raw_params: match[4],
									params: match[4] ? match[4].split('|').slice(1) : [],
								};
								token.meta.htmldata = JSON.stringify(token.meta);
							}

							state.pos += match[0].length;
							return true;
						});

						// Générer le HTML final qui remplace le modèle trouvé, TipTap reconnaitra et transformera en Node dans son arbre
						markdownit.renderer.rules.spip_model = function (tokens, idx) {
							const token = tokens[idx];
							let span = document.createElement('span');
							span.textContent = token.meta.full;
							span.setAttribute('data-spip_model', token.meta.htmldata);
							return span.outerHTML;
						};
						// et on ignore spip_model_close
						markdownit.renderer.rules.spip_model_close = () => '';
					},
				},
      },
    };
  },
});

export default SpipModel;
