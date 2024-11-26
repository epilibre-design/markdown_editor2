import { Markdown } from 'tiptap-markdown';
import SpipModel from '../nodes/SpipModel';

const Markdown4Spip = Markdown.configure({
	tightLists: false,            // No <p> inside <li> in markdown output
	linkify: true,              // Create links from "https://..." text
	breaks: true,               // New lines (\n) in markdown input are converted to <br>
	transformPastedText: false,  // Allow to paste markdown text in the editor
	transformCopiedText: true,  // Copied text is transformed to markdown
	
  //~ extensions: [
    //~ {
      //~ type: 'node',
      //~ name: 'spip_model',
      //~ toMarkdown(state, node) {
        //~ // Convert your node to the desired Markdown format
        //~ state.write(node.attrs.spip_model.full || '');
      //~ },
      //~ parseMarkdown: {
        //~ // Define how to parse the shortcode from Markdown back into the node
        //~ node: 'spip_model',
        //~ getAttrs: token => ({
          //~ shortcode: token.content,
        //~ }),
      //~ },
    //~ },
  //~ ],
});

export default Markdown4Spip;
