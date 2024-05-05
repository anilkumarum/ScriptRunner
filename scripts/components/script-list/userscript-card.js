import { html, map, react } from "../../js/om.compact.js";
import { UserScript } from "../../db/Userscript.js";
import { deleteUserScriptInDb, updateUserScriptInDb } from "../../db/userscript-db.js";
import { addDomains } from "../domain-explorer.js";
import { unRegisterUserScript } from "../../js/register-userscript.js";

export class UserscriptCard extends HTMLElement {
	/**@param {UserScript} userScript*/
	constructor(userScript) {
		super();
		userScript.fileHandle && (this.fileHandle = userScript.fileHandle);
		this.userScript = react(userScript);
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

	async deleteScript() {
		await deleteUserScriptInDb(this.userScript.id);
		await unRegisterUserScript(this.userScript.id);
		this.remove();
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
			</userscript-code>
			<sr-icon ico="delete" title="delete script" class="delete-icon" @click=${this.deleteScript.bind(this)}></sr-icon>`;
	}

	connectedCallback() {
		this.replaceChildren(this.render());
	}
}

customElements.define("userscript-card", UserscriptCard);
