import { Node, mergeAttributes, nodeInputRule, nodePasteRule } from '@tiptap/core';
import { Plugin } from 'prosemirror-state';

const spip_model_pattern_input = /(<([a-z_-]{3,})\s*([0-9]*)\s*([|](?:<[^<>]*>|[^>])*?)?\s*>)$/is;
const spip_model_pattern_paste = /(<([a-z_-]{3,})\s*([0-9]*)\s*([|](?:<[^<>]*>|[^>])*?)?\s*>)/isg;
const spip_model_pattern_parse_inline = /^(<([a-z_-]{3,})\s*([0-9]*)\s*([|](?:<[^<>]*>|[^>])*?)?\s*>)/is;
const spip_model_pattern_parse_block = /^(<([a-z_-]{3,})\s*([0-9]*)\s*([|](?:<[^<>]*>|[^>])*?)?\s*>)$/is;

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

  addAttributes() {
    return {
      spip_model: {
        default: null,
        parseHTML: (element) => JSON.parse(element.getAttribute('data-spip_model')),
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
        const { name, id, params = {} } = options;

        // Reconstruire full, raw_params, paramStrings…
        const paramStrings = Object.entries(params).map(([k, v]) => v==null ? `${k}` : `${k}=${v}`);
        const raw_params   = paramStrings.length ? '|' + paramStrings.join('|') : '';
        const idPart       = id ? id : '';
        const full         = `<${name}${idPart}${raw_params}>`;
        const attrs = { full, name, id: idPart, raw_params, params: paramStrings };

        // On se sert de la commande updateAttributes
        return commands.updateAttributes(this.name, { spip_model: attrs });
      },
		};
	},
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleClickOn(view, pos, node, nodePos, event) {
            if (node.type.name === 'spip_model') {
							// URL de base pour appeler la box
							var url_box = window.spipConfig.markdown_editor.url_modeles + '&modalbox=oui';
							
							// On rajoute les infos du modèle déjà là
							url_box = parametre_url(url_box, 'modele', node.attrs.spip_model.name);
							url_box = node.attrs.spip_model.id ? parametre_url(url_box, 'id_modele', node.attrs.spip_model.id) : url_box;
							url_box += node.attrs.spip_model.raw_params.replaceAll('|', '&');
							
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
										if (modele) {
											const json = event.target.querySelector('#code_modele_modalbox').dataset.spip_model;
											
											if (json) {
												const description = JSON.parse(json);
												
												editor.chain().focus().updateSpipModel(description).run();
											}
										}
									}
								}
							);
              
              return true;
            }
            
            return false;
          },
        },
      }),
    ];
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
