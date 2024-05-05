import { UserscriptCard } from "./userscript-card.js";
import { getAllUserScripts, updateUserScriptInDb, updateUserScriptInDb2 } from "../../db/userscript-db.js";
// @ts-ignore
import userscriptCss from "../../style/userscript-card.css" assert { type: "css" };
import { UserScript } from "../../db/Userscript.js";
import { parseUserScriptMeta } from "../../js/parseUserScript.js";

const userScripts = await getAllUserScripts();

export function addScriptElem(userScript) {
	const scriptElem = new UserscriptCard(userScript);
	const scriptsContainer = $("scripts-container");
	scriptsContainer.shadowRoot.appendChild(scriptElem);
	scriptsContainer.className && (scriptsContainer.className = "");
}

export class ScriptsContainer extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.adoptedStyleSheets = [userscriptCss];
	}

	/**@param {UserScript} userScript, @param {FileSystemFileHandle} fileHandle*/
	async updateCodeFromFile(userScript, fileHandle) {
		try {
			// @ts-ignore
			await fileHandle.requestPermission({ mode: "read" });
			const file = await fileHandle.getFile();
			if (file.type !== "text/javascript") return;
			if (file.lastModified > userScript.fileModifiedAt) {
				const reader = new FileReader();
				reader.onload = async ({ target }) => {
					const codeText = target.result;
					if (typeof codeText !== "string") return;
					const { code, userScriptProps } = parseUserScriptMeta(codeText);
					if (userScript.code !== code) {
						userScript.code = code;
						await updateUserScriptInDb(userScript.id, "code", code);
					}
					userScriptProps.fileModifiedAt = file.lastModified;
					updateUserScriptInDb2(userScript.id, userScriptProps);
				};
				reader.readAsText(file);
			}
		} catch (error) {
			console.error(error);
		}
	}

	filterScriptsByDomain({ detail: domain }) {
		scriptElem: for (const scriptElem of this.shadowRoot.children) {
			const matches = scriptElem["userScript"].matches;

			for (const page of matches) {
				if (page.split("://").at(-1).startsWith(domain)) {
					scriptElem["hidden"] = false;
					continue scriptElem;
				}
			}
			scriptElem["hidden"] = true;
		}
	}

	render() {
		return userScripts.map((userScript) => new UserscriptCard(userScript));
	}

	async connectedCallback() {
		if (userScripts.length === 0) return (this.className = "empty");
		this.shadowRoot.replaceChildren(...this.render());
		$on(document.body, "domainfilter", this.filterScriptsByDomain.bind(this));
		$onO(this, "click", () => {
			for (const scriptElem of this.shadowRoot.children)
				scriptElem["fileHandle"] && this.updateCodeFromFile(scriptElem["userScript"], scriptElem["fileHandle"]);
		});
	}
}

customElements.define("scripts-container", ScriptsContainer);
