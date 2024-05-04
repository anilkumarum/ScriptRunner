import { UserscriptCard } from "./userscript-card.js";
import { getAllUserScripts } from "../../db/userscript-db.js";
// @ts-ignore
import userscriptCss from "../../style/userscript-card.css" assert { type: "css" };

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

	render() {
		return userScripts.map((userScript) => new UserscriptCard(userScript));
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

	async connectedCallback() {
		if (userScripts.length === 0) return (this.className = "empty");
		this.shadowRoot.replaceChildren(...this.render());
		$on(document.body, "domainfilter", this.filterScriptsByDomain.bind(this));
	}
}

customElements.define("scripts-container", ScriptsContainer);
