import Link from '@tiptap/extension-link';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

const spipLinkKey = new PluginKey('spipLinkPlugin');

const SpipLink = Link.extend({
	addAttributes() {
		return {
			...this.parent?.(),
			spip_autotitle: {
				default: null,
				parseHTML: element => element.getAttribute('data-spip_autotitle'),
				renderHTML: attrs => {
					if (!attrs.spip_autotitle) return {};
					return { 'data-spip_autotitle': attrs.spip_autotitle };
				},
			},
		};
	},
	
	addProseMirrorPlugins() {
		// Garder l'éditeur complet en mémoire
		const editor = this.editor;
		
		return [
			new Plugin({
				// on va garder ces deux variables en closure
				view(editorView) {
					const linkMark = editorView.state.schema.marks.link;
					const cache    = new Map();
					let decos      = DecorationSet.empty;

					return {
						// update est appelé sur chaque transaction
						update(view, prevState) {
							const widgets = [];

							view.state.doc.descendants((node, pos) => {
								if (!node.isText) return;
								const m = linkMark.isInSet(node.marks) &&
													node.marks.find(m => m.type === linkMark);
								if (!m) return;

								const { href } = m.attrs;
								const isEmpty  = node.text === '' || node.text === '\u00A0';

								// 1) si vide et pas en cache → fetch
								if (isEmpty && !cache.has(href)) {
									cache.set(href, null);
									fetch(window.spipConfig.markdown_editor.url_analyser_lien, {
										method: 'POST',
										credentials: 'same-origin',
										body: new URLSearchParams({ url: href }),
									})
										.then(r => r.json())
										.then(data => {
											cache.set(href, data.titre || data.url || href);
											editorView.updateState(editorView.state);
										})
										.catch(() => {
											cache.set(href, href);
											editorView.updateState(editorView.state);
										});
								}

								// 2) si titre dispo → widget
								const title = cache.get(href);
								if (isEmpty && title) {
									widgets.push(
										Decoration.widget(
											pos + 1,
											() => {
												const span = document.createElement('span');
												span.textContent = title;
												span.contentEditable = 'false';
												return span;
											},
											{ side: -1 }
										)
									);
								}
							});

							editorView.pluginDecos = DecorationSet.create(view.state.doc, widgets);
						}
					};
				},
				// Props déclarées *au même niveau* que view()
				props: {
					decorations(state) {
						const view = editor.view;
            return view.pluginDecos || DecorationSet.empty;
					}
				}
			})
		];
    
		//~ return [
			//~ new Plugin({
				//~ view(editorView) {
					//~ const { state, dispatch } = editorView;
					//~ const linkMark = state.schema.marks.link;
					//~ const cache    = new Map();  // href -> titre SPIP ou null en cours

					//~ return {
						//~ update(view) {
							//~ const { doc, tr } = view.state;
							//~ let transaction = tr;
							//~ let modified    = false;
							//~ const decos     = [];

							//~ // 1 passe unique pour fetch/cache + collecter les widgets
							//~ doc.descendants((node, pos) => {
								//~ if (!node.isText) return;
								//~ const m = linkMark.isInSet(node.marks) &&
													//~ node.marks.find(m => m.type === linkMark);
								//~ if (!m) return;

								//~ const { href } = m.attrs;
								//~ const isEmpty  = node.text === '' || node.text === '\u00A0';

								//~ // Lien vide non encore cached → fetcher
								//~ if (isEmpty && !cache.has(href)) {
									//~ cache.set(href, null);
									//~ fetch(window.spipConfig.markdown_editor.url_analyser_lien, {
										//~ method: 'POST',
										//~ credentials: 'same-origin',
										//~ body: new URLSearchParams({ url: href }),
									//~ })
										//~ .then(r => r.json())
										//~ .then(data => {
											//~ cache.set(href, data.titre || data.url || href);
											//~ editorView.updateState(editorView.state);
										//~ })
										//~ .catch(() => {
											//~ cache.set(href, href);
											//~ editorView.updateState(editorView.state);
										//~ });
								//~ }

								//~ // Si titre dispo, on prépare la widget
								//~ if (isEmpty && cache.get(href)) {
									//~ const titre = cache.get(href);
									//~ decos.push(
										//~ Decoration.widget(
											//~ pos + 1,
											//~ () => {
												//~ const span = document.createElement('span');
												//~ span.textContent = titre;
												//~ span.setAttribute('contenteditable', 'false');
												//~ return span;
											//~ },
											//~ { side: -1 }
										//~ )
									//~ );
								//~ }
							//~ });

							//~ // 2. Appliquer les widgets (pas besoin de transaction pour ça)
							//~ const decorationSet = DecorationSet.create(doc, decos);

							//~ // stocker dans un endroit pour que TipTap les récupère
							//~ this.decorations = decorationSet;

							//~ // 3. Rerendre les décorations
							//~ editorView.updateState(view.state); // force la mise à jour des props
						//~ }
					//~ };
				//~ },

				//~ props: {
					//~ decorations(state) {
						//~ return this.decorations || DecorationSet.empty;
					//~ }
				//~ }
			//~ })
		//~ ];
		
		//~ return [
			//~ new Plugin({
				//~ key: spipLinkKey,
				//~ view(editorView) {
					//~ const { state, dispatch } = editorView;
					//~ const linkMark = state.schema.marks.link;
					//~ const cache = new Map(); // href -> vrai href + titre SPIP
					
					//~ return {
						//~ update(view, prevState) {
							//~ const { doc, tr } = view.state;
							//~ const pluginState = spipLinkKey.getState(view.state);

							//~ doc.descendants((node, pos) => {
								//~ // on ne s'intéresse qu'aux noeuds texte
								//~ if (!node.isText) return;
								//~ // linkMark dans ses marks ?
								//~ const mark = linkMark.isInSet(node.marks)	&& node.marks.find(m => m.type === linkMark);
								//~ if (!mark) return;
								
								//~ const { href, spip_autotitle } = mark.attrs;
								//~ const isEmpty = (node.text === '' || node.text === '\u00A0');
								
								//~ // texte vide ou NBSP et format d'un raccourci SPIP
								//~ if (isEmpty && href.search(/^[a-z]+[0-9]+$/) !== -1) {
									//~ if (cache.has(href)) {
										//~ if (spip_autotitle !== cache.get(href).titre) {
											//~ const tr2 = view.state.tr
												//~ .removeMark(pos, pos + node.nodeSize, linkMark)
												//~ .addMark(
													//~ pos,
													//~ pos + node.nodeSize,
													//~ linkMark.create({ href, spip_autotitle: cache.get(href).titre })
												//~ );
											//~ dispatch(tr2);
										//~ }
									//~ }
									//~ else {
										//~ // Marque "en cours"
										//~ cache.set(href, null);
										//~ // on fetch puis on dispatch un tr.setMeta
										//~ fetch(window.spipConfig.markdown_editor.url_analyser_lien, {
											//~ method: 'POST',
											//~ credentials: 'same-origin',
											//~ body: new URLSearchParams({ url: href }),
										//~ })
											//~ .then(r => r.json())
											//~ .then(data => {
												//~ const title = data.titre || data.url || href;
												//~ cache.set(href, data);
												
												//~ const tr2 = view.state.tr
													//~ .removeMark(pos, pos + node.nodeSize, linkMark)
													//~ .addMark(
														//~ pos,
														//~ pos + node.nodeSize,
														//~ linkMark.create({ href, spip_autotitle: title })
													//~ );
												//~ dispatch(tr2);
											//~ })
											//~ .catch(() => {
												//~ cache.set(href, {titre:href, url:href});
												
												//~ const tr2 = view.state.tr
													//~ .removeMark(pos, pos + node.nodeSize, linkMark)
													//~ .addMark(
														//~ pos,
														//~ pos + node.nodeSize,
														//~ linkMark.create({ href, spip_autotitle: href })
													//~ );
												//~ dispatch(tr2);
											//~ });
									//~ }
								//~ }
								//~ // Sinon on vire l'attribut
								//~ else if (spip_autotitle !== null) {
									//~ const tr2 = view.state.tr
										//~ .removeMark(pos, pos + node.nodeSize, linkMark)
										//~ .addMark(
											//~ pos,
											//~ pos + node.nodeSize,
											//~ linkMark.create({ href })
										//~ );
									//~ dispatch(tr2);
								//~ }
							//~ });
						//~ },
					//~ };
				//~ },
			//~ }),
		//~ ];
	},
	
	/**
	 * Gérer les liens vides dans le markdown source, autorisé par SPIP : [](article123)
	 * 
	 * Dans ce cas on ajoute un espace pour que Tiptap génère quand même un objet mark et du HTML
	 * car quand un texte est totalement vide ça génère rien.
	 */
	addStorage() {
		return {
			markdown: {
				parse: {
					setup(markdownit) {
						// Avant la règle standard link, détecter les liens avec texte vide
						markdownit.inline.ruler.before('link', 'empty_link', (state, silent) => {
							const src = state.src.slice(state.pos);
							const match = src.match(/^\[\s*\]\(([^)]+)\)/);
							if (!match) return false;
							if (!silent) {
								const href = match[1];
								// on insère un token link avec un contenu U+200B
								const tokenOpen  = state.push('link_open', 'a', 1);
								tokenOpen.markup = '[';
								tokenOpen.attrs = [['href', href]];

								const tokenText  = state.push('text', '', 0);
								tokenText.content = '\u00A0';

								const tokenClose = state.push('link_close', 'a', -1);
								tokenClose.markup = ')';
							}
							state.pos += match[0].length;
							return true;
						});
					},
				},
			},
		};
	}

});

export default SpipLink;
