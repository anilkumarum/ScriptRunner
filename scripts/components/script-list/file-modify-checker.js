import { checkReadAccess, reqReadAccess } from "../../js/file-handle.js";
import { UserscriptCard } from "./userscript-card.js";
import { html } from "../../js/om.compact.js";

export class FileModifyChecker extends HTMLElement {
	constructor(scriptsContainer) {
		super();
		this.scriptsContainer = scriptsContainer;
	}

	scriptElems = [];

	/**@param {UserscriptCard} scriptElem */
	async updateModifiedCode(scriptElem) {
		const file = await scriptElem.fileHandle.getFile();
		if (file.type !== "text/javascript") return;
		if (file.lastModified > (scriptElem.userScript.fileModifiedAt ?? 0)) scriptElem.updateCodeFromFile(file);
	}

	/**@param {UserscriptCard} scriptElem */
	async checkFileAndUpdateCode(scriptElem) {
		const hasAccess = await checkReadAccess(scriptElem.fileHandle);
		hasAccess ? this.updateModifiedCode(scriptElem) : this.scriptElems.push(scriptElem);
	}

	async reqPermissionAndUpdateCode() {
		const scriptElem = this.scriptElems[0];
		const fileHandle = scriptElem.fileHandle;
		const granted = await reqReadAccess(fileHandle);
		granted ? this.updateModifiedCode(scriptElem) : notify("Permission denied", "error");
		this.remove();
	}

	render() {
		return html`<div class="info-msg">Need permission to check &<br />Update modified file's script</div>
			<button class="undo-btn" @click=${this.reqPermissionAndUpdateCode.bind(this)}>Grant</button>
			<sr-icon ico="close" @click=${this.remove.bind(this)}></sr-icon>`;
	}

	async connectedCallback() {
		const promises = [];
		for (const scriptElem of this.scriptsContainer.shadowRoot.children)
			scriptElem["fileHandle"] && promises.push(this.checkFileAndUpdateCode(scriptElem));
		await Promise.all(promises);
		if (this.scriptElems.length === 0) return this.remove();
		this.replaceChildren(this.render());
	}
}

customElements.define("file-modify-checker", FileModifyChecker);
