import { html } from "../js/om.event.js";

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const tabId = tab.id.toString();

export class ConsoleDialog extends HTMLDialogElement {
	constructor(scriptId) {
		super();
		this.scriptId = scriptId;
	}

	removeDialog() {
		chrome.storage.session.remove(tabId);
		this.remove();
	}

	render(outputs) {
		return html`<sr-icon
				ico="close-circle"
				title="close dialog"
				class="close-icon"
				@click=${this.removeDialog.bind(this)}></sr-icon>
			<ul>
				${outputs ? outputs.map((output) => `<li class="${output.type}">${output.stack}</li>`).join("") : ""}
			</ul>`;
	}

	async connectedCallback() {
		this.id = "console-dialog";
		const tabConsoles = (await chrome.storage.session.get(tabId))[tabId] ?? {};
		const outputs = tabConsoles[this.scriptId];
		this.replaceChildren(this.render(outputs));
		this.showModal();
	}
}

customElements.define("console-dialog", ConsoleDialog, { extends: "dialog" });
