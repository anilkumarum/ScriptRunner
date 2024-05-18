/**@param {Node} node, @param {number} position*/
export async function setCaretAt(node, position) {
	getSelection().setPosition(node, position);
}
