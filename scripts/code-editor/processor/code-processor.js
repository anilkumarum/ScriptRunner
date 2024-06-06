import { ScriptHighlighter } from "../highlighter/highlighter.js";
import { setCaretAt } from "./processor-helper.js";
import { CommandHandler } from "./command-handler.js";
import { CodeLine } from "../elements/code-line.js";
import { TwinChars } from "../utils/enums.js";

export class CodeProcessor extends CommandHandler {
	constructor() {
		super();
	}

	insertTwinChar(char) {
		const selection = getSelection();
		const focusText = selection.focusNode instanceof Text ? selection.focusNode : selection.focusNode.firstChild;
		if (focusText["data"][selection.focusOffset + 1]) return;
		if (selection.anchorOffset !== selection.focusOffset) {
			const anchorText =
				selection.anchorNode instanceof Text ? selection.anchorNode : selection.anchorNode.firstChild;
			focusText["insertData"](selection.focusOffset, TwinChars[char]);
			anchorText["insertData"](selection.anchorOffset, char);
		} else {
			focusText["insertData"](selection.focusOffset, char + TwinChars[char]);
			setCaretAt(focusText, selection.focusOffset + 1);
		}
		return true;
	}

	charInput(event) {
		const char = event.data;
		if (TwinChars[char]) this.insertTwinChar(char) && event.preventDefault();
	}

	/**@param {InputEvent} event*/
	inputTxtHandler = (event) => {
		event.data && this.charInput(event);
	};

	handleInputByType = {
		insertText: this.inputTxtHandler,
		insertParagraph: (event) => {
			/* this.insertNewLine();
			return event.preventDefault(); */
		},
		insertFromPaste: this.dropPasteHandler.bind(this),
		insertFromDrop: this.dropPasteHandler.bind(this),
		deleteContentForward: this.deleteInsideWord.bind(this),
	};

	async dropPasteHandler(event) {
		event.preventDefault();
		const pasteData = event.dataTransfer.getData("text/plain");
		let codeText = pasteData;
		if (pasteData.startsWith("https://") && pasteData.endsWith(".user.js")) {
			try {
				const response = await fetch(pasteData);
				if (!response.headers.get("Content-Type").startsWith("text/javascript"))
					return notify("invalid mimeType", "error");
				codeText = await response.text();
			} catch (error) {
				return notify(error.message, "error");
			}
		}

		if (!codeText) return;
		const codeReader = new ScriptHighlighter();
		const { userScriptProps, contentFrag } = codeReader.highlightLines(codeText);
		const focusNode = getSelection().focusNode;
		const activeLine = focusNode instanceof CodeLine ? focusNode : focusNode.parentElement.closest("code-line");
		activeLine.hasChildNodes() ? activeLine.after(contentFrag) : activeLine.before(contentFrag);
		activeLine.appendChild(contentFrag);
		userScriptProps && fireEvent(activeLine.parentElement, "metadata", userScriptProps);
	}

	/* insertNewLine() {
		const selection = getSelection();
		const caretRange = selection.getRangeAt(0);
		const focusNode = selection.focusNode;
		const focusElem = focusNode.nodeType === 1 ? focusNode : focusNode.parentElement;
		const lineElem = focusElem["closest"]("code-line");
		lineElem.active = false;
		lineElem.after(new CodeLine());

		const lineEnd = isLineEnd(caretRange, lineElem);
		lineEnd || moveElementsIntoNewLine(caretRange, lineElem);
	} */

	deleteLine(event) {
		const selection = getSelection();
		if (selection.focusOffset !== selection.anchorOffset) return;

		const focusNode = selection.focusNode;
		if (!focusNode.previousSibling) {
			const focusElem = focusNode.nodeType === 1 ? focusNode : focusNode.parentElement;
			const lineElem = focusElem["closest"]("code-line");
			lineElem.previousElementSibling?.append(...lineElem.childNodes);
			lineElem.remove();
			setCaretAt(focusNode, 0);
			return event.preventDefault();
		}
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
