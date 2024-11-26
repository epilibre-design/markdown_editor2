import { Node, mergeAttributes, nodeInputRule, nodePasteRule } from '@tiptap/core';

const spip_lang_pattern_input = /(\[([a-z]{2,3})\])$/i;
const spip_lang_pattern_paste = /\[([a-z]{2,3})\]/ig;
const spip_lang_pattern_parse = /^\[([a-z]{2,3})\]/i;

// Node pour les marqueurs de langue (ex: [fr], [en], etc.)
const SpipLang = Node.create({
  name: 'spip_lang',

  inline: true,
  group: 'inline',
  atom: true,

  addAttributes() {
    return {
      language: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-spip-lang]',
        getAttrs: (dom) => ({ language: dom.getAttribute('data-spip-lang') }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', { 'data-spip-lang': HTMLAttributes.language, class: 'spip-lang' }, `[${HTMLAttributes.language}]`];
  },
	
	addInputRules() {
    return [
      nodeInputRule({
        find: spip_lang_pattern_input,
        type: this.type,
        getAttributes: (match) => {
					console.log(match);
					return {
						language: match[2],
          }
        },
      }),
    ];
  },
  
  addPasteRules() {
    return [
      nodePasteRule({
        find: spip_lang_pattern_paste,
        type: this.type,
        getAttributes: (match) => {
					return {
						language: match[1],
          }
        },
      }),
    ]
  },
  
  addStorage() {
    return {
      markdown: {
        serialize: (state, node) => {
          state.write(`[${node.attrs.language}]`);
        },
        parse: {
          setup(markdownit) {
            markdownit.inline.ruler.before('emphasis', 'spip_lang', function (state, silent) {
              const regex = spip_lang_pattern_parse;
              const match = state.src.slice(state.pos).match(regex);
              if (!match) return false;

              if (!silent) {
                const token = state.push('spip_lang', '', 0);
                token.content = match[0];
                token.meta = {
									'lang': match[1],
								};
              }
              
              state.pos += match[0].length;
              return true;
            })

            markdownit.renderer.rules.spip_lang = function (tokens, idx) {
              const token = tokens[idx];
              return `<span data-spip-lang="${token.meta.lang}">[${token.meta.lang}]</span>`;
            }
          },
        },
      },
    };
  },
})

export default SpipLang;
