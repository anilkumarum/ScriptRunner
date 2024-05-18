import { html } from "../js/om.event.js";
import { ConsoleDialog } from "./console-dialog.js";
import { UserScript } from "../../scripts/db/Userscript.js";
import { updateUserScriptInDb } from "../../scripts/db/userscript-db.js";
import { ScriptHighlighter } from "../../scripts/code-editor/highlighter/highlighter.js";
import {
	checkUserScriptRegister,
	registerUserScript,
	unRegisterUserScript,
} from "../../scripts/js/register-userscript.js";

export class UserscriptCard extends HTMLElement {
	/**@param {UserScript} userScript*/
	constructor(userScript) {
		super();
		this.userScript = userScript;
	}

	async openCodeEditor() {
		const { CodeEditorDialog } = await import("./code-editor-dialog.js");
		const codeEditorDialog = new CodeEditorDialog(this.userScript.id, this.userScript.code);
		document.body.appendChild(codeEditorDialog);
	}

	openConsole() {
		const consoleDialog = new ConsoleDialog(this.userScript.id);
		document.body.appendChild(consoleDialog);
	}

	async reloadTab() {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		chrome.tabs.reload(tab.id);
	}

	async updateInjectWorld({ target }) {
		await updateUserScriptInDb(this.userScript.id, "world", target.value);
		this.reloadTab();
	}

	async updateRunAt({ target }) {
		await updateUserScriptInDb(this.userScript.id, "runAt", target.value);
		this.reloadTab();
	}

	async toggleScriptInject({ target }) {
		if (target.checked) {
			await registerUserScript(this.userScript);
		} else {
			await unRegisterUserScript(this.userScript.id);
		}
		this.reloadTab();
	}

	insertHighlightedCode() {
		const codeReader = new ScriptHighlighter();
		const { contentFrag } = codeReader.highlightLines(this.userScript.code.replaceAll("\n", " "));
		$("pre", this).append(...contentFrag.firstElementChild.childNodes);
	}

	render() {
		return html`<input
				type="checkbox"
				name=""
				class="toggle_inject"
				@change=${this.toggleScriptInject.bind(this)} />
			<userscript-bar>
				<div><sr-icon ico="script" title="script name"></sr-icon> <span>${this.userScript.name}</span></div>
				<label style="margin-left: auto">
					<sr-icon ico="world" title="Execution world"></sr-icon>
					<select name="inject_world" value=${this.userScript.world} @change=${this.updateInjectWorld.bind(this)}>
						<option value="USER_SCRIPT">User script</option>
						<option value="MAIN">Main</option>
					</select>
				</label>
				<label>
					<sr-icon ico="timer" title="Inject At"></sr-icon>
					<select name="inject_at" value="${this.userScript.runAt}" @change=${this.updateRunAt.bind(this)}>
						<option value="document_idle">Idle</option>
						<option value="document_start">Before loaded</option>
						<option value="document_end">After loaded</option>
					</select>
				</label>
			</userscript-bar>
			<div class="description" style="display:${this.userScript.description ? "flex" : "none"}">
				<sr-icon ico="info" title="Description"></sr-icon><var>${this.userScript.description}</var>
			</div>
			<code-block-box>
				<code-preview>
					<pre></pre>
					<sr-icon
						ico="edit"
						title="edit code"
						class="edit-icon"
						@click=${this.openCodeEditor.bind(this)}></sr-icon>
				</code-preview>
				<sr-icon ico="console" title="Open debug console" @click=${this.openConsole.bind(this)}></sr-icon>
			</code-block-box>`;
	}

	async connectedCallback() {
		this.id = this.userScript.id;
		this.replaceChildren(this.render());
		this.insertHighlightedCode();
		$('select[name="inject_at"]', this).value = this.userScript.runAt; //temp
		this.firstElementChild["checked"] = await checkUserScriptRegister(this.userScript.id);
	}
}

customElements.define("userscript-card", UserscriptCard);
