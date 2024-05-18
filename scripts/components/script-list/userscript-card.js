import { deleteUserScriptInDb, updateUserScriptInDb, updateUserScriptInDb2 } from "../../db/userscript-db.js";
import { UserScriptMetaData } from "../../js/parseUserScript.js";
import { ActionSnackbar } from "../helper/action-snackbar.js";
import { html, map, react } from "../../js/om.compact.js";
import { UserScript } from "../../db/Userscript.js";
import { addDomains } from "../domain-explorer.js";
import "/scripts/code-editor/code-editor-pad.js";

export class UserscriptCard extends HTMLElement {
	/**@param {UserScript} userScript*/
	constructor(userScript) {
		super();
		userScript.fileHandle && (this.fileHandle = userScript.fileHandle);
		delete userScript.fileHandle;
		this.userScript = react(userScript);
	}

	/**@param {UserScriptMetaData} userScriptProps*/
	setuserScriptProps(userScriptProps, fileModifiedAt) {
		if (!userScriptProps) return;
		/* for (const key in userScriptProps) {
			if (!userScriptProps[key]) continue;
			if (key === "matches" || key === "excludeMatches") this.userScript[key].push(...userScriptProps[key]);
			else this.userScript[key] = userScriptProps[key];
		} */
		updateUserScriptInDb2(this.userScript.id, userScriptProps, fileModifiedAt);
	}

	/**@param {File} file*/
	async updateCodeFromFile(file) {
		const fileStream = file.stream();
		this.editorPad.inserFileContent(fileStream);
		this.userScript.fileModifiedAt = file.lastModified;
		$on(this.editorPad, "metadata", ({ detail }) => this.setuserScriptProps(detail, file.lastModified));
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
		this.editorPad.editable = target.checked;
		this.editorPad.focus();
	}

	async deleteScript() {
		const deleteId = setTimeout(deleteUserScriptInDb, 5000, [this.userScript.id]);
		this.hidden = true;
		try {
			const snackElem = new ActionSnackbar();
			document.body.appendChild(snackElem);
			await snackElem.show(deleteId);
			//this.remove();
		} catch (error) {
			this.hidden = false;
		}
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
						<input type="text" name="name"  .value=${() => this.userScript.name} @change=${this.updateScript.name}>
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
								<input type="url" @change=${this.addMatchPages.bind(this)} />
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
				<sr-icon ico="edit" title="edit code" class="edit-icon" @change=${this.toggleCodeEdit.bind(this)} toggle></sr-icon>
				<code-editor-pad spellcheck="false" @blur=${this.updateScript.code}></code-editor-pad>
			</userscript-code>
			<sr-icon ico="delete" title="delete script" class="delete-icon" @click=${this.deleteScript.bind(this)}></sr-icon>`;
	}

	connectedCallback() {
		this.replaceChildren(this.render());
		this.editorPad = $("code-editor-pad", this.children[1]);
		this.userScript.code && this.editorPad.inserCodeContent(this.userScript.code);
	}
}

customElements.define("userscript-card", UserscriptCard);
