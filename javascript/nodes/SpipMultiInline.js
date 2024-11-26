import { Node, mergeAttributes, nodeInputRule, nodePasteRule } from '@tiptap/core';
import { Plugin, TextSelection } from 'prosemirror-state';

const SpipMultiInline = Node.create({
  name: 'spip_multi_inline',
	priority: 600, // Charger avant les modèles
	
  group: 'inline',
  inline: true,
  atom: false,
	// Le contenu interne peut être du contenu inline (texte formaté, etc.)
	content: 'inline*',
	
	//~ selectable: true,
	//~ allowGapCursor: true,
	
  // Balise HTML utilisée pour représenter l'élément dans l'éditeur
  // Utilisation d'un <span> pour représenter l'ensemble du contenu <multi></multi>
  parseHTML() {
    return [
      {
        tag: 'span[data-spip-multi-inline]',
      },
    ];
  },

  // Génère le HTML dans l'éditeur
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-spip-multi-inline': '', class: 'spip-multi-inline'}), 0];
  },

  // Détection de l'entrée de la balise <multi>
  addInputRules() {
    return [
			nodeInputRule({
				find: /(<multi>)$/,  // Détecte la séquence <multi>
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
          //~ state.write(`<multi>${node.content}</multi>`);
          state.write(`<multi>`);
          state.renderInline(node);
          state.write(`</multi>`);
        },
        parse: {
          setup(markdownit) {
            markdownit.inline.ruler.before('emphasis', 'spip_multi_inline', function (state, silent) {
              // Détection de la balise <multi> et son contenu
              const regex = /<multi>(.*?)<\/multi>/is;
              const match = state.src.slice(state.pos).match(regex);
              if (!match) return false;

              if (!silent) {
                const token = state.push('spip_multi_inline', '', 0);
                token.content = match[1]; // Contenu interne à la balise
                
                // Utilisation de la fonction de parsing inline
                state.md.inline.parse(token.content, state.md, state.env, token.children = [])
              }
              state.pos += match[0].length;
              
              return true;
            });

            markdownit.renderer.rules.spip_multi_inline = function (tokens, idx, options, env, self) {
							const token = tokens[idx]
              const content = token.children ? self.renderInline(token.children, options, env) : token.content
              return `<span data-spip-multi-inline class="spip-multi-inline">${content}</span>`;
            }
          },
        },
      },
    };
  },
})

export default SpipMultiInline;
