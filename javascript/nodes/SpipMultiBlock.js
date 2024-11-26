import { Node, mergeAttributes, textblockTypeInputRule, nodePasteRule } from '@tiptap/core';
import { Plugin, TextSelection } from 'prosemirror-state';

const SpipMultiBlock = Node.create({
  name: 'spip_multi_block',
	priority: 600, // Charger avant les modèles
	
  group: 'block',
	content: 'block+',
	defining: true,
	
	//~ selectable: true,
	//~ allowGapCursor: true,
	
  // Balise HTML utilisée pour représenter l'élément dans l'éditeur
  // Utilisation d'un <span> pour représenter l'ensemble du contenu <multi></multi>
  parseHTML() {
    return [
      {
        tag: 'div[data-spip-multi-block]',
      },
    ];
  },

  // Génère le HTML dans l'éditeur
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-spip-multi-block': '', class: 'spip-multi-block'}), 0];
  },

  // Détection de l'entrée de la balise <multi>
  addInputRules() {
    return [
			textblockTypeInputRule({
				find: /^(<multi>)$/, 
				type: this.type,
			})
    ];
  },
  
	// Règles de collage pour détecter les balises <multi> lors du collage de texte
	addPasteRules() {
		return [
			nodePasteRule({
				find: /<multi>(.*?)<\/multi>/gis,
				type: this.type,
				getAttributes: match => ({
          content: match[1], // Le contenu entre les balises
        }),
			}),
		]
	},
  
  // Plugin ProseMirror pour gérer l'affichage et le comportement dans l'éditeur
  addProseMirrorPlugins() {
    return [
			new Plugin({
        props: {
          handleClickOn(view, pos, node, nodePos, event) {
            const { state, dispatch } = view;
            const { $from } = state.selection;
            
            // Si on clique sur une node vide, on veut entrer dans cette node
            if (node.type.name === 'spip_multi_inline' && node.content.size === 0) {
              const resolvedPos = state.tr.doc.resolve(pos);
							console.log(resolvedPos);
              dispatch(
                state.tr.setSelection(TextSelection.near(resolvedPos, 1)) // "1" pour se positionner à l'intérieur
              );
              return true;
            }

            return false;
          },
        },
      }),
    ];
  },

  // Fonction de rendu Markdown pour conserver les balises <multi> et les marqueurs de langue
  addStorage() {
    return {
      markdown: {
        serialize: (state, node) => {
          // Convertir les entités HTML de retour en balises Markdown valides
          state.write(`<multi>\n`);
          state.renderContent(node);
          state.write(`</multi>\n\n`);
        },
				parse: {
					setup: (md) => {
						md.block.ruler.before('code', 'spip_multi_block', (state, startLine, endLine, silent) => {
							let pos = state.bMarks[startLine] + state.tShift[startLine];
							let max = state.eMarks[startLine];

							// Detect opening tag <multi>
							if (state.src.slice(pos, max).trim() !== '<multi>') return false;

							// Find closing tag </multi>
							let nextLine = startLine + 1;
							while (nextLine < endLine) {
								pos = state.bMarks[nextLine] + state.tShift[nextLine];
								max = state.eMarks[nextLine];

								if (state.src.slice(pos, max).trim() === '</multi>') {
									state.line = nextLine + 1;

									const token = state.push('spip_multi_block_open', 'div', 1);
									token.block = true;
									token.attrs = [['data-spip-multi-block', '']];
									token.map = [startLine, state.line];

									state.md.block.tokenize(state, startLine + 1, nextLine);

									state.push('spip_multi_block_close', 'div', -1);
									return true;
								}

								nextLine++;
							}

							return false;
						});

						// Renderer rule for `spip_multi_block`
						md.renderer.rules.spip_multi_block_open = (tokens, idx) => {
							return `<div data-spip-multi-block>\n`;
						};

						md.renderer.rules.spip_multi_block_close = () => {
							return `</div>\n`;
						};
					},
				},
      },
    };
  },
})

export default SpipMultiBlock;
