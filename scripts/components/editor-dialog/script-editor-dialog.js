import { registerUserScript } from "../../js/register-userscript.js";
import { addScriptElem } from "../script-list/scripts-container.js";
import { saveUserScriptInDb } from "../../db/userscript-db.js";
import { getFileReadStream } from "../../js/file-handle.js";
import { html, map, react } from "../../js/om.compact.js";
import { ScriptCodeEditor } from "./scriptcode-editor.js";
import { UserScript } from "../../db/Userscript.js";
import { addDomains } from "../domain-explorer.js";
import { ReportBug } from "../helper/report-bug.js";
// @ts-ignore
import formCss from "../../style/script-editor-dialog.css" assert { type: "css" };
document.adoptedStyleSheets.push(formCss);

const pageUrls = (await chrome.tabs.query({})).map((tab) => tab.url).filter((url) => url);

export class ScriptEditorDialog extends HTMLDialogElement {
	/**@param {FileSystemFileHandle[]} [fileHandles] */
	constructor(fileHandles) {
		super();
		if (fileHandles) {
			this.fileHandles = fileHandles;
			this.fileIdx = 0;
			const fileHandle = fileHandles[this.fileIdx];
			this.userScript = react(new UserScript(fileHandle.name.slice(0, -3)));
			this.userScript.fileHandle = fileHandle;
		} else this.userScript = react(new UserScript());
		this.scriptEditor = new ScriptCodeEditor(this.userScript, fileHandles?.[this.fileIdx]);
	}

	async setNextScriptFile() {
		const metaKeys = ["description", "version", "author", "icon"];
		const fileHandle = this.fileHandles[this.fileIdx];
		for (const key of metaKeys) this.userScript[key] = "";
		this.userScript.name = fileHandle.name.slice(0, -3);
		this.userScript.matches.splice(0, this.userScript.matches.length);
		this.userScript.excludeMatches.splice(0, this.userScript.excludeMatches.length);
		this.userScript.fileHandle = fileHandle;
		const fileStream = await getFileReadStream(fileHandle);
		this.scriptEditor.editorPad.inserFileContent(fileStream);
	}

	async saveScript() {
		if (this.userScript.matches === 0) return notify("Atleast one match page required", "error");
		const userScript = Object.assign({}, this.userScript);
		userScript.matches = Object.assign([], this.userScript.matches);
		userScript.excludeMatches = Object.assign([], this.userScript.excludeMatches);
		userScript.code = this.scriptEditor.innerText;

		try {
			addScriptElem(structuredClone(userScript));
			toast("Script updated");
			await saveUserScriptInDb(userScript);
			await registerUserScript(userScript);
			addDomains(userScript.matches, this.userScript.id);
			if (this.fileHandles && this.fileHandles[++this.fileIdx]) this.setNextScriptFile();
			else this.remove();
		} catch (error) {
			console.error(error);
			document.body.appendChild(new ReportBug(error));
		}
	}

	removeMatchPage({ currentTarget, target }) {
		const page = target.closest("li").textContent.trim();
		const idx = this.userScript.matches.indexOf(page);
		if (idx !== -1) this.userScript.matches.splice(idx, 1);
		if (!target.closest("sr-icon")) currentTarget.previousElementSibling.previousElementSibling.value = page;
	}

	removeExcludePage({ currentTarget, target }) {
		const page = target.closest("li").textContent.trim();
		const idx = this.userScript.excludeMatches.indexOf(page);
		if (idx !== -1) this.userScript.excludeMatches.splice(idx, 1);
		if (!target.closest("sr-icon")) currentTarget.previousElementSibling.value = page;
	}

	addMatchPages({ code, target }) {
		if (code !== "Enter") return;
		this.userScript.matches.push(target.value);
		target.value = "";
	}

	addexcludeMatchPages({ target }) {
		this.userScript.excludeMatches.push(target.value);
		target.value = "";
	}

	render() {
		const chipItem = (page) =>
			html`<li class="chip-item"><span>${page}</span> <sr-icon ico="close" title="remove"></sr-icon></li>`;

		return html` <sr-icon
				ico="close-circle"
				title="close dialog"
				class="close-icon"
				@click=${this.remove.bind(this)}></sr-icon>
			<userscript-form>
				<div>
					<label>${i18n("script_name")}</label>
					<input type="text" name="script_name" .value=${() => this.userScript.name} />
				</div>

				<div class="inject-info-row">
					<div>
						<label>${i18n("execution_world")}</label>
						<select name="inject_world" .value=${() => this.userScript.world}>
							<option value="USER_SCRIPT">User script</option>
							<option value="MAIN">Main</option>
						</select>
					</div>

					<div>
						<label>Inject At</label>
						<select name="inject_at" .value=${() => this.userScript.runAt}>
							<option value="document_idle">Idle</option>
							<option value="document_start">Before loaded</option>
							<option value="document_end">After loaded</option>
						</select>
					</div>
				</div>

				<div>
					<label>${i18n("pages_where_script_inject")} </label>
					<input type="url" name="matches" list="tab-urls" @keyup=${this.addMatchPages.bind(this)} />
					<datalist id="tab-urls">${pageUrls.map((url) => html`<option value="${url}"></option>`)}</datalist>
					<ul class="chip-list" @click=${this.removeMatchPage.bind(this)}>
						${map(this.userScript.matches, chipItem)}
					</ul>
				</div>

				<div>
					<label>${i18n("pages_where_script_not_inject")} </label>
					<input type="url" @change=${this.addexcludeMatchPages.bind(this)} />
					<ul class="chip-list" @click=${this.removeExcludePage.bind(this)}>
						${map(this.userScript.excludeMatches, chipItem)}
					</ul>
				</div>

				<div>
					<label>Description: </label>
					<textarea rows="2" .value=${() => this.userScript.description}></textarea>
				</div>
				<userscript-code></userscript-code>
			</userscript-form>
			<button @click=${this.saveScript.bind(this)}>${i18n("submit")}</button>`;
	}

	connectedCallback() {
		this.id = "script-editor-dialog";
		this.replaceChildren(this.render());
		$("userscript-code", this).appendChild(this.scriptEditor);
		this.showModal();
	}
}

customElements.define("script-editor-dialog", ScriptEditorDialog, { extends: "dialog" });
