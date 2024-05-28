import { CodeLine } from "../elements/code-line.js";

/**@param {Node} node, @param {number} position*/
export async function setCaretAt(node, position) {
	getSelection().setPosition(node, position);
}

/**@param {Range} caretRange, @param {CodeLine} crtLine*/
export function isLineEnd(caretRange, crtLine) {
	if (crtLine.lastElementChild) {
		if (caretRange.endContainer === crtLine.lastElementChild.lastChild) {
			return caretRange.endOffset === crtLine.lastElementChild.lastChild["length"];
		}
	} else if (caretRange.endContainer === crtLine.lastChild)
		return caretRange.endOffset === crtLine.lastChild["length"];

	return false;
}

/**@param {Range} range, @param {CodeLine} crtLine*/
export function moveElementsIntoNewLine(range, crtLine) {
	const crtNode = range.startContainer;
	if (crtNode instanceof Text) {
		const newTxtNode = crtNode.splitText(range.startOffset);
		const crtTagName = crtNode.parentElement.tagName;
		if (crtTagName === "CODE-LINE") range.insertNode(newTxtNode);
		else {
			range.setStartAfter(crtNode.parentElement);
			const element = document.createElement(crtNode.parentElement.tagName);
			element.appendChild(newTxtNode);
			range.insertNode(element);
		}
		range.setEndAfter(crtLine.lastChild);
		crtLine.nextElementSibling.appendChild(range.extractContents());
	} else if (crtNode === crtLine) this.activeLine.append(...crtLine.childNodes);
}
