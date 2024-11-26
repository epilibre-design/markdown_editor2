import { Node, textblockTypeInputRule, textPasteRule } from '@tiptap/core';

const SpipHtml = Node.create({
	name: 'spip_html',
	priority: 500, // Charger avant les modèles

	group: 'block',
	content: 'text*', // Contenir du texte brut
	marks: '', // Pas de marques à l'intérieur du HTML brut
	code: true, // Style similaire à un bloc de code
	defining: true,
	isolating: true,

	parseHTML() {
		return [
			{
				tag: 'pre[data-spip-html]',
			},
		];
	},

	renderHTML({ node, HTMLAttributes }) {
		return ['pre', { 'data-spip-html': '', class: 'spip-html' }, ['code', 0]];
	},

	addInputRules() {
		return [
			textblockTypeInputRule({
        find: /<html>/is,
        type: this.type,
        getAttributes: () => ({ content: '' }),
      }),
		];
	},

	addPasteRules() {
		return [
			textPasteRule({
				find: /<html>(.*?)<\/html>/isg,
				type: this.type,
				getAttributes: (match) => {
					return {
						content: match[1],
					}
				},
			}),
		]
	},

	addStorage() {
		return {
			markdown: {
				serialize: (state, node) => {
					state.write(`<html>\n${node.textContent}\n</html>\n\n`);
				},
				parse: {
					setup(markdownit) {
						markdownit.block.ruler.before('code', 'spip_html', function (state, startLine, endLine, silent) {
							let pos = state.bMarks[startLine] + state.tShift[startLine];
							let max = state.eMarks[startLine];

							// Vérifier si la ligne commence par `<html>`
							if (state.src.slice(pos, max).trim().startsWith('<html>')) {
								if (silent) {
										return true;
								}

								let content = '';
								let nextLine = startLine;

								// Récupérer la partie après la balise <html>, s'il y en a sur cette ligne
								let lineContent = state.src.slice(pos + 6, max); // 6 est la longueur de `<html>`
								
								// Vérifier si la balise de fin est aussi sur cette ligne
								let endTagIndex = lineContent.indexOf('</html>');
								if (endTagIndex !== -1) {
										// Si oui, tout est sur la même ligne, on extrait le contenu entre les balises
										content = lineContent.slice(0, endTagIndex).trim();
										state.line = nextLine + 1;

										// Créer le token pour ce bloc
										const token = state.push('spip_html', '', 0);
										token.content = content;
										token.map = [startLine, state.line];
										token.block = true;

										return true;
								}

								// Si la balise de fin n'est pas sur cette ligne, continuer à accumuler les lignes suivantes
								content += lineContent.trim();

								while (nextLine < endLine) {
									nextLine++;

									pos = state.bMarks[nextLine] + state.tShift[nextLine];
									max = state.eMarks[nextLine];
									lineContent = state.src.slice(pos, max);

									// Vérifier si cette ligne contient `</html>`
									endTagIndex = lineContent.indexOf('</html>');
									if (endTagIndex !== -1) {
										// Ajouter le contenu jusqu'à la balise de fermeture
										content += '\n' + lineContent.slice(0, endTagIndex).trim();
										state.line = nextLine + 1;
										
										// Créer le token pour ce bloc
										const token = state.push('spip_html', '', 0);
										token.content = content.trim(); // Enlever les espaces supplémentaires
										token.map = [startLine, state.line];
										token.block = true;

										return true;
									}

									// Ajouter cette ligne au contenu
									content += '\n' + lineContent;
								}

								return false; // Pas de balise de fin trouvée
							}

							return false; // Pas de balise d'ouverture trouvée
						});
						
						// Rendu HTML dans le markdownit renderer
						markdownit.renderer.rules.spip_html = function (tokens, idx) {
							const token = tokens[idx];
							let pre = document.createElement('pre');
							let code = document.createElement('code');
							
							pre.setAttribute('class', 'spip-html');
							pre.setAttribute('data-spip-html', '');
							
							code.textContent = token.content;
							pre.appendChild(code);
							return pre.outerHTML;
						};
					},
				},
			},
		};
	},

	renderText({ node }) {
		return `<html>${node.attrs.content}</html>`;
	},
});

export default SpipHtml;
