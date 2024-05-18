import { parseUserScriptMeta } from "../../js/parseUserScript.js";
import { CodeLine } from "../elements/code-line.js";
import { ScriptHighlighter } from "../highlighter/highlighter.js";
import { Brackets } from "../utils/enums.js";
import { setCaretAt } from "../utils/helper.js";

export class CodeProcessor {
	constructor() {}

	charInput(event) {
		const char = event.data;
		if (Brackets[char]) {
			const selection = getSelection();
			const focusNode = selection.focusNode;
			if (focusNode instanceof Text) {
				focusNode.insertData(selection.focusOffset, char + Brackets[char]);
				setCaretAt(focusNode, selection.focusOffset + 1);
				event.preventDefault();
			} else if (focusNode["tagName"] === "CODE-LINE") {
				focusNode.firstChild["insertData"](selection.focusOffset, char + Brackets[char]);
				setCaretAt(focusNode.firstChild, selection.focusOffset + 1);
				event.preventDefault();
			}
		}
	}

	/**@param {InputEvent} event*/
	inputTxtHandler = (event) => {
		event.data && this.charInput(event);
	};

	handleInputByType = {
		insertText: this.inputTxtHandler,
		insertParagraph: (event) => {
			this.insertNewLine();
			return event.preventDefault();
		},
		insertFromPaste: this.dropPasteHandler.bind(this),
		insertFromDrop: this.dropPasteHandler.bind(this),
	};

	dropPasteHandler(event) {
		const codeText = event.dataTransfer.getData("text/plain");
		if (!codeText) return;
		const codeReader = new ScriptHighlighter();
		const { userScriptProps, contentFrag } = codeReader.highlightLines(codeText);
		const focusNode = getSelection().focusNode;
		const activeLine = focusNode instanceof CodeLine ? focusNode : focusNode.parentElement.closest("code-line");
		activeLine.hasChildNodes() ? activeLine.after(contentFrag) : activeLine.before(contentFrag);
		activeLine.appendChild(contentFrag);
		userScriptProps && fireEvent(activeLine.parentElement, "metadata", userScriptProps);
		event.preventDefault();
	}

	insertNewLine() {
		const selection = getSelection();
		const focusNode = selection.focusNode;
		const focusElem = focusNode.nodeType === 1 ? focusNode : focusNode.parentElement;
		const lineElem = focusElem["closest"]("code-line");
		lineElem.active = false;
		lineElem.after(new CodeLine());
	}

	captureTab = (event) => {
		if (event.code !== "Tab") return;
		const selection = getSelection();
		const focusNode = selection.focusNode;
		if (focusNode instanceof Text) {
			focusNode.insertData(selection.focusOffset, "\t");
			setCaretAt(focusNode, selection.focusOffset + 1);
			event.preventDefault();
		} else if (focusNode["tagName"] === "CODE-LINE") {
			focusNode.firstChild["insertData"](selection.focusOffset, "\t");
			setCaretAt(focusNode.firstChild, selection.focusOffset + 1);
			event.preventDefault();
		}
		event.preventDefault();
	};
}
