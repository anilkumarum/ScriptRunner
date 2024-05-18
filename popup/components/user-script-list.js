import { UserscriptCard } from "./userscript-card.js";
import { getMatchUserScripts } from "../../scripts/db/userscript-db.js";
import { requestPermission } from "../../scripts/js/register-userscript.js";
// @ts-ignore
import userscriptCss from "../style/user-script.css" assert { type: "css" };
import formatCss from "../../scripts/style/script-format.css" assert { type: "css" };

export class UserscriptList extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.adoptedStyleSheets = [userscriptCss, formatCss];
	}

	render(userScripts) {
		return userScripts.map((userScript) => new UserscriptCard(userScript));
	}

	async connectedCallback() {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		const userScripts = await getMatchUserScripts(tab.url);
		if (userScripts.length === 0) return (this.className = "empty");
		this.shadowRoot.replaceChildren(...this.render(userScripts));
		requestPermission([tab.url]);
		this.userScriptIds = userScripts.map((script) => script.id);
	}
}

customElements.define("userscript-list", UserscriptList);
