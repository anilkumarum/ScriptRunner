import { html, map, react } from "../../js/om.compact.js";
import { UserScript } from "../../db/Userscript.js";
import { updateUserScriptInDb } from "../../db/userscript-db.js";
import { parseUserScriptMeta } from "../../js/parseUserScript.js";
import { updateUserScript } from "../../js/register-userscript.js";
import { addDomains } from "../domain-explorer.js";

export class UserscriptCard extends HTMLElement {
	/**@param {UserScript} userScript*/
	constructor(userScript) {
		super();
		userScript.fileHandle && this.updateCodeFromFile(userScript.fileHandle);
		this.userScript = react(userScript);
	}

	async updateCodeFromFile(fileHandle) {
		try {
			const file = await fileHandle.getFile();
			if (file.type !== "text/javascript") return;
			if (file.lastModified > this.userScript.fileModifiedAt) {
				const reader = new FileReader();
				reader.onload = ({ target }) => {
					const codeText = target.result;
					if (typeof codeText !== "string") return;
					const { code, userScriptProps } = parseUserScriptMeta(codeText);
					if (this.userScript.code !== code) {
						this.userScript.code = code;
						updateUserScriptInDb(this.userScript.id, "code", code);
					}
					//TODO update userScriptProps
				};
				reader.readAsText(file);
			}
		} catch (error) {
			console.error(error);
		}
	}

	updateScript = {
		name: ({ target }) => updateUserScriptInDb(this.userScript.id, "name", target.value),
		world: ({ target }) => updateUserScriptInDb(this.userScript.id, "world", target.value),
		runAt: ({ target }) => updateUserScriptInDb(this.userScript.id, "runAt", target.value),
		description: ({ target }) => updateUserScriptInDb(this.userScript.id, "description", target.value),
		code: ({ target }) => updateUserScriptInDb(this.userScript.id, "code", target.innerText),
	};

	addMatchPages({ target }) {
		this.userScript.matches.push(target.value);
		addDomains([target.value], this.userScript.id);
		const matches = Object.assign([], this.userScript.matches);
		updateUserScriptInDb(this.userScript.id, "matches", matches);
		target.value = "";
	}

	toggleCodeEdit({ target }) {
		target.nextElementSibling.setAttribute("contenteditable", target.checked);
	}

	render() {
		const chipItem = (page) =>
			html`<li class="chip-item">
				<span>${page.slice(8)}</span> <sr-icon ico="close" title="remove"></sr-icon>
			</li>`;

		return html`<userscript-details>
				<div>
					<div>
						<span>Name: </span>
						<input type="text" style="border:none" .value=${() => this.userScript.name} @change=${this.updateScript.name}>
					</div>
					<label>
						<span>Execution world: </span>
						<select name="inject_world" .value=${() => this.userScript.world} @change=${this.updateScript.world}>
							<option value="USER_SCRIPT">User script</option>
							<option value="MAIN">Main</option>
						</select>
					</label>
				</div>
				<div>
					<div class="matches">
						<span>Matches: </span>
						<details>
							<summary><var>${this.userScript.matches[0] ?? "No page match"}</var></sr-icon></summary>
							<div class="match-pages">
								<input type="text" @change=${this.addMatchPages.bind(this)} />
								<ul>${map(this.userScript.matches, chipItem)}</ul>
							</div>
						</details>
					</div>
					<label>
						<span>Inject At: </span>
						<select name="inject_at" .value=${() => this.userScript.runAt} @change=${this.updateScript.runAt}>
							<option value="document_idle">Idle</option>
							<option value="document_start">Before loaded</option>
							<option value="document_end">After loaded</option>
						</select>
					</label>
				</div>
				<div>
					<span>Description: </span>
					<textarea rows="2" .value=${() => this.userScript.description} @change=${this.updateScript.description}></textarea>
				</div>
			</userscript-details>
			<userscript-code>
				<sr-icon ico="edit" title="edit code" class="edit-icon" @change=${this.toggleCodeEdit} checked></sr-icon>
				<pre spellcheck="false" @blur=${this.updateScript.code}>${() => this.userScript.code}</pre>
			</userscript-code>`;
	}

	connectedCallback() {
		this.replaceChildren(this.render());
	}
}

customElements.define("userscript-card", UserscriptCard);
