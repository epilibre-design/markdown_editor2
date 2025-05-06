import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Typography from '@tiptap/extension-typography';
import SpipMultiInline from './nodes/SpipMultiInline';
import SpipMultiBlock from './nodes/SpipMultiBlock';
import SpipLang from './nodes/SpipLang';
import SpipHtml from './nodes/SpipHtml';
import SpipModel from './nodes/SpipModel';
import Markdown4Spip from './extensions/Markdown4Spip';
import SpipTrailingNode from './nodes/SpipTrailingNode';
import Toolbar from './ui/Toolbar.js';

// On boucle sur tous les champs censés être des textareas avec du markdown
document.querySelectorAll('[class*="inserer_md_barre"],  [data-md-editor-toolbar]').forEach((textarea, index) =>  {
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
	
	//~ const commands = [
		//~ { name: "bold", label: "Gras", command: 'toggleBold', disable: true },
		//~ { name: "italic", label: "Italique", command: 'toggleItalic', disable: true },
		//~ { name: "strike", label: "Barré", command: 'toggleStrike', disable: true },
		//~ { name: "code", label: "Code", command: 'toggleCode', disable: true },
		//~ { name: "clear marks", label: "Supprimer les styles", command: 'unsetAllMarks' },
		//~ { name: "clear nodes", label: "Supprimer les nœuds", command: 'setParagraph' },
		//~ { name: "paragraph", label: "Paragraphe", command: 'setParagraph' },
		//~ { name: "heading", label: "H2", command: 'toggleHeading', argument: { level: 2 } },
		//~ { name: "heading", label: "H3", command: 'toggleHeading', argument: { level: 3 } },
		//~ { name: "heading", label: "H4", command: 'toggleHeading', argument: { level: 4 } },
		//~ { name: "heading", label: "H5", command: 'toggleHeading', argument: { level: 5 } },
		//~ { name: "heading", label: "H6", command: 'toggleHeading', argument: { level: 6 } },
		//~ { name: "bulletList", label: "Liste à puce", command: 'toggleBulletList' },
		//~ { name: "orderedList", label: "Liste ordonnée", command: 'toggleOrderedList' },
		//~ { name: "codeBlock", label: "Bloc de code", command: 'toggleCodeBlock' },
		//~ { name: "blockquote", label: "Bloc de citation", command: 'toggleBlockquote' },
		//~ { name: "horizontalRule", label: "Barre de séparation", command: 'setHorizontalRule' },
		//~ { name: "hardBreak", label: "Retour à la ligne", command: 'setHardBreak' },
		//~ { name: "undo", label: "Annuler", command: 'undo', disable: true },
		//~ { name: "redo", label: "Rétablir", command: 'redo', disable: true }
	//~ ]
	
	//~ // Générer les boutons
	//~ for (let i in commands) {
		//~ let c = commands[i]  // get the command definition
		//~ c.button = document.createElement('button');
		//~ c.button.textContent = c.label || c.name;
		//~ c.button.classList.add('btn_secondaire');
		//~ c.button.setAttribute('aria-pressed', 'false');
		
		//~ c.button.onclick = () => { editor.chain().focus()[c.command](c.argument || {}).run(); return false; };
		
		//~ editor_menu.insertBefore(c.button, null);
	//~ }
	
	//~ // Tester si un bouton est actif par rapport au curseur ou à la sélection en cours
	//~ function tester_bouton(editor) {
		//~ for (let i in commands) {
			//~ let c = commands[i];
			 
			//~ if (c.disable) {
				//~ if (editor.can().chain().focus()[c.command]().run()) {
					//~ c.button.removeAttribute("disabled");
				//~ }
				//~ else {
					//~ c.button.setAttribute("disabled", "true");
				//~ }
			//~ }
			
			//~ if (c.button.classList.contains('btn_on')) {
				//~ if (!editor.isActive(c.name, c.argument || {})) {
					//~ c.button.classList.remove('btn_on');
					//~ c.button.setAttribute('aria-pressed', 'false');
				//~ }
			//~ } else {
				//~ if (editor.isActive(c.name, c.argument || {})) {
					//~ c.button.classList.add('btn_on');
					//~ c.button.setAttribute('aria-pressed', 'true');
				//~ }
			//~ }
		//~ }
	//~ }
	
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
					Link.configure({
						openOnClick: false,
						autolink: true,
						defaultProtocol: 'https',
					}),
					Table.configure({
						resizable: true,
					}),
					TableRow,
					TableHeader,
					TableCell,
					Subscript,
					Superscript,
					Typography,
					Markdown4Spip,
					SpipTrailingNode,
			],
			onUpdate: ({ editor }) => {
				textarea.value = editor.storage.markdown.getMarkdown();
			}
	});
	
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
