import "../js/reset.js";
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
		if (!fileStream) return notify("Cannot read file", "error");
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
		$on(this, "keydown", this.handleKeyDown.bind(this));
		$on(this, "mouseup", ({ target }) => {
			const activeLines = this.querySelectorAll(":scope > code-line:--active");
			for (const activeLine of activeLines) activeLine["active"] = false;
			target.closest("code-line").active = true;
		});
	}

	handleKeyDown(event) {
		//prettier-ignore
		if ((event.altKey || event.metaKey) && this.codeProcessor?.altKeys[event.code]) return this.codeProcessor?.altKeys[event.code]();
		if (event.code !== "Tab") return;
		this.codeProcessor?.captureTab(event);
		event.preventDefault();
	}
}

customElements.define("code-editor-pad", CodeEditorPad);
