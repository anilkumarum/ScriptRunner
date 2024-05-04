import { updateUserScriptInDb } from "../../scripts/db/userscript-db.js";
import { html } from "../js/om.event.js";

export class CodeEditorDialog extends HTMLDialogElement {
	constructor(scriptId, code) {
		super();
		this.scriptId = scriptId;
		this.code = code;
	}

	removeDialog() {
		this.remove();
	}

	async onEditDone() {
		const code = this.lastElementChild["innerText"].trim();
		await updateUserScriptInDb(this.scriptId, "code", code);
		const scriptElem = $("userscript-list").shadowRoot.getElementById(this.scriptId);
		$("pre", scriptElem).innerText = code;
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		chrome.tabs.reload(tab.id);
		this.remove();
	}

	render() {
		return html`<sr-icon
				ico="close-circle"
				title="close dialog"
				class="close-icon"
				@click=${this.removeDialog.bind(this)}></sr-icon>
			<sr-icon ico="done" title="done" class="done-icon" @click=${this.onEditDone.bind(this)}></sr-icon>
			<pre spellcheck="false" contenteditable="true">${this.code}</pre>`;
	}

	connectedCallback() {
		this.id = "code-editor-dialog";
		this.replaceChildren(this.render());
		this.showModal();
	}
}

customElements.define("code-editor-dialog", CodeEditorDialog, { extends: "dialog" });
