import { CodeEditorPad } from "/scripts/code-editor/code-editor-pad.js";
import { getFileReadStream } from "../../js/file-handle.js";
import { UserScriptMetaData } from "../../js/parseUserScript.js";

export class ScriptCodeEditor extends HTMLElement {
	constructor(userScript, fileHandle) {
		super();
		this.userScript = userScript;
		this.fileHandle = fileHandle;
	}

	/**@param {UserScriptMetaData} userScriptProps*/
	setuserScriptProps(userScriptProps) {
		if (!userScriptProps) return;
		for (const key in userScriptProps) {
			if (!userScriptProps[key]) continue;
			if (key === "matches" || key === "excludeMatches") this.userScript[key].push(...userScriptProps[key]);
			else this.userScript[key] = userScriptProps[key];
		}
	}

	updateCode({ target }) {
		this.userScript.code = target.innerText.trim();
	}

	async connectedCallback() {
		this.editorPad = new CodeEditorPad();
		this.editorPad.editable = true;
		if (this.fileHandle) {
			const fileStream = await getFileReadStream(this.fileHandle);
			this.editorPad.inserFileContent(fileStream);
		} else this.editorPad.appendChild(document.createElement("code-line"));
		$on(this.editorPad, "metadata", ({ detail }) => this.setuserScriptProps(detail));
		this.appendChild(this.editorPad);
	}
}

customElements.define("script-code-editor", ScriptCodeEditor);
