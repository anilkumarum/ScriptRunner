import { CodeLine } from "./elements/code-line.js";
import { ScriptHighlighter } from "./highlighter/highlighter.js";
import { CodeProcessor } from "./processor/code-processor.js";
// @ts-ignore
import formatCss from "../style/script-format.css" assert { type: "css" };
document.adoptedStyleSheets.push(formatCss);

export class CodeEditorPad extends HTMLElement {
	constructor() {
		super();
	}

	/**@param {boolean} editable*/
	set editable(editable) {
		this.codeProcessor = editable ? new CodeProcessor() : null;
		this.setAttribute("contenteditable", editable.toString());
	}

	/**@param {ReadableStream<Uint8Array>} fileStream  */
	async inserFileContent(fileStream) {
		try {
			const codeReader = new ScriptHighlighter();
			for await (const contentFrag of codeReader.readAndHighlightLines(fileStream)) {
				contentFrag instanceof DocumentFragment
					? this.replaceChildren(contentFrag)
					: fireEvent(this, "metadata", contentFrag);
			}
		} catch (error) {
			console.error(error);
		} finally {
			this.append(new CodeLine());
		}
	}

	async inserCodeContent(codeContent) {
		const codeReader = new ScriptHighlighter();
		const { userScriptProps, contentFrag } = codeReader.highlightLines(codeContent);
		this.appendChild(contentFrag);
		fireEvent(this, "metadata", userScriptProps);
	}

	async connectedCallback() {
		this.setAttribute("spellcheck", "false");
		this.setListener();
	}

	setListener() {
		$on(this, "beforeinput", (event) => this.codeProcessor?.handleInputByType[event.inputType]?.(event));
		$on(this, "keydown", this.codeProcessor?.captureTab);
		$on(this, "mouseup", ({ target }) => {
			const activeLine = this.querySelector(":scope > code-line:--active");
			activeLine && (activeLine["active"] = false);
			target.closest("code-line").active = true;
		});
	}
}

customElements.define("code-editor-pad", CodeEditorPad);
