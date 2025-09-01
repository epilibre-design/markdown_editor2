import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Typography from '@tiptap/extension-typography';
import InvisibleCharacters, { HardBreakNode } from '@tiptap/extension-invisible-characters'
import SpipLink from './marks/SpipLink';
import SpipMultiInline from './nodes/SpipMultiInline';
import SpipMultiBlock from './nodes/SpipMultiBlock';
import SpipLang from './nodes/SpipLang';
import SpipHtml from './nodes/SpipHtml';
import SpipModel from './nodes/SpipModel';
import Markdown4Spip from './extensions/Markdown4Spip';
import SpipTrailingNode from './nodes/SpipTrailingNode';
import Toolbar from './ui/Toolbar.js';

export function launch_markdown_editor() {
	// On boucle sur tous les champs censés être des textareas avec du markdown et pas déjà pris en charge
	document.querySelectorAll('[class*="inserer_md_barre"]:not(.md-editor__raw),  [data-md-editor-toolbar]:not(.md-editor__raw)').forEach((textarea, index) =>  {
		// On ajoute immédiatement une classe pour dire que c'est pris en charge
		textarea.classList.add('md-editor__raw');
		
		// On crée un bloc qui contiendra tout : boutons, wysiwyg, et textarea brut
		const editor_wrapper = document.createElement('div');
		editor_wrapper.classList.add('md-editor');
		
		// Conteneur pour le menu des boutons
		const editor_menu = document.createElement('div');
		editor_menu.classList = 'md-editor__menu';
		editor_wrapper.insertBefore(editor_menu, null);
		
		// Conteneur pour l'éditeur tiptap/prosemirror lui-même
		const editor_wysiwyg = document.createElement('div');
		editor_wysiwyg.classList.add('md-editor__wysiwyg');
		editor_wrapper.insertBefore(editor_wysiwyg, null);
		
		// On place le wrapper à l'endroit où il y avait le textarea
		textarea.parentNode.insertBefore(editor_wrapper, textarea);
		// Et on déplace le textarea dans le wrapper
		editor_wrapper.insertBefore(textarea, null);
		
		// Créer un éditeur pour chacun des champs
		const editor = new Editor({
				element: editor_wysiwyg,
				content: textarea.value,
				extensions: [
						SpipMultiInline,
						SpipMultiBlock,
						SpipLang,
						SpipHtml,
						SpipModel,
						StarterKit.configure({
							heading: {
								levels: [2, 3, 4, 5, 6], // Pas de H1 autorisé dans les textes
							},
							bulletList: {
								HTMLAttributes: { class: 'spip'},
							},
							orderedList: {
								HTMLAttributes: { class: 'spip'},
							},
						}),
						SpipLink.configure({
							openOnClick: false,
							autolink: true,
							defaultProtocol: 'https',
						}),
						Table.configure({
							resizable: true,
							HTMLAttributes: {class: 'spip'},
						}),
						TableRow,
						TableHeader,
						TableCell,
						Subscript,
						Superscript,
						Typography,
						InvisibleCharacters.configure({
							builders: [new HardBreakNode()],
						}),
						Markdown4Spip,
						SpipTrailingNode,
				],
				onUpdate: ({ editor }) => {
					textarea.value = editor.storage.markdown.getMarkdown();
				}
		});
		window.editor=editor;
		
		// Quel type de barre ?
		let toolbar = '';
		if (textarea.classList.contains('inserer_md_barre_edition')) {
			toolbar = 'edition';
		}
		else if (textarea.classList.contains('inserer_md_barre_forum')) {
			toolbar = 'forum';
		}
		else if (datatoolbar = textarea.getAttribute('data-md-editor-toolbar') && typeof datatoolbar == 'string') {
			toolbar = datatoolbar;
		}
		// Si on trouve cette toolbar dans spipConfig
		toolbar = window.spipConfig.markdown_editor.toolbars[toolbar] || null;
		
		// Si donc on a bien une description de barre d'outils
		if (toolbar && typeof toolbar === 'object') {
			new Toolbar(editor, toolbar, editor_menu);
		}
		
		// On met aussi à jour le TipTap quand c'est le textarea qui est édité
		textarea.addEventListener('input', () => {
			editor.commands.setContent(textarea.value);
		});
	});
}

launch_markdown_editor();
onAjaxLoad(launch_markdown_editor);
